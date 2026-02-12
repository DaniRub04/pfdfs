// backend/src/app.js
import express from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import autosRoutes from "./routes/autos.routes.js";
import publicarRoutes from "./routes/publicar.routes.js";

export const app = express();

app.use(express.json());

/* =====================================================
   CONFIGURACIÓN CORS (MODO DEBUG - ABIERTO)
===================================================== */

const corsMiddleware = cors({
  origin: true, // 🔥 permite cualquier origin temporalmente
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

app.use(corsMiddleware);

/* =====================================================
   RUTAS
===================================================== */

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/autos", autosRoutes);
app.use("/publicar", publicarRoutes);

/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(errorHandler);
