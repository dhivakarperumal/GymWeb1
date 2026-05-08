require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');

async function runFullBackfill() {
  try {
    console.log('Starting full manual backfill...');

    // 1. Users UUID generation
    const [res1] = await db.query("UPDATE users SET user_id = UUID() WHERE user_id IS NULL OR user_id = ''");
    console.log('Users UUID backfill:', res1.affectedRows, 'rows updated');

    // 2. trainer_assignments
    const [res2] = await db.query(`
      UPDATE trainer_assignments ta
      JOIN users u ON u.id = ta.user_id
      SET ta.user_id_uuid = u.user_id
      WHERE ta.user_id_uuid IS NULL
    `);
    console.log('trainer_assignments backfill:', res2.affectedRows, 'rows updated');

    // 3. diet_plans
    const [res3] = await db.query(`
      UPDATE diet_plans dp
      JOIN users u ON u.id = dp.user_id
      SET dp.user_id_uuid = u.user_id
      WHERE dp.user_id_uuid IS NULL
    `);
    console.log('diet_plans backfill:', res3.affectedRows, 'rows updated');

    // 4. workout_programs
    const [res4] = await db.query(`
      UPDATE workout_programs wp
      JOIN users u ON u.id = wp.user_id
      SET wp.user_id_uuid = u.user_id
      WHERE wp.user_id_uuid IS NULL
    `);
    console.log('workout_programs backfill:', res4.affectedRows, 'rows updated');

    // 5. staff
    const [res5] = await db.query(`
      UPDATE staff s
      JOIN users u ON (s.email = u.email AND s.email IS NOT NULL AND s.email != '') OR (s.username = u.username)
      SET s.user_id = u.user_id
      WHERE s.user_id IS NULL
    `);
    console.log('staff backfill:', res5.affectedRows, 'rows updated');

    // 6. gym_members
    const [res6] = await db.query(`
      UPDATE gym_members gm
      JOIN users u ON (gm.email = u.email AND gm.email IS NOT NULL AND gm.email != '') OR (gm.phone = u.mobile AND gm.phone IS NOT NULL AND gm.phone != '')
      SET gm.user_id = u.user_id
      WHERE gm.user_id IS NULL
    `);
    console.log('gym_members backfill:', res6.affectedRows, 'rows updated');

  } catch (err) {
    console.error('Error during backfill:', err.message);
  } finally {
    process.exit();
  }
}

runFullBackfill();
