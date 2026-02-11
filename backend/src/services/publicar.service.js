// backend/src/services/publicar.service.js
import { pool } from "../db/pool.js";

export async function createPublication({ group, data, userId }) {
  const q = `
    insert into publicaciones (group, data, user_id)
    values ($1, $2::jsonb, $3)
    returning id, group, data, user_id, created_at
  `;

  const values = [group, JSON.stringify(data), userId];

  const { rows } = await pool.query(q, values);
  return rows[0];
}
