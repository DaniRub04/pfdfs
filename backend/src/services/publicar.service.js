// backend/src/services/publicar.service.js
import { pool } from "../db/pool.js";

function isUuid(v) {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  );
}

function normalizeGroup(group) {
  return String(group ?? "").trim().toLowerCase();
}

function toSafeLimit(limit, def = 12, max = 100) {
  const lim = Number(limit);
  return Number.isFinite(lim) && lim > 0 ? Math.min(lim, max) : def;
}

function assertObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}

/**
 * Crea una publicación en public.publicaciones
 * columnas: group_id (text), data (jsonb), user_id (uuid), status (text), created_at
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

  const userIdStr = String(userId);
  if (!isUuid(userIdStr)) {
    const err = new Error("No autorizado: userId no es UUID válido");
    err.status = 401;
    throw err;
  }

  const groupNormalized = normalizeGroup(group);

  // ✅ status real: pendiente al crear
  const q = `
    insert into publicaciones (group_id, data, user_id, status)
    values ($1, $2::jsonb, $3::uuid, 'pendiente')
    returning id, group_id, data, user_id, status, created_at
  `;

  const values = [groupNormalized, JSON.stringify(data), userIdStr];

  try {
    const { rows } = await pool.query(q, values);
    return rows[0];
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
 * - limit: default 12 (máx 100)
 */
export async function listPublications({ group = null, limit = 12 }) {
  const safeLimit = toSafeLimit(limit, 12, 100);

  const groupNormalized =
    group && String(group).trim() ? normalizeGroup(group) : null;

  const q = groupNormalized
    ? `
      select id, group_id, data, user_id, status, created_at
      from publicaciones
      where group_id = $1 and status = 'aprobado'
      order by created_at desc
      limit $2
    `
    : `
      select id, group_id, data, user_id, status, created_at
      from publicaciones
      where status = 'aprobado'
      order by created_at desc
      limit $1
    `;

  const values = groupNormalized ? [groupNormalized, safeLimit] : [safeLimit];

  try {
    const { rows } = await pool.query(q, values);
    return rows;
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

  const userIdStr = String(userId);
  if (!isUuid(userIdStr)) {
    const err = new Error("No autorizado: userId no es UUID válido");
    err.status = 401;
    throw err;
  }

  const safeLimit = toSafeLimit(limit, 50, 200);

  const groupNormalized =
    group && String(group).trim() ? normalizeGroup(group) : null;

  const q = groupNormalized
    ? `
      select id, group_id, data, user_id, status, created_at
      from publicaciones
      where user_id = $1::uuid and group_id = $2
      order by created_at desc
      limit $3
    `
    : `
      select id, group_id, data, user_id, status, created_at
      from publicaciones
      where user_id = $1::uuid
      order by created_at desc
      limit $2
    `;

  const values = groupNormalized
    ? [userIdStr, groupNormalized, safeLimit]
    : [userIdStr, safeLimit];

  try {
    const { rows } = await pool.query(q, values);
    return rows;
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

  const userIdStr = String(userId);
  if (!isUuid(userIdStr)) {
    const err = new Error("No autorizado: userId no es UUID válido");
    err.status = 401;
    throw err;
  }

  const q = `
    update publicaciones
    set data = $1::jsonb
    where id = $2 and user_id = $3::uuid
    returning id, group_id, data, user_id, status, created_at
  `;

  const values = [JSON.stringify(data), id, userIdStr];

  try {
    const { rows } = await pool.query(q, values);
    return rows[0] || null;
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

  const userIdStr = String(userId);
  if (!isUuid(userIdStr)) {
    const err = new Error("No autorizado: userId no es UUID válido");
    err.status = 401;
    throw err;
  }

  const q = `
    delete from publicaciones
    where id = $1 and user_id = $2::uuid
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
 * ⚠️ Idealmente esto debería ser admin; por ahora lo permitimos al dueño.
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

  const userIdStr = String(userId);
  if (!isUuid(userIdStr)) {
    const err = new Error("No autorizado: userId no es UUID válido");
    err.status = 401;
    throw err;
  }

  const q = `
    update publicaciones
    set status = $1
    where id = $2 and user_id = $3::uuid
    returning id, group_id, data, user_id, status, created_at
  `;

  try {
    const { rows } = await pool.query(q, [st, id, userIdStr]);
    return rows[0] || null;
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
