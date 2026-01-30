import { Router } from "express";
import {
    getAutos,
    getAutoById,
    createAuto,
    updateAuto,
    deleteAuto,
} from "../controllers/autos.controller.js";

import { auth } from "../middlewares/auth.js";

const router = Router();

// Públicas
router.get("/", getAutos);
router.get("/:id", getAutoById);

// Protegidas
router.post("/", auth, createAuto);
router.put("/:id", auth, updateAuto);
router.delete("/:id", auth, deleteAuto);

export default router;

