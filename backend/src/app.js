// backend/src/app.js
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import autosRoutes from "./routes/autos.routes.js";
import publicarRoutes from "./routes/publicar.routes.js";

export const app = express();

app.use(express.json());

// ✅ Orígenes permitidos desde ENV (separados por coma)
const rawOrigins = (env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const exactOrigins = new Set(rawOrigins.filter((o) => !o.includes("*")));
const wildcardPatterns = rawOrigins
  .filter((o) => o.includes("*"))
  .map((pattern) => {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    const regexStr = "^" + escaped.replace("\\*", ".*") + "$";
    return new RegExp(regexStr);
  });

function isOriginAllowed(origin) {
  if (!origin) return true; // Postman/curl o server-to-server
  if (exactOrigins.has(origin)) return true;
  return wildcardPatterns.some((re) => re.test(origin));
}

// ✅ CORS (aquí SI validamos el origin, en vez de bloquear “a mano”)
const corsMiddleware = cors({
  origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
});

app.use(corsMiddleware);
app.use(corsMiddleware);


// Rutas
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/autos", autosRoutes);
app.use("/publicar", publicarRoutes);

app.use(errorHandler);
