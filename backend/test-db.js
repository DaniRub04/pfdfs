require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const res = await pool.query("select now()");
    console.log("✅ Conectado a Supabase:", res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error de conexión:", err.message);
    process.exit(1);
  }
})();