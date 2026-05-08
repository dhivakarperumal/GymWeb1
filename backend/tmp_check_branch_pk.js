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
    const [[{null_count}]] = await conn.query('SELECT COUNT(*) AS null_count FROM branches WHERE id IS NULL');
    const [[{dup_count}]] = await conn.query('SELECT COUNT(*) - COUNT(DISTINCT id) AS dup_count FROM branches');
    console.log('NULL IDs:', null_count);
    console.log('DUPLICATE IDs:', dup_count);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();