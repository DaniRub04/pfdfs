import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // útil para Supabase
  connectionTimeoutMillis: 8000,
});

export async function testDB() {
  const res = await pool.query("select now() as now;");
  return res.rows[0].now;
}