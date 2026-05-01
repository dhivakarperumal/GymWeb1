const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Inside backend folder
const envPath = path.join(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim().replace(/^"|"$/g, '');
    return acc;
  }, {});

async function runMigration() {
  const connection = await mysql.createConnection({
    host: envConfig.DB_HOST || 'localhost',
    user: envConfig.DB_USER,
    password: envConfig.DB_PASSWORD,
    database: envConfig.DB_NAME,
    port: envConfig.DB_PORT || 3306
  });

  try {
    console.log('Connected to database.');
    const sqlPath = path.join(__dirname, 'src/config/migrations/0051_add_fields_to_offers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement}`);
        await connection.query(statement);
      } catch (e) {
        console.warn(`Statement failed: ${e.message}`);
      }
    }
    
    try {
      await connection.query('INSERT INTO migrations (migration_name) VALUES (?)', ['0051_add_fields_to_offers.sql']);
    } catch (e) {}

    console.log('Migration process finished.');
  } catch (err) {
    console.error('Migration fatal error:', err.message);
  } finally {
    await connection.end();
  }
}

runMigration();
