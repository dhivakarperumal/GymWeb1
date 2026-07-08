const pool = require('./backend/src/config/db.js');

async function run() {
  const [rows] = await pool.query('DESCRIBE gym_members');
  console.log(rows.map(r => r.Field).join(', '));
  process.exit(0);
}

run();
