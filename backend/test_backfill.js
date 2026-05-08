require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function runBackfill() {
  try {
    console.log('Starting manual backfill...');
    
    const [u] = await db.query('SELECT id, user_id FROM users WHERE id = 583');
    console.log('User 583 in DB:', u);

    const [a] = await db.query('SELECT id, user_id, user_id_uuid FROM trainer_assignments WHERE user_id = 583');
    console.log('Assignments for 583:', a);

    const [res] = await db.query(`
      UPDATE trainer_assignments ta
      JOIN users u ON u.id = ta.user_id
      SET ta.user_id_uuid = u.user_id
      WHERE ta.user_id_uuid IS NULL AND ta.user_id = 583
    `);
    console.log('Update result:', res);
    
    const [a2] = await db.query('SELECT id, user_id, user_id_uuid FROM trainer_assignments WHERE user_id = 583');
    console.log('Assignments for 583 after:', a2);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

runBackfill();
