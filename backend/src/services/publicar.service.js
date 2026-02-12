// backend/src/services/publicar.service.js
import { pool } from "../db/pool.js";

function isUuid(v) {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  );
}

/**
 * Crea una publicación en public.publicaciones
 * columnas: group_id (text), data (jsonb), user_id (uuid), created_at
 */
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

  // Requiere login
  if (!userId) {
    const err = new Error("No autorizado: userId requerido para publicar");
    err.status = 401;
    throw err;
  }

  // ✅ IMPORTANTE: user_id en BD es UUID
  if (!isUuid(String(userId))) {
    const err = new Error("No autorizado: userId no es UUID válido");
    err.status = 401;
    throw err;
  }

  const groupNormalized = group.trim().toLowerCase();

  // ✅ En tu BD la columna es group_id (no "group")
  const q = `
    insert into publicaciones (group_id, data, user_id)
    values ($1, $2::jsonb, $3::uuid)
    returning id, group_id, data, user_id, created_at
  `;

  const values = [groupNormalized, JSON.stringify(data), String(userId)];

  try {
    const { rows } = await pool.query(q, values);
    return rows[0];
  } catch (e) {
    console.error("DB createPublication error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      constraint: e.constraint,
    });
    throw e;
  }
}

/**
 * Lista publicaciones (para landing pública, catálogo, etc.)
 * - group: null = todas
 * - limit: default 12
 */
export async function listPublications({ group = null, limit = 12 }) {
  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) && lim > 0 ? Math.min(lim, 100) : 12;

  const groupNormalized =
    group && String(group).trim() ? String(group).trim().toLowerCase() : null;

  const q = groupNormalized
    ? `
      select id, group_id, data, user_id, created_at
      from publicaciones
      where group_id = $1
      order by created_at desc
      limit $2
    `
    : `
      select id, group_id, data, user_id, created_at
      from publicaciones
      order by created_at desc
      limit $1
    `;

  const values = groupNormalized ? [groupNormalized, safeLimit] : [safeLimit];

  const { rows } = await pool.query(q, values);
  return rows;
}
  