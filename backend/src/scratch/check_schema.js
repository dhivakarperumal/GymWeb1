const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gymwebsite_db'
  });
  
  const [rows] = await connection.query('DESCRIBE memberships');
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}

checkSchema().catch(console.error);
