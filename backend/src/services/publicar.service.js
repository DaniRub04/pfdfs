// backend/src/services/publicar.service.js
import { pool } from "../db/pool.js";

function isBigintId(v) {
  return typeof v === "string" && /^[0-9]+$/.test(v);
}

function normalizeGroup(group) {
  return String(group ?? "").trim().toLowerCase();
}

function toSafeLimit(limit, def = 20, max = 200) {
  const lim = Number(limit);
  return Number.isFinite(lim) && lim > 0 ? Math.min(lim, max) : def;
}

function toSafeOffset(offset) {
  const n = Number(offset);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function assertObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}

function safeParseJson(v) {
  if (!v) return {};
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Crea una publicación
 */
export async function createPublication({ group, data, userId }) {
  if (!group || typeof group !== "string") {
    const err = new Error("group inválido");
    err.status = 400;
    throw err;
  }

  if (!assertObject(data)) {
    const err = new Error("data inválido (debe ser un objeto)");
    err.status = 400;
    throw err;
  }

  if (!userId) {
    const err = new Error("No autorizado: userId requerido para publicar");
    err.status = 401;
    throw err;
  }

  const userIdStr = String(userId).trim();
  if (!isBigintId(userIdStr)) {
    const err = new Error("No autorizado: userId no es bigint válido");
    err.status = 401;
    throw err;
  }

  const groupNormalized = normalizeGroup(group);

  const q = `
    insert into public.publicaciones (group_id, data, user_id, status)
    values ($1, $2::jsonb, $3::bigint, 'pendiente')
    returning id, group_id, data, user_id, status, created_at
  `;

  const values = [groupNormalized, JSON.stringify(data), userIdStr];

  const { rows } = await pool.query(q, values);
  const row = rows[0] || null;
  return row ? { ...row, data: safeParseJson(row.data) } : null;
}

/**
 * ✅ Lista publicaciones públicas (landing/catálogo) CON PAGINACIÓN
 * - Solo status='aprobado'
 * - group: null = todas
 * - limit/offset
 *
 * ✅ Devuelve:
 * { total, rows, limit, offset, hasMore }
 */
export async function listPublications({ group = null, limit = 20, offset = 0 }) {
  const safeLimit = toSafeLimit(limit, 20, 200);
  const safeOffset = toSafeOffset(offset);

  const groupNormalized = group && String(group).trim() ? normalizeGroup(group) : null;

  const where = groupNormalized ? `where status='aprobado' and group_id = $1` : `where status='aprobado'`;

  const qTotal = groupNormalized
    ? `select count(*)::int as total from public.publicaciones ${where}`
    : `select count(*)::int as total from public.publicaciones ${where}`;

  const qRows = groupNormalized
    ? `
      select id, group_id, data, user_id, status, created_at
      from public.publicaciones
      ${where}
      order by created_at desc
      limit $2 offset $3
    `
    : `
      select id, group_id, data, user_id, status, created_at
      from public.publicaciones
      ${where}
      order by created_at desc
      limit $1 offset $2
    `;

  const valuesTotal = groupNormalized ? [groupNormalized] : [];
  const valuesRows = groupNormalized
    ? [groupNormalized, safeLimit, safeOffset]
    : [safeLimit, safeOffset];

  try {
    const [{ rows: totalRows }, { rows }] = await Promise.all([
      pool.query(qTotal, valuesTotal),
      pool.query(qRows, valuesRows),
    ]);

    const total = totalRows?.[0]?.total ?? 0;
    const cleanRows = (rows || []).map((r) => ({ ...r, data: safeParseJson(r.data) }));

    return {
      total: Number(total) || 0,
      rows: cleanRows,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + cleanRows.length < (Number(total) || 0),
    };
  } catch (e) {
    console.error("DB listPublications error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      where: e.where,
    });
    throw e;
  }
}

/**
 * Lista MIS publicaciones
 */
