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

const corsMiddleware = cors({
    origin: (origin, cb) => {
        if (isOriginAllowed(origin)) return cb(null, true);
        // ❗No lances Error directo: mejor “false” para que responda sin romper
        return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // ✅ usa false si tu auth es JWT por header
    optionsSuccessStatus: 204,
});

app.use(corsMiddleware);

// ✅ FIX: en algunas versiones, "*" rompe path-to-regexp
app.options(/.*/, corsMiddleware);

// ✅ Si alguien no permitido pega, responde claro (evita “misterios”)
app.use((req, res, next) => {
    const origin = req.headers.origin;
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
