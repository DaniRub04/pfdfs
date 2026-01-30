import { Router } from "express";
import { auth } from "../middlewares/auth.js";

const router = Router();

// Ruta protegida: si no hay token, no entra
router.get("/me", auth, (req, res) => {
  res.json({
    ok: true,
    user: req.user, // viene del JWT
  });
});

export default router;
