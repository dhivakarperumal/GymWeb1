const db = require('../src/config/db');

async function run() {
  try {
    const [[{cnt}]] = await db.query('SELECT COUNT(*) as cnt FROM gym_members');
    console.log('gym_members count:', cnt);

    const [[{mcount}]] = await db.query('SELECT COUNT(*) as mcount FROM memberships');
    console.log('memberships count:', mcount);

    const [sampleMembers] = await db.query('SELECT id, member_id, name, phone, email, plan, join_date, expiry_date FROM gym_members LIMIT 10');
    console.log('sample gym_members rows:', sampleMembers);

    const [sampleMemberships] = await db.query('SELECT id, userId, planName, price, pricePaid, startDate, endDate FROM memberships ORDER BY id DESC LIMIT 10');
    console.log('sample memberships rows:', sampleMemberships);

    process.exit(0);
  } catch (err) {
    console.error('check_members error:', err.message || err);
    process.exit(1);
  }
}

run();
