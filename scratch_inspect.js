const db = require('./backend/src/config/db.js');

async function runQueries() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("---- 1. Find the user record ----");
    const [users] = await connection.query(`
      SELECT id, user_id, username, email, mobile, role, created_at
      FROM users
      WHERE mobile = '9698275316' OR email = 'bala.22v@gmail.com'
    `);
    console.table(users);

    console.log("---- 2. Find the gym_member record ----");
    const [members] = await connection.query(`
      SELECT id, member_id, name, phone, email,
             pt_plan, pt_status, pt_join_date, pt_expiry_date, pt_duration,
             plan, status, join_date, expiry_date, created_at
      FROM gym_members
      WHERE phone = '9698275316' OR email = 'bala.22v@gmail.com'
    `);
    console.table(members);

    if (users.length > 0) {
      const userId = users[0].id;
      console.log(`---- 3. Find ALL membership purchase records for this user (${userId}) ----`);
      const [memberships] = await connection.query(`
        SELECT id, userId, planId, planName, status,
               startDate, endDate, duration,
               has_pt_plan, pt_planId, pt_planName, pt_status,
               pt_startDate, pt_endDate, pt_duration,
               pt_price, pt_pricePaid, createdAt
        FROM memberships
        WHERE userId = ?
        ORDER BY createdAt DESC
      `, [userId]);
      console.table(memberships);
      
      console.log(`---- 5. Check for duplicate ACTIVE PT plan memberships ----`);
      const [activeMemberships] = await connection.query(`
        SELECT id, userId, pt_planName, pt_status, pt_startDate, pt_endDate, has_pt_plan
        FROM memberships
        WHERE userId = ? AND has_pt_plan = 1
        ORDER BY createdAt DESC
      `, [userId]);
      console.table(activeMemberships);
    }

    if (members.length > 0) {
      const memberId = members[0].id;
      console.log(`---- 4. Find ALL trainer_sessions for this member (${memberId}) ----`);
      const [sessions] = await connection.query(`
        SELECT id, member_id, member_name, session_date, status,
               trainer_id, session_type, created_at
        FROM trainer_sessions
        WHERE member_id = ?
        ORDER BY session_date DESC
      `, [memberId]);
      console.table(sessions);
    }

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

runQueries();
