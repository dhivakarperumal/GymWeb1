require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
(async () => {
  const migrationsDir = path.join(__dirname, 'src', 'config', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log('FILES:', files.slice(-10));
  const conn = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gymwebsite_db',
  }).getConnection();
  try {
    const [executed] = await conn.query('SELECT filename FROM _migrations');
    console.log('EXECUTED:', executed.map(r => r.filename).slice(-10));
  } catch (e) {
    console.error('ERR SELECT _migrations:', e.message);
  } finally {
    await conn.release();
  }
})();