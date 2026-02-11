import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// ✅ también default por compatibilidad
export default pool;
