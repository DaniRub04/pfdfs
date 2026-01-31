import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Transporter SMTP (Outlook)
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,          // smtp.office365.com
  port: Number(env.SMTP_PORT),  // 587
  secure: false,                // STARTTLS
  auth: {
    user: env.SMTP_USER,        // tu correo Outlook
    pass: env.SMTP_PASS,        // tu contraseña Outlook
  },
});

// Función para enviar correo de verificación
export async function sendVerifyEmail({ to, name, verifyUrl }) {
  const subject = "Verifica tu cuenta";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Hola${name ? `, ${name}` : ""} 👋</h2>
      <p>Para activar tu cuenta, confirma tu correo:</p>
      <p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:12px 16px;border-radius:10px;
                  background:#111827;color:#fff;text-decoration:none;
                  font-weight:700">
          Verificar cuenta
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px">
        Si no solicitaste este registro, ignora este correo.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Concesionaria Autos" <${env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
