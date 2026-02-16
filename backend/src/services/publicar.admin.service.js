// backend/src/services/publicar.admin.service.js
import { pool } from "../db/pool.js";

function toSafeLimit(limit, def = 20, max = 200) {
  const n = Number(limit);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : def;
}
function toSafeOffset(offset) {
  const n = Number(offset);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

export async function adminListPublications({
  status = "pendiente",
  group = null,
  limit = 20,
  offset = 0,
}) {
  const st = norm(status);
  const allowed = new Set(["pendiente", "aprobado", "rechazado"]);
  const safeStatus = allowed.has(st) ? st : "pendiente";

  const g = group && String(group).trim() ? norm(group) : null;
  const safeLimit = toSafeLimit(limit, 20, 200);
  const safeOffset = toSafeOffset(offset);

  const whereParts = ["status = $1"];
  const values = [safeStatus];
  let idx = values.length + 1;

  if (g) {
    whereParts.push(`group_id = $${idx}`);
    values.push(g);
    idx++;
  }

  const where = `where ${whereParts.join(" and ")}`;

  const qTotal = `select count(*)::int as total from publicaciones ${where}`;
  const qRows = `
    select id, group_id, data, user_id, status, created_at
    from publicaciones
    ${where}
    order by created_at desc
    limit $${idx} offset $${idx + 1}
  `;

  const valuesRows = [...values, safeLimit, safeOffset];

  const [{ rows: totalRows }, { rows }] = await Promise.all([
    pool.query(qTotal, values),
    pool.query(qRows, valuesRows),
  ]);

  return { total: totalRows?.[0]?.total ?? 0, rows };
}

export async function adminSetStatus({ id, status }) {
  const st = norm(status);
  const allowed = new Set(["pendiente", "aprobado", "rechazado"]);
  if (!allowed.has(st)) {
    const err = new Error("status inválido");
    err.status = 400;
    throw err;
  }

  const q = `
    update publicaciones
    set status = $1
    where id = $2
    returning id, group_id, data, user_id, status, created_at
  `;

  const { rows } = await pool.query(q, [st, id]);
  return rows[0] || null;
}
