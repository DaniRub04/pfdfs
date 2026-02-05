import { Resend } from "resend";
import { env, isEmailEnabled } from "../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerifyEmail({ to, nombre, token }) {
  if (!isEmailEnabled()) return false;

  const verifyUrl = `${env.APP_URL.replace(/\/+$/, "")}/verify?token=${encodeURIComponent(token)}`;

  const html = `
  <div style="
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background-color: #f9fafb;
    padding: 32px;
    color: #111827;
  ">
    <div style="
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      padding: 28px;
      border: 1px solid #e5e7eb;
    ">
      <h2 style="margin-top:0;">
        Bienvenido a <strong>SELECTA PLAZA – Autos Usados</strong>
      </h2>

      <p style="font-size:15px; line-height:1.6;">
        Hola <strong>${nombre || "usuario"}</strong>,
      </p>

      <p style="font-size:15px; line-height:1.6;">
        Te has registrado exitosamente en <strong>SELECTA PLAZA – Autos Usados</strong>.
        Para completar tu registro y activar tu cuenta, es necesario verificar
        tu dirección de correo electrónico.
      </p>

      <p style="font-size:15px; line-height:1.6;">
        Por favor, haz clic en el siguiente enlace para verificar tu cuenta:
      </p>

      <p style="margin: 18px 0;">
        <a href="${verifyUrl}"
           style="
             color: #2563eb;
             font-weight: 600;
             text-decoration: none;
           ">
          Verificar mi cuenta
        </a>
      </p>

      <p style="font-size:14px; color:#374151;">
        Si el enlace no funciona, copia y pega la siguiente dirección en tu navegador:
      </p>

      <p style="
        font-size:13px;
        color:#2563eb;
        word-break: break-all;
      ">
        ${verifyUrl}
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="font-size:13px;color:#6b7280;line-height:1.5;">
        Si no realizaste este registro, puedes ignorar este mensaje.
        Tu cuenta no será activada sin la verificación.
      </p>

      <p style="font-size:13px;color:#6b7280;margin-top:24px;">
        © ${new Date().getFullYear()} SELECTA PLAZA – Autos Usados
      </p>
    </div>
  </div>
  `;

  await resend.emails.send({
    from: env.MAIL_FROM, // ej: "SELECTA PLAZA – Autos Usados <onboarding@resend.dev>"
    to,
    subject: "Verifica tu cuenta en SELECTA PLAZA – Autos Usados",
    html,
  });

  return true;
}
