// backend/src/routes/publicar.routes.js
import { Router } from "express";
import { publicar, listarPublicaciones } from "../controllers/publicar.controllers.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

/**
 * GET /publicar
 * Público - Lista publicaciones (para landing)
 */
router.get("/", listarPublicaciones);

/**
 * POST /publicar
 * Privado - Crear publicación
 */
router.post("/", auth, publicar);

export default router;
