const db = require('../src/config/db');

async function checkConfig() {
  try {
    const [rows] = await db.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    console.log('max_allowed_packet:', rows[0]);
  } catch (err) {
    console.error('Error checking config:', err);
  } finally {
    process.exit();
  }
}

checkConfig();
