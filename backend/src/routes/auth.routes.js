import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { env, isEmailEnabled } from "../config/env.js";
import { sendVerifyEmail } from "../utils/mailer.js";

const router = Router();

// ✅ Bandera para activar/desactivar verificación de correo (sin borrar lógica)
const REQUIRE_EMAIL_VERIFICATION =
  String(process.env.REQUIRE_EMAIL_VERIFICATION ?? "false")
    .toLowerCase() === "true";

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const nombre = String(req.body.nombre ?? "").trim();
    const email = String(req.body.email ?? "").toLowerCase().trim();
    const password = String(req.body.password ?? "");

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan campos" });
    }

    const exists = await pool.query(
      "SELECT 1 FROM public.users WHERE email=$1",
      [email]
    );
    if (exists.rows.length) {
      return res
        .status(409)
        .json({ ok: false, message: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // token + expira (ej: 1 hora)
    const verify_token = crypto.randomBytes(32).toString("hex");
    const verify_expires = new Date(Date.now() + 60 * 60 * 1000);

    // ✅ Si NO se requiere verificación, lo marcamos verified=true desde el inicio
    const verifiedOnCreate = REQUIRE_EMAIL_VERIFICATION ? false : true;

    // ✅ IMPORTANTE:
    // Tu DB usa users.id BIGINT, así que NO insertamos id.
    // Dejamos que la BD (identity/serial) lo asigne.
    const { rows } = await pool.query(
      `INSERT INTO public.users (nombre, email, password_hash, verified, verify_token, verify_expires, role)
       VALUES ($1,$2,$3,$4,$5,$6, COALESCE($7, 'user'))
       RETURNING id, nombre, email, creado_en, verified, role`,
      [nombre, email, password_hash, verifiedOnCreate, verify_token, verify_expires, "user"]
    );

    // ✅ Si NO se requiere verificación, ya no mandamos correo
    if (!REQUIRE_EMAIL_VERIFICATION) {
      return res.status(201).json({
        ok: true,
        user: {
          id: String(rows[0].id),
          nombre: rows[0].nombre,
          email: rows[0].email,
          verified: rows[0].verified,
          role: rows[0].role || "user",
          creado_en: rows[0].creado_en,
        },
        message: "Cuenta creada correctamente.",
      });
    }

    // ✅ En producción, si la verificación es obligatoria y no hay SMTP
    if (env.NODE_ENV === "production" && !isEmailEnabled()) {
      return res.status(500).json({
        ok: false,
        message: "SMTP no configurado. No se puede enviar verificación.",
      });
    }

    // Intentar enviar correo
    let sent = false;
    try {
      sent = await sendVerifyEmail({ to: email, nombre, token: verify_token });
    } catch {
      sent = false;
    }

    return res.status(201).json({
      ok: true,
      user: {
        id: String(rows[0].id),
        nombre: rows[0].nombre,
        email: rows[0].email,
        verified: rows[0].verified,
        role: rows[0].role || "user",
        creado_en: rows[0].creado_en,
      },
      message: sent
        ? "Cuenta creada. Revisa tu correo para verificarla."
        : "Cuenta creada, pero no se pudo enviar el correo de verificación.",
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
      `UPDATE public.users
       SET verified=true, verify_token=NULL, verify_expires=NULL
       WHERE verify_token=$1 AND verify_expires > now()`,
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
    const email = String(req.body.email ?? "").toLowerCase().trim();
    const password = String(req.body.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    // ✅ Traemos role para admin
    const { rows } = await pool.query(
      `SELECT id, nombre, email, password_hash, verified, role
       FROM public.users
       WHERE email=$1`,
      [email]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    // ✅ BLOQUEO SOLO si la verificación está activada
    if (REQUIRE_EMAIL_VERIFICATION && !user.verified) {
      return res.status(403).json({
        ok: false,
        message: "Tu cuenta no está verificada. Revisa tu correo.",
      });
    }

    const role = user.role || "user";

    // ✅ JWT incluye role (clave para Admin Panel)
    const token = jwt.sign(
      {
        id: String(user.id), // BIGINT -> string
        email: user.email,
        nombre: user.nombre,
        role,
      },
      env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: String(user.id),
        nombre: user.nombre,
        email: user.email,
        verified: user.verified,
        role,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
