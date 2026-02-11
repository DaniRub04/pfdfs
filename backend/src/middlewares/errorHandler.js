import { env } from "../config/env.js";

export function errorHandler(err, req, res, next) {
  console.error("ERROR:", err);

  const status = err.status || err.statusCode || 500;

  // Activa detalles si DEBUG_ERRORS=true (en Render)
  const debug = String(env.DEBUG_ERRORS || "").toLowerCase() === "true";

  const payload = {
    ok: false,
    message: status === 500 ? "Error interno del servidor" : (err.message || "Error"),
  };

  if (debug) {
    payload.error = err.message;
    payload.code = err.code;        // útil en Postgres
    payload.detail = err.detail;    // útil en Postgres
    payload.constraint = err.constraint;
    payload.where = err.where;
  }

  res.status(status).json(payload);
}
