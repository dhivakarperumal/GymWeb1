require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Connected to database.');
    const sqlPath = path.join(__dirname, 'backend/src/config/migrations/0051_add_fields_to_offers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement}`);
      await connection.query(statement);
    }
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await connection.end();
  }
}

runMigration();
