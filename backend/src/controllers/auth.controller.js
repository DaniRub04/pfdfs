import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { sendVerifyEmail } from "../utils/mailer.js";

/* =========================
   REGISTER (crea usuario + manda verificación)
========================= */
export const register = async (req, res, next) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res
                .status(400)
                .json({ ok: false, message: "nombre, email y password son obligatorios" });
        }

        // ¿ya existe?
        const exists = await pool.query("SELECT id FROM users WHERE email = $1", [
            email.toLowerCase().trim(),
        ]);

        if (exists.rowCount > 0) {
            return res.status(409).json({ ok: false, message: "El email ya está registrado" });
        }

        // hash password
        const password_hash = await bcrypt.hash(password, 10);

        // token de verificación (1 hora)
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 1000 * 60 * 60);

        // crea user
        const { rows } = await pool.query(
            `INSERT INTO users (nombre, email, password_hash, verified, verify_token, verify_expires)
       VALUES ($1, $2, $3, false, $4, $5)
       RETURNING id, nombre, email, verified`,
            [nombre.trim(), email.toLowerCase().trim(), password_hash, token, expires]
        );

        // URL a tu frontend (Vercel)
        const verifyUrl = `${env.APP_URL}/verify?token=${token}`;

        // enviar correo
        await sendVerifyEmail({
            to: email,
            name: nombre,
            verifyUrl,
        });

        return res.status(201).json({
            ok: true,
            message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
            user: rows[0],
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

        const { rowCount, rows } = await pool.query(
            `UPDATE users
       SET verified = true,
           verify_token = NULL,
           verify_expires = NULL
       WHERE verify_token = $1
         AND verify_expires > now()
         AND verified = false
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

        const { rows } = await pool.query(
            `SELECT id, nombre, email, password_hash, verified
       FROM users
       WHERE email = $1`,
            [email.toLowerCase().trim()]
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
    } catch (err) {
        next(err);
    }
};
