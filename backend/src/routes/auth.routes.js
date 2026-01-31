import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { env, isEmailEnabled } from "../config/env.js";
import { sendVerifyEmail } from "../utils/mailer.js";

const router = Router();

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan campos" });
    }

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length) {
      return res.status(409).json({ ok: false, message: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // token + expira (ej: 1 hora)
    const verify_token = crypto.randomBytes(32).toString("hex");
    const verify_expires = new Date(Date.now() + 60 * 60 * 1000);

    const { rows } = await pool.query(
        `INSERT INTO users (nombre, email, password_hash, verified, verify_token, verify_expires)
       VALUES ($1,$2,$3,false,$4,$5)
       RETURNING id, nombre, email, creado_en, verified`,
        [nombre, email, password_hash, verify_token, verify_expires]
    );

    // ✅ si estás en producción y quieres que SEA OBLIGATORIO el correo:
    if (env.NODE_ENV === "production" && !isEmailEnabled()) {
      return res.status(500).json({
        ok: false,
        message: "SMTP no configurado. No se puede enviar verificación.",
      });
    }

    // Intentar enviar correo (en prod debería estar activo)
    let sent = false;
    try {
      sent = await sendVerifyEmail({ to: email, nombre, token: verify_token });
    } catch {
      sent = false;
    }

    return res.status(201).json({
      ok: true,
      user: rows[0],
      message: sent
          ? "Cuenta creada. Revisa tu correo para verificarla."
          : "Cuenta creada, pero no se pudo enviar el correo de verificación.",
      // ✅ útil en DEV para probar sin correo
      ...(env.NODE_ENV !== "production"
          ? { dev_verify_url: `${env.APP_URL}/verify?token=${verify_token}` }
          : {}),
    });
  } catch (e) {
    next(e);
  }
});

// GET /auth/verify?token=...
router.get("/verify", async (req, res, next) => {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return res.status(400).json({ ok: false, message: "Token requerido" });
    }

    const { rowCount } = await pool.query(
        `UPDATE users
       SET verified=true, verify_token=NULL, verify_expires=NULL
       WHERE verify_token=$1 AND verify_expires > now()
      `,
        [token]
    );

    if (rowCount === 0) {
      return res.status(400).json({
        ok: false,
        message: "Token inválido o expirado",
      });
    }

    return res.json({ ok: true, message: "Cuenta verificada correctamente" });
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
        "SELECT id, nombre, email, password_hash, verified FROM users WHERE email=$1",
        [email]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ ok: false, message: "Credenciales inválidas" });

    // ✅ BLOQUEO si no verificó
    if (!user.verified) {
      return res.status(403).json({
        ok: false,
        message: "Tu cuenta no está verificada. Revisa tu correo.",
      });
    }

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

export default router;
