const db = require('../src/config/db');

async function fixConfig() {
  try {
    console.log('Attempting to increase max_allowed_packet to 100MB...');
    await db.query("SET GLOBAL max_allowed_packet = 104857600");
    const [rows] = await db.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    console.log('New max_allowed_packet (might need reconnect to see global change):', rows[0]);
  } catch (err) {
    console.error('Error fixing config:', err);
    console.log('Trying session-level fix...');
    try {
        await db.query("SET SESSION max_allowed_packet = 104857600");
        const [rows] = await db.query("SHOW VARIABLES LIKE 'max_allowed_packet'");
        console.log('Session max_allowed_packet:', rows[0]);
    } catch (sessionErr) {
        console.error('Session fix also failed:', sessionErr);
    }
  } finally {
    process.exit();
  }
}

fixConfig();
