const pool = require('./backend/src/config/db.js');
const als = require('./backend/src/config/context.js');

async function run() {
  als.run(new Map([['user', { user_id: 'test-uuid', username: 'test-user' }]]), async () => {
    try {
      const [rows] = await pool.query('SELECT @web_user_id, @web_username');
      console.log('Via pool.query:', rows[0]);
      
      const conn = await pool.getConnection();
      const [rows2] = await conn.query('SELECT @web_user_id, @web_username');
      console.log('Via pool.getConnection:', rows2[0]);
      conn.release();
    } catch (e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  });
}

run();
