require('dotenv').config();
const mysql = require('mysql2/promise');
(async () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gymwebsite_db',
  };
  const conn = await mysql.createConnection(config);
  try {
    const [[branches]] = await conn.query('SHOW CREATE TABLE branches');
    const [[users]] = await conn.query('SHOW CREATE TABLE users');
    console.log('BRANCHES CREATE:');
    console.log(branches['Create Table']);
    console.log('\nUSERS CREATE:');
    console.log(users['Create Table']);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();