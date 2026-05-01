const db = require('../backend/src/config/db');

async function checkTable() {
  try {
    const [rows] = await db.query("SHOW TABLES LIKE 'offers'");
    if (rows.length > 0) {
      console.log("✅ Table 'offers' exists.");
      const [cols] = await db.query("DESCRIBE offers");
      console.log("Columns:", cols.map(c => c.Field).join(', '));
    } else {
      console.log("❌ Table 'offers' does NOT exist.");
    }
  } catch (err) {
    console.error("Error checking table:", err.message);
  } finally {
    process.exit();
  }
}

checkTable();
