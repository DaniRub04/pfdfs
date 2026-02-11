// backend/src/services/publicar.service.js
import { pool } from "../db/pool.js";

export async function createPublication({ group, data, userId }) {
  // Validaciones mínimas para evitar 500 "ciegos"
  if (!group || typeof group !== "string") {
    const err = new Error("group inválido");
    err.status = 400;
    throw err;
  }

  if (!data || typeof data !== "object") {
    const err = new Error("data inválido (debe ser un objeto)");
    err.status = 400;
    throw err;
  }

  // Si tu tabla requiere user_id (recomendado), mejor fallar con 401
  // en vez de mandar null y que PostgreSQL truene con NOT NULL.
  if (!userId) {
    const err = new Error("No autorizado: userId requerido para publicar");
    err.status = 401;
    throw err;
  }

  // ✅ En tu BD la columna es group_id (no "group")
  const q = `
    insert into publicaciones (group_id, data, user_id)
    values ($1, $2::jsonb, $3)
    returning id, group_id, data, user_id, created_at
  `;

  const values = [group, JSON.stringify(data), userId];

  try {
    const { rows } = await pool.query(q, values);
    return rows[0];
  } catch (e) {
    // Mensaje más útil en logs
    console.error("DB createPublication error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      constraint: e.constraint,
    });
    throw e;
  }
}
