// backend/src/routes/publicar.routes.js
import { Router } from "express";
import { publicar } from "../controllers/publicar.controllers.js"; 
// 👆 OJO: revisa que el nombre del archivo sea EXACTAMENTE publicar.controller.js

// Si tienes middleware de autenticación:
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

/**
 * POST /publicar
 * Crea una nueva publicación
 * Requiere autenticación
 */

// 🔥 Recomiendo dejar requireAuth activo en producción
router.post("/", requireAuth, publicar);

// Si quieres permitir publicar sin login (no recomendado), usa esto:
// router.post("/", publicar);

export default router;
