// backend/src/services/publicar.service.js
import { pool } from "../db/pool.js";

function isBigintId(v) {
  return typeof v === "string" && /^[0-9]+$/.test(v);
}

function normalizeGroup(group) {
  return String(group ?? "").trim().toLowerCase();
}

// ✅ unifica límites (máx 200 para que coincida con tu UI)
function toSafeLimit(limit, def = 20, max = 200) {
  const lim = Number(limit);
  return Number.isFinite(lim) && lim > 0 ? Math.min(lim, max) : def;
}

function assertObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}

// ✅ por si data llegara como string (seguro extra)
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
 * Crea una publicación en public.publicaciones
 * columnas: group_id (text), data (jsonb), user_id (bigint), status (text), created_at
 * - status por defecto: 'pendiente'
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

  try {
    const { rows } = await pool.query(q, values);
    const row = rows[0];
    if (!row) return null;
    return { ...row, data: safeParseJson(row.data) };
  } catch (e) {
    console.error("DB createPublication error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      constraint: e.constraint,
      where: e.where,
    });
    throw e;
  }
}

/**
 * Lista publicaciones públicas (landing/catálogo)
 * - Solo devuelve status = 'aprobado'
 * - group: null = todas
 * - limit: default 20 (máx 200)
 */
export async function listPublications({ group = null, limit = 20 }) {
  const safeLimit = toSafeLimit(limit, 20, 200);

  const groupNormalized =
    group && String(group).trim() ? normalizeGroup(group) : null;

  const q = groupNormalized
    ? `
      select id, group_id, data, user_id, status, created_at
      from public.publicaciones
      where group_id = $1 and status = 'aprobado'
      order by created_at desc
      limit $2
    `
    : `
      select id, group_id, data, user_id, status, created_at
      from public.publicaciones
      where status = 'aprobado'
      order by created_at desc
      limit $1
    `;

  const values = groupNormalized ? [groupNormalized, safeLimit] : [safeLimit];

  try {
    const { rows } = await pool.query(q, values);
    return (rows || []).map((r) => ({ ...r, data: safeParseJson(r.data) }));
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
 * 🔒 Lista MIS publicaciones (perfil)
 * - devuelve todas: pendiente/aprobado/rechazado
 * - limit: default 50 (máx 200)
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

  const groupNormalized =
    group && String(group).trim() ? normalizeGroup(group) : null;

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

  const values = groupNormalized
    ? [userIdStr, groupNormalized, safeLimit]
    : [userIdStr, safeLimit];

  try {
    const { rows } = await pool.query(q, values);
    return (rows || []).map((r) => ({ ...r, data: safeParseJson(r.data) }));
  } catch (e) {
    console.error("DB listMyPublications error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      where: e.where,
    });
    throw e;
  }
}

/**
 * 🔒 Editar MI publicación (solo data)
 */
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

  const values = [JSON.stringify(data), id, userIdStr];

  try {
    const { rows } = await pool.query(q, values);
    const row = rows[0] || null;
    return row ? { ...row, data: safeParseJson(row.data) } : null;
  } catch (e) {
    console.error("DB updateMyPublication error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      where: e.where,
    });
    throw e;
  }
}

/**
 * 🔒 Eliminar MI publicación
 */
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

  try {
    const { rows } = await pool.query(q, [id, userIdStr]);
    return rows[0] || null;
  } catch (e) {
    console.error("DB deleteMyPublication error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      where: e.where,
    });
    throw e;
  }
}

/**
 * 🔒 Cambiar status (pendiente/aprobado/rechazado)
 * ⚠️ Nota: tu router ya dice que esto se eliminó para el usuario.
 * Si ya no lo usas, puedes borrarlo luego.
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

  try {
    const { rows } = await pool.query(q, [st, id, userIdStr]);
    const row = rows[0] || null;
    return row ? { ...row, data: safeParseJson(row.data) } : null;
  } catch (e) {
    console.error("DB setPublicationStatus error:", {
      message: e.message,
      code: e.code,
      detail: e.detail,
      where: e.where,
    });
    throw e;
  }
}