import { Router } from "express";
import { publicar } from "../controllers/publicar.controllers.js";
// Si tienes auth middleware, ponlo aquí:
// import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

// router.post("/", requireAuth, publicar);
router.post("/", publicar);

export default router;
