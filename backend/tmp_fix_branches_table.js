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
    console.log('Starting branches cleanup...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DROP TABLE IF EXISTS branches_clean');
    await conn.query('CREATE TABLE branches_clean LIKE branches');
    await conn.query(`INSERT INTO branches_clean (id,name,location,phone,email,manager_name,created_at,updated_at)
      SELECT id, MIN(name), MIN(location), MIN(phone), MIN(email), MIN(manager_name), MIN(created_at), MIN(updated_at)
      FROM branches GROUP BY id`);
    await conn.query('RENAME TABLE branches TO branches_old, branches_clean TO branches');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.query('ALTER TABLE branches ADD PRIMARY KEY (id)');
    console.log('Branches table cleaned and primary key added successfully.');
  } catch (err) {
    console.error('Branch cleanup failed:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();