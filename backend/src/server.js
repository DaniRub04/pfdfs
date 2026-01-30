import { app } from "./app.js";
import { env } from "./config/env.js";
import { testDB } from "./config/db.js";

const PORT = process.env.PORT || env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`API corriendo en puerto ${PORT}`);
  try {
    const now = await testDB();
    console.log("✅ DB conectada:", now);
  } catch (e) {
    console.error("❌ DB error:", e.message);
  }
});