export async function listMyPublications({ userId, group = null, limit = 50 }) {
  if (!userId) {
    const err = new Error("No autorizado: userId requerido");
    err.status = 401;
    throw err;
  }

  const userIdStr = String(userId).trim();
  if (!isBigintId(userIdStr)) {
    const err = new Error("No autorizado: userId no es bigint válido");
    err.status = 401;
    throw err;
  }

  const safeLimit = toSafeLimit(limit, 50, 200);
  const groupNormalized = group && String(group).trim() ? normalizeGroup(group) : null;

  const q = groupNormalized
    ? `
      select id, group_id, data, user_id, status, created_at
      from public.publicaciones
      where user_id = $1::bigint and group_id = $2
      order by created_at desc
      limit $3
    `
    : `
      select id, group_id, data, user_id, status, created_at
      from public.publicaciones
      where user_id = $1::bigint
      order by created_at desc
      limit $2
    `;

  const values = groupNormalized ? [userIdStr, groupNormalized, safeLimit] : [userIdStr, safeLimit];

  const { rows } = await pool.query(q, values);
  return (rows || []).map((r) => ({ ...r, data: safeParseJson(r.data) }));
}

export async function updateMyPublication({ id, userId, data }) {
  if (!id) {
    const err = new Error("id requerido");
    err.status = 400;
    throw err;
  }

  if (!assertObject(data)) {
    const err = new Error("data inválido (debe ser un objeto)");
    err.status = 400;
    throw err;
  }

  if (!userId) {
    const err = new Error("No autorizado: userId requerido");
    err.status = 401;
    throw err;
  }

  const userIdStr = String(userId).trim();
  if (!isBigintId(userIdStr)) {
    const err = new Error("No autorizado: userId no es bigint válido");
    err.status = 401;
    throw err;
  }

  const q = `
    update public.publicaciones
    set data = $1::jsonb
    where id = $2 and user_id = $3::bigint
    returning id, group_id, data, user_id, status, created_at
  `;

  const { rows } = await pool.query(q, [JSON.stringify(data), id, userIdStr]);
  const row = rows[0] || null;
  return row ? { ...row, data: safeParseJson(row.data) } : null;
}

export async function deleteMyPublication({ id, userId }) {
  if (!id) {
    const err = new Error("id requerido");
    err.status = 400;
    throw err;
  }

  if (!userId) {
    const err = new Error("No autorizado: userId requerido");
    err.status = 401;
    throw err;
  }

  const userIdStr = String(userId).trim();
  if (!isBigintId(userIdStr)) {
    const err = new Error("No autorizado: userId no es bigint válido");
    err.status = 401;
    throw err;
  }

  const q = `
    delete from public.publicaciones
    where id = $1 and user_id = $2::bigint
    returning id
  `;

  const { rows } = await pool.query(q, [id, userIdStr]);
  return rows[0] || null;
}

/**
 * (Opcional) Si ya NO lo usas, luego lo borras.
 */
export async function setPublicationStatus({ id, userId, status }) {
  if (!id) {
    const err = new Error("id requerido");
    err.status = 400;
    throw err;
  }

  const st = String(status || "").toLowerCase().trim();
  const allowed = new Set(["pendiente", "aprobado", "rechazado"]);
  if (!allowed.has(st)) {
    const err = new Error("status inválido");
    err.status = 400;
    throw err;
  }

  if (!userId) {
    const err = new Error("No autorizado: userId requerido");
    err.status = 401;
    throw err;
  }

  const userIdStr = String(userId).trim();
  if (!isBigintId(userIdStr)) {
    const err = new Error("No autorizado: userId no es bigint válido");
    err.status = 401;
    throw err;
  }

  const q = `
    update public.publicaciones
    set status = $1
    where id = $2 and user_id = $3::bigint
    returning id, group_id, data, user_id, status, created_at
  `;

  const { rows } = await pool.query(q, [st, id, userIdStr]);
  const row = rows[0] || null;
  return row ? { ...row, data: safeParseJson(row.data) } : null;
}