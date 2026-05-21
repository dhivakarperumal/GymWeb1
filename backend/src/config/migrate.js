const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  // Ensure database exists
  try {
    const mysql = require("mysql2/promise");
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await tempConnection.end();
    console.log(`✅ Database "${process.env.DB_NAME}" checked/created successfully.`);
  } catch (err) {
    console.warn("⚠️ Failed to check/create database:", err.message);
  }

  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found. Skipping.');
    return;
  }

  // Ensure migrations table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const [executedRows] = await db.query('SELECT filename FROM _migrations');
  const executedFiles = new Set(executedRows.map(r => r.filename));

  for (const file of files) {
    if (!executedFiles.has(file)) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split by semicolon but ignore semicolons inside quotes or comments if possible
      // A simple split(';') works for most basic SQL files
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        for (const statement of statements) {
          try {
            await connection.query(statement);
          } catch (err) {
            // Ignore "Duplicate key name" error (1061)
            if (err.errno === 1061 || err.code === 'ER_DUP_KEYNAME') {
              console.warn(`  → Skipping redundant index: ${err.message.split("'")[1]}`);
            } else {
              throw err;
            }
          }
        }
        await connection.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
        await connection.commit();
        console.log(`Successfully executed ${file}`);
      } catch (err) {
        await connection.rollback();
        console.error(`Error in migration ${file}:`, err.message);
        throw err;
      } finally {
        connection.release();
      }
    }
  }
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('All migrations completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
