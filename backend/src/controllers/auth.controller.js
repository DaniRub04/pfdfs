import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { env, isEmailEnabled } from "../config/env.js";
import { sendVerifyEmail } from "../utils/mailer.js";

/* =========================
   HELPERS
========================= */
function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function isUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function newUuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

/* =========================
   REGISTER
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

    const exists = await pool.query("SELECT 1 FROM public.users WHERE email = $1", [
      emailNorm,
    ]);

    if (exists.rowCount > 0) {
      return res
        .status(409)
        .json({ ok: false, message: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(String(password), 10);

    const verify_token = crypto.randomBytes(32).toString("hex");
    const verify_expires = new Date(Date.now() + 1000 * 60 * 60);

    // ✅ Si NO requieres verificación, crea verified=true y no envías correo
    const REQUIRE_EMAIL_VERIFICATION =
      String(process.env.REQUIRE_EMAIL_VERIFICATION ?? "false")
        .toLowerCase() === "true";

    const verifiedOnCreate = REQUIRE_EMAIL_VERIFICATION ? false : true;

    // ✅ ID UUID real para public.users.id
    const id = newUuid();

    // ⚠️ Si tu tabla NO tiene columna role, quita "role" del returning
    const { rows } = await pool.query(
      `INSERT INTO public.users (id, nombre, email, password_hash, verified, verify_token, verify_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, email, verified, role`,
      [id, String(nombre).trim(), emailNorm, password_hash, verifiedOnCreate, verify_token, verify_expires]
    );

    // ✅ Si no se requiere verificación, termina aquí
    if (!REQUIRE_EMAIL_VERIFICATION) {
      return res.status(201).json({
        ok: true,
        message: "Registro exitoso. Ya puedes iniciar sesión.",
        user: rows[0],
      });
    }

    // ✅ En producción, si verificación es obligatoria y no hay SMTP
    if (env.NODE_ENV === "production" && !isEmailEnabled?.()) {
      return res.status(500).json({
        ok: false,
        message: "SMTP no configurado. No se puede enviar verificación.",
      });
    }

    const verifyUrl = `${env.APP_URL}/verify?token=${verify_token}`;

    await sendVerifyEmail({
      to: emailNorm,
      nombre: String(nombre).trim(),
      token: verify_token,
      verifyUrl,
    });

    return res.status(201).json({
      ok: true,
      message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
      user: rows[0],
      ...(env.NODE_ENV !== "production" ? { dev_verify_url: verifyUrl } : {}),
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   VERIFY EMAIL
========================= */
export const verifyEmail = async (req, res, next) => {
  try {
    const token = String(req.query.token || "").trim();

    if (!token) {
      return res.status(400).json({ ok: false, message: "Token requerido" });
    }

    const { rowCount, rows } = await pool.query(
      `UPDATE public.users
       SET verified = true,
           verify_token = NULL,
           verify_expires = NULL
       WHERE verify_token = $1
         AND verify_expires > now()
         AND verified = false
       RETURNING id, email, verified, role`,
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
  } catch (err) {
    next(err);
  }
};

/* =========================
   LOGIN
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

    // ⚠️ Si tu tabla NO tiene columna role, quita "role" del SELECT
    const { rows } = await pool.query(
      `SELECT id, nombre, email, password_hash, verified, role
       FROM public.users
       WHERE email = $1`,
      [emailNorm]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const user = rows[0];

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const REQUIRE_EMAIL_VERIFICATION =
      String(process.env.REQUIRE_EMAIL_VERIFICATION ?? "false")
        .toLowerCase() === "true";

    if (REQUIRE_EMAIL_VERIFICATION && !user.verified) {
      return res.status(403).json({
        ok: false,
        message: "Tu cuenta no está verificada. Revisa tu correo.",
      });
    }

    if (!isUUID(user.id)) {
      return res.status(500).json({
        ok: false,
        message: "El usuario no tiene un UUID válido (users.id). Revisa tu tabla public.users.",
        debug: { userId: String(user.id) },
      });
    }

    const payload = {
      id: String(user.id),
      email: user.email,
      nombre: user.nombre,
      role: user.role || "user",
    };

    // ✅ Ponemos el UUID también en "sub" (mejor práctica)
    const token = jwt.sign(payload, env.JWT_SECRET, {
      subject: String(user.id),
      expiresIn: "1d",
    });

    return res.json({
      ok: true,
      token,
      user: {
        id: String(user.id),
        nombre: user.nombre,
        email: user.email,
        verified: user.verified,
        role: user.role || "user",
      },
    });
  } catch (err) {
    next(err);
  }
};
