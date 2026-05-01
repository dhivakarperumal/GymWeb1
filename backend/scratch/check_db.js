const db = require('../src/config/db');

async function check() {
  try {
    const [rows] = await db.query("SHOW COLUMNS FROM followups");
    console.log("COLUMNS IN followups:");
    rows.forEach(r => console.log(`- ${r.Field}`));
    process.exit(0);
  } catch (err) {
    console.error("DB Error:", err.message);
    process.exit(1);
  }
}

check();
