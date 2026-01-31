import nodemailer from "nodemailer";
import { env, isEmailEnabled } from "../config/env.js";

export function makeTransport() {
  if (!isEmailEnabled()) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false, // 587 STARTTLS
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendVerifyEmail({ to, nombre, token }) {
  const transporter = makeTransport();
  if (!transporter) return false;

  const verifyUrl = `${env.APP_URL.replace(/\/+$/, "")}/verify?token=${encodeURIComponent(token)}`;

  const html = `
  <div style="font-family:Arial,sans-serif;line-height:1.5">
    <h2>Verifica tu cuenta</h2>
    <p>Hola ${nombre || "usuario"},</p>
    <p>Da clic en el siguiente botón para activar tu cuenta:</p>
    <p>
      <a href="${verifyUrl}"
         style="display:inline-block;padding:12px 16px;background:#111;color:#fff;
                border-radius:10px;text-decoration:none;font-weight:700">
        Verificar cuenta
      </a>
    </p>
    <p style="color:#666;font-size:12px">Si no solicitaste esto, ignora este correo.</p>
  </div>`;

  await transporter.sendMail({
    from: `"AUTRUST" <${env.SMTP_USER}>`,
    to,
    subject: "Verifica tu cuenta - AUTRUST",
    html,
  });

  return true;
}
