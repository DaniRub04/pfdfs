// backend/src/routes/publicar.routes.js
import { Router } from "express";
import { publicar } from "../controllers/publicar.controllers.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

/**
 * POST /publicar
 * Requiere usuario autenticado
 */
router.post("/", auth, publicar);

export default router;
