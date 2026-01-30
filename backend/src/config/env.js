import dotenv from "dotenv";

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno: ${name}`);
  return value;
}

export const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
};