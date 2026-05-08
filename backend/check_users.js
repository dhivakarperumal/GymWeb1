require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function checkUsers() {
  try {
    const [rows] = await db.query('SELECT id, username, email, user_id FROM users LIMIT 20');
    console.log('Users (id, username, uuid):');
    rows.forEach(r => console.log(`${r.id}, ${r.username}, ${r.user_id}`));
    
    const [rows2] = await db.query('SELECT id, user_id, user_id_uuid FROM workout_programs LIMIT 10');
    console.log('\nWorkouts (id, user_id, user_id_uuid):');
    rows2.forEach(r => console.log(`${r.id}, ${r.user_id}, ${r.user_id_uuid}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkUsers();
