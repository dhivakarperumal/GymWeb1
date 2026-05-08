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
    const sql = `CREATE TABLE IF NOT EXISTS trainers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      branch_id INT,
      specialization TEXT,
      hire_date DATE DEFAULT CURDATE(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    ) ENGINE=InnoDB`;
    console.log(sql);
    await conn.query(sql);
    console.log('Trainers created or already exists');
  } catch (err) {
    console.error('ERROR:', err.code, err.errno, err.sqlMessage || err.message);
  } finally {
    await conn.end();
  }
})();