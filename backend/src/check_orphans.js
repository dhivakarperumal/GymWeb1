const db = require('./config/db');

(async () => {
  try {
    const [rows] = await db.query(`
      SELECT id, username, email, mobile, created_at 
      FROM users u 
      WHERE u.role = 'user' AND NOT EXISTS (
        SELECT 1 FROM gym_members gm2 
        WHERE (gm2.email = u.email AND u.email IS NOT NULL AND u.email != '') 
           OR (gm2.phone = u.mobile AND u.mobile IS NOT NULL AND u.mobile != '')
      )
    `);
    console.log(`Found ${rows.length} orphaned users:`);
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
