import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import autosRoutes from "./routes/autos.routes.js";

export const app = express();

app.use(express.json());

// Permitir múltiples orígenes desde env (separados por coma)
const allowedOrigins = new Set(
    env.CORS_ORIGIN.split(",").map(o => o.trim())
);

const corsMiddleware = cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        return allowedOrigins.has(origin)
            ? cb(null, true)
            : cb(new Error("CORS bloqueado"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
});

app.use(corsMiddleware);
app.options(/.*/, corsMiddleware);

// Rutas
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/autos", autosRoutes);

// Health check (Render)
app.get("/health", (req, res) => {
    res.json({ ok: true });
});

app.use(errorHandler);
