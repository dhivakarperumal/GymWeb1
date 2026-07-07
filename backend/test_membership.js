const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'gymwebsite_db'
  });

  const memberId = 232;

  // Verify membership exists first
  const [existing] = await conn.query('SELECT id FROM memberships LIMIT 1');
  console.log('Memberships exist:', existing);
  
  conn.end();
}
main().catch(console.error);
