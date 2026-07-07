const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'gymwebsite_db'
  });

  const [members] = await conn.query('SELECT id, name, phone, status, has_pt_plan, plan FROM gym_members LIMIT 10');
  console.log('Members:', members);
  
  conn.end();
}
main().catch(console.error);
