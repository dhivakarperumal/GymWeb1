const db = require('./backend/src/config/db');

async function testHasPtPlan() {
  const [rows] = await db.query(`
    SELECT 
      u.id as userId,
      IF((SELECT COUNT(*) FROM memberships pt_m WHERE pt_m.userId = u.id AND pt_m.has_pt_plan = 1 AND (pt_m.status = 'active' OR pt_m.pt_status = 'active')) > 0, 1, 0) as has_pt_plan
    FROM users u
    WHERE u.role = 'user'
    LIMIT 5
  `);
  console.log(rows);
  process.exit(0);
}

testHasPtPlan();
