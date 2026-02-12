import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { sendVerifyEmail } from "../utils/mailer.js";

/* =========================
   HELPERS
========================= */
function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

// Validación simple de UUID (evita "invalid input syntax for type uuid")
function isUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

/* =========================
   REGISTER (crea usuario + manda verificación)
========================= */
export const register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "nombre, email y password son obligatorios",
      });
    }

    const emailNorm = normalizeEmail(email);

    // ¿ya existe?
    const exists = await pool.query("SELECT 1 FROM public.users WHERE email = $1", [
      emailNorm,
    ]);

    if (exists.rowCount > 0) {
      return res
        .status(409)
        .json({ ok: false, message: "El email ya está registrado" });
    }

    // hash password
    const password_hash = await bcrypt.hash(password, 10);

    // token de verificación (1 hora)
    const verify_token = crypto.randomBytes(32).toString("hex");
    const verify_expires = new Date(Date.now() + 1000 * 60 * 60);

    // crea user
    // ✅ IMPORTANTE: devolvemos instance_id como id (UUID)
    const { rows } = await pool.query(
      `INSERT INTO public.users (nombre, email, password_hash, verified, verify_token, verify_expires)
       VALUES ($1, $2, $3, false, $4, $5)
       RETURNING instance_id AS id, nombre, email, verified`,
      [String(nombre).trim(), emailNorm, password_hash, verify_token, verify_expires]
    );

    // URL a tu frontend (Vercel)
    const verifyUrl = `${env.APP_URL}/verify?token=${verify_token}`;

    // enviar correo
    await sendVerifyEmail({
      to: emailNorm,
      name: String(nombre).trim(),
      verifyUrl,
    });

    return res.status(201).json({
      ok: true,
      message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
      user: rows[0], // { id (uuid), nombre, email, verified }
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   VERIFY EMAIL
   GET /auth/verify?token=...
========================= */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ ok: false, message: "Token requerido" });
    }

    // ✅ devolvemos instance_id como id (UUID)
    const { rowCount, rows } = await pool.query(
      `UPDATE public.users
       SET verified = true,
           verify_token = NULL,
           verify_expires = NULL
       WHERE verify_token = $1
         AND verify_expires > now()
         AND verified = false
       RETURNING instance_id AS id, email, verified`,
      [String(token)]
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
  } catch (err) {
    next(err);
  }
};

/* =========================
   LOGIN (bloquea si no verified)
========================= */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "email y password son obligatorios" });
    }

    const emailNorm = normalizeEmail(email);

    // ✅ IMPORTANTE: usamos instance_id como id (UUID)
    const { rows } = await pool.query(
      `SELECT instance_id AS id, nombre, email, password_hash, verified
       FROM public.users
       WHERE email = $1`,
      [emailNorm]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    // 🔒 Bloquea si no verificó
    if (!user.verified) {
      return res.status(403).json({
        ok: false,
        message: "Tu cuenta no está verificada. Revisa tu correo.",
      });
    }

    // ✅ Aseguramos UUID real para que publicar.user_id (uuid) funcione
    if (!isUUID(user.id)) {
      return res.status(500).json({
        ok: false,
        message:
          "El usuario no tiene un UUID válido (instance_id). Revisa la columna users.instance_id.",
        debug: { userId: String(user.id) },
      });
    }

    const token = jwt.sign(
      {
        id: String(user.id), // 👈 UUID
        email: user.email,
        nombre: user.nombre,
      },
      env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: String(user.id),
        nombre: user.nombre,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (err) {
    next(err);
  }
};
