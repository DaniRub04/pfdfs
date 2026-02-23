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

  const whereParts = ["p.status = $1"];
  const values = [safeStatus];
  let idx = values.length + 1;

  if (g) {
    whereParts.push(`p.group_id = $${idx}`);
    values.push(g);
    idx++;
  }

  const where = `where ${whereParts.join(" and ")}`;

  const qTotal = `select count(*)::int as total from publicaciones p ${where}`;

  const qRows = `
    select
      p.id,
      p.group_id,
      p.data,
      p.user_id,
      p.status,
      p.created_at,
      row_to_json(u) as "user"
    from publicaciones p
    left join users u on u.id = p.user_id
    ${where}
    order by p.created_at desc
    limit $${idx} offset $${idx + 1}
  `;

  const valuesRows = [...values, safeLimit, safeOffset];

  const [{ rows: totalRows }, { rows }] = await Promise.all([
    pool.query(qTotal, values),
    pool.query(qRows, valuesRows),
  ]);

  const fixedRows = (rows || []).map((r) => ({
    ...r,
    data: safeParseJson(r?.data),
  }));

  return { total: totalRows?.[0]?.total ?? 0, rows: fixedRows };
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
    with upd as (
      update publicaciones p
      set status = $1
      where p.id = $2
      returning p.*
    )
    select
      upd.id,
      upd.group_id,
      upd.data,
      upd.user_id,
      upd.status,
      upd.created_at,
      row_to_json(u) as "user"
    from upd
    left join users u on u.id = upd.user_id
  `;

  const { rows } = await pool.query(q, [st, id]);
  const row = rows[0] || null;
  if (!row) return null;

  return { ...row, data: safeParseJson(row?.data) };
}