import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { sendVerifyEmail } from "../utils/mailer.js";

const router = Router();

/* =========================
   POST /auth/register
   Crea user + manda correo verificación
========================= */
router.post("/register", async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan campos" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanNombre = nombre.trim();

    // ¿ya existe?
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [cleanEmail]);
    if (exists.rows.length) {
      return res.status(409).json({ ok: false, message: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // token + expiración (1 hora)
    const verify_token = crypto.randomBytes(32).toString("hex");
    const verify_expires = new Date(Date.now() + 1000 * 60 * 60);

    // Inserta con verificación pendiente
    const { rows } = await pool.query(
        `INSERT INTO users (nombre, email, password_hash, verified, verify_token, verify_expires)
       VALUES ($1,$2,$3,false,$4,$5)
       RETURNING id, nombre, email, verified, creado_en`,
        [cleanNombre, cleanEmail, password_hash, verify_token, verify_expires]
    );

    // Link a tu FRONT (Vercel) -> página /verify
    const verifyUrl = `${env.APP_URL}/verify?token=${verify_token}`;

    // Enviar correo
    await sendVerifyEmail({
      to: cleanEmail,
      name: cleanNombre,
      verifyUrl,
    });

    return res.status(201).json({
      ok: true,
      message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
      user: rows[0],
    });
  } catch (e) {
    next(e);
  }
});

/* =========================
   GET /auth/verify?token=...
   Activa la cuenta
========================= */
router.get("/verify", async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ ok: false, message: "Token requerido" });
    }

    const { rowCount, rows } = await pool.query(
        `UPDATE users
       SET verified=true,
           verify_token=NULL,
           verify_expires=NULL
       WHERE verify_token=$1
         AND verify_expires > now()
         AND verified=false
       RETURNING id, email, verified`,
        [token]
    );

    if (rowCount === 0) {
      return res.status(400).json({
        ok: false,
        message: "Token inválido o expirado.",
      });
    }

    return res.json({
      ok: true,
      message: "Cuenta verificada correctamente. Ya puedes iniciar sesión.",
      user: rows[0],
    });
  } catch (e) {
    next(e);
  }
});

/* =========================
   POST /auth/login
   Bloquea si verified=false
========================= */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { rows } = await pool.query(
        "SELECT id, nombre, email, password_hash, verified FROM users WHERE email=$1",
        [cleanEmail]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    // 🔒 Bloquear login si no verificó
    if (!user.verified) {
      return res.status(403).json({
        ok: false,
        message: "Tu cuenta no está verificada. Revisa tu correo.",
      });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, nombre: user.nombre },
        env.JWT_SECRET,
        { expiresIn: "2h" }
    );

    return res.json({
      ok: true,
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, verified: user.verified },
    });
  } catch (e) {
    next(e);
  }
});

/* =========================
   POST /auth/reset-password
   (Solo desarrollo)
   ⚠️ En producción deberías hacerlo con email + token
========================= */
router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        ok: false,
        message: "Email y nueva contraseña requeridos",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const password_hash = await bcrypt.hash(newPassword, 10);

    const { rowCount } = await pool.query(
        "UPDATE users SET password_hash = $1 WHERE email = $2",
        [password_hash, cleanEmail]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    return res.json({
      ok: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (e) {
    next(e);
  }
});

export default router;
