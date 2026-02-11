import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import autosRoutes from "./routes/autos.routes.js";
// si ya tienes publicar:
// import publicarRoutes from "./routes/publicar.routes.js";

export const app = express();

app.use(express.json());

function normalizeOriginValue(v) {
  if (!v) return "";
  return String(v).trim().replace(/\/$/, ""); // quita "/" final
}

// ✅ 1) Lista de orígenes permitidos desde ENV (separados por coma)
const rawOrigins = (env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => normalizeOriginValue(o))
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

  const o = normalizeOriginValue(origin);

  if (exactOrigins.has(o)) return true;
  if (wildcardPatterns.some((re) => re.test(o))) return true;

  // ✅ extra seguro para Vercel previews (por si ENV trae algo raro)
  // permite https://autosusados-<cualquier>.vercel.app
  if (/^https:\/\/autosusados-.*\.vercel\.app$/.test(o)) return true;

  return false;
}

/**
 * ✅ CORS: agrega headers siempre (para que el navegador no bloquee antes)
 * La restricción real la hacemos abajo con isOriginAllowed
 */
const corsMiddleware = cors({
  origin: (origin, cb) => cb(null, true),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
});

app.use(corsMiddleware);

// ✅ Preflight global
app.options(/.*/, corsMiddleware);

// 🔒 Control de origen para mutaciones (POST/PUT/PATCH/DELETE)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // 🌐 GET siempre público
  if (req.method === "GET") return next();

  // ✅ Preflight: responder rápido
  if (req.method === "OPTIONS") return res.sendStatus(204);

  // 🔓 Auth público (login/registro)
  if (req.path.startsWith("/auth")) return next();

  // 🔒 Mutaciones sensibles solo desde orígenes permitidos
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({
      ok: false,
      message: "CORS bloqueado",
      origin: normalizeOriginValue(origin),
      allowed_examples: Array.from(exactOrigins).slice(0, 10),
    });
  }

  next();
});

// Rutas
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/autos", autosRoutes);

// si ya tienes publicar:
// app.use("/publicar", publicarRoutes);

// Health check (Render)
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(errorHandler);
