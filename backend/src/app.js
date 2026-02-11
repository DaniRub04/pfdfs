import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import autosRoutes from "./routes/autos.routes.js";

export const app = express();

app.use(express.json());

// ✅ 1) Lista de orígenes permitidos desde ENV (separados por coma)
// Ejemplo ENV:
// CORS_ORIGIN=http://localhost:5173,https://autosusados.vercel.app,https://autosusados-*.vercel.app
const rawOrigins = (env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// ✅ 2) Separamos: exactos y patrones (para previews tipo autosusados-xxxxx.vercel.app)
const exactOrigins = new Set(rawOrigins.filter((o) => !o.includes("*")));
const wildcardPatterns = rawOrigins
  .filter((o) => o.includes("*"))
  .map((pattern) => {
    // convierte https://autosusados-*.vercel.app -> regex
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    const regexStr = "^" + escaped.replace("\\*", ".*") + "$";
    return new RegExp(regexStr);
  });

function isOriginAllowed(origin) {
  if (!origin) return true; // postman/curl o server-to-server
  if (exactOrigins.has(origin)) return true;
  return wildcardPatterns.some((re) => re.test(origin));
}

/**
 * ✅ CORS: siempre responde headers CORS (para que el navegador no bloquee)
 * 🔒 La seguridad real (quién puede POST/PUT/DELETE) la manejamos abajo con isOriginAllowed
 */
const corsMiddleware = cors({
  origin: (origin, cb) => {
    // Siempre permitimos que CORS agregue headers.
    // La restricción real se hace en el middleware de abajo para métodos sensibles.
    return cb(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // JWT por header
  optionsSuccessStatus: 204,
});

app.use(corsMiddleware);

// ✅ Responde TODOS los preflight (OPTIONS) de una vez (evita errores de CORS en login)
app.options(/.*/, corsMiddleware);

// 🔒 Control de origen para mutaciones (POST/PUT/PATCH/DELETE)
// - GET: público (landing)
// - OPTIONS: responde 204 (preflight)
// - /auth: público (login/registro) para que no te lo bloquee CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // 🌐 GET siempre público
  if (req.method === "GET") return next();

  // ✅ Preflight: responder rápido (aunque corsMiddleware ya lo cubre, esto evita caídas)
  if (req.method === "OPTIONS") return res.sendStatus(204);

  // 🔓 Auth público (login/registro)
  // Nota: este middleware corre ANTES de app.use("/auth", ...), por eso req.path incluye "/auth/..."
  if (req.path.startsWith("/auth")) return next();

  // 🔒 Mutaciones sensibles solo desde orígenes permitidos
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({
      ok: false,
      message: "CORS bloqueado",
      origin,
    });
  }

  next();
});

// Rutas
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/autos", autosRoutes);

// Health check (Render)
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(errorHandler);
