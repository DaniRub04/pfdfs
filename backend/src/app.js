import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";

export const app = express();

app.use(express.json());

const allowed = new Set([
    env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]);

const corsMiddleware = cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        return allowed.has(origin)
            ? cb(null, true)
            : cb(new Error("CORS bloqueado"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
});

app.use(corsMiddleware);

// ✅ Preflight (sin romper Express)
app.options(/.*/, corsMiddleware);

// Rutas
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

app.get("/health", (req, res) => {
    res.json({ ok: true });
});

app.use(errorHandler);
