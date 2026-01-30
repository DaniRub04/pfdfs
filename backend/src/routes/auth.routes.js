import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";

const router = Router();

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan campos" });
    }

    // ¿ya existe?
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length) {
      return res.status(409).json({ ok: false, message: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (nombre, email, password_hash)
       VALUES ($1,$2,$3)
       RETURNING id, nombre, email, creado_en`,
      [nombre, email, password_hash]
    );

    res.status(201).json({ ok: true, user: rows[0] });
  } catch (e) {
    next(e);
  }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    const { rows } = await pool.query(
      "SELECT id, nombre, email, password_hash FROM users WHERE email=$1",
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ ok: false, message: "Credenciales inválidas" });

    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) return res.status(401).json({ ok: false, message: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, email: user.email, nombre: user.nombre },
      env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      ok: true,
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email },
    });
  } catch (e) {
    next(e);
  }
});

// POST /auth/reset-password (SOLO DESARROLLO)
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "Email y nueva contraseña requeridos",
      });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    const { rowCount } = await pool.query(
        "UPDATE users SET password_hash = $1 WHERE email = $2",
        [password_hash, email]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      ok: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (e) {
    next(e);
  }
});


export default router;
