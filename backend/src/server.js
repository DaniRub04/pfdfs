import { app } from "./app.js";
import { env } from "./config/env.js";
import { testDB } from "./config/db.js";

app.listen(env.PORT, async () => {
  console.log(`API corriendo en http://localhost:${env.PORT}`);
  try {
    const now = await testDB();
    console.log("✅ DB conectada:", now);
  } catch (e) {
    console.error("❌ DB error:", e.message);
  }
});