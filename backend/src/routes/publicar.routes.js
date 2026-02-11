// backend/src/routes/publicar.routes.js
import { Router } from "express";
import { publicar } from "../controllers/publicar.controller.js";

// Si ya tienes middleware auth: import { requireAuth } from "../middlewares/auth.js";
const router = Router();

// Si quieres que SOLO usuarios logeados publiquen, descomenta requireAuth
// router.post("/", requireAuth, publicar);

router.post("/", publicar);

export default router;
