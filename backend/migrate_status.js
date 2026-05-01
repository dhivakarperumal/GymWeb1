const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('🚀 Starting migration: Adding status column to products table...');
    
    // Check if column exists
    const [columns] = await db.query('SHOW COLUMNS FROM products LIKE "status"');
    
    if (columns.length === 0) {
      await db.query('ALTER TABLE products ADD COLUMN status VARCHAR(20) DEFAULT "active"');
      console.log('✅ Success: status column added to products table.');
    } else {
      console.log('ℹ️ Column "status" already exists. No changes needed.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
