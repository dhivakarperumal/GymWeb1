const db = require('./db');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  try {
    // 1. Create migrations table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Get executed migrations
    const [executedRows] = await db.query('SELECT migration_name FROM migrations');
    const executedMigrations = new Set(executedRows.map(row => row.migration_name));

    // 3. Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    // 4. Run pending migrations
    for (const file of sqlFiles) {
      if (!executedMigrations.has(file)) {
        console.log(`🚀 Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Execute multiple statements if present (split by ;)
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        for (const statement of statements) {
          try {
            await db.query(statement);
          } catch (err) {
            // Ignore duplicate column/index or missing drop targets
            const ignoredErrors = ['ER_DUP_KEYNAME', 'ER_DUP_FIELDNAME', 'ER_CANT_DROP_FIELD_OR_KEY'];
            if (ignoredErrors.includes(err.code)) {
              console.log(`  ℹ️ Skipping: ${err.message}`);
            } else {
              throw err;
            }
          }
        }

        await db.query('INSERT INTO migrations (migration_name) VALUES (?)', [file]);
        console.log(`✅ Success: ${file}`);
      }
    }
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    // Don't throw if it's just startup check, but here we want to know
    throw err;
  }
}

module.exports = { runMigrations };
