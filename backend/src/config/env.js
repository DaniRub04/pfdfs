import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

export const env = {
  // App
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Seguridad
  CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
  JWT_SECRET: requireEnv("JWT_SECRET"),

  // Base de datos
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // 🔐 Email / SMTP (Outlook)
  SMTP_HOST: requireEnv("SMTP_HOST"),   // smtp.office365.com
  SMTP_PORT: requireEnv("SMTP_PORT"),   // 587
  SMTP_USER: requireEnv("SMTP_USER"),   // tu correo outlook
  SMTP_PASS: requireEnv("SMTP_PASS"),   // contraseña outlook

  // 🌐 URLs
  APP_URL: requireEnv("APP_URL"),        // Vercel
  API_URL: requireEnv("API_URL"),        // Render
};
