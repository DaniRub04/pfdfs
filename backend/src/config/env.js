import dotenv from "dotenv";
dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

function optionalNumber(name) {
  const v = process.env[name];
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const env = {
  // App
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Seguridad
  CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
  JWT_SECRET: requireEnv("JWT_SECRET"),

  // DB
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // URLs (en Render deben existir)
  APP_URL: requireEnv("APP_URL"),
  API_URL: requireEnv("API_URL"),

  // SMTP (opcional en local, pero si está completo lo usamos)
  SMTP_HOST: process.env.SMTP_HOST || null,
  SMTP_PORT: optionalNumber("SMTP_PORT"),
  SMTP_USER: process.env.SMTP_USER || null,
  SMTP_PASS: process.env.SMTP_PASS || null,
};

export function isEmailEnabled() {
  return !!(
      env.SMTP_HOST &&
      env.SMTP_PORT &&
      env.SMTP_USER &&
      env.SMTP_PASS &&
      env.APP_URL
  );
}
