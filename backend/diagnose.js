/**
 * Diagnostic script to troubleshoot backend connectivity and migrations
 * Run this if you're getting 500 errors on API endpoints
 * 
 * Usage: node backend/diagnose.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('🔍 Backend Diagnostic Report\n');
console.log('=' .repeat(50));

// Check environment variables
console.log('\n📋 Environment Configuration:');
console.log(`  DB_HOST: ${process.env.DB_HOST || '❌ NOT SET'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || 3306}`);
console.log(`  DB_USER: ${process.env.DB_USER || '❌ NOT SET'}`);
console.log(`  DB_NAME: ${process.env.DB_NAME || '❌ NOT SET'}`);
console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? '✓ SET' : '❌ NOT SET'}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Check database connectivity
(async () => {
  try {
    console.log('\n🔌 Testing Database Connection...');
    const config = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

    const connection = await mysql.createConnection(config);
    console.log('  ✓ Connection successful');

    // Check schema_migrations table
    try {
      const [rows] = await connection.query(
        'SELECT COUNT(*) as cnt FROM schema_migrations'
      );
      console.log(`\n📊 Migration Status:`);
      console.log(`  Total applied migrations: ${rows[0].cnt}`);

      // List recent migrations
      const [recent] = await connection.query(
        'SELECT filename, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 5'
      );
      console.log('\n  Recent migrations:');
      recent.forEach(m => {
        console.log(`    - ${m.filename} (${new Date(m.applied_at).toLocaleString()})`);
      });
    } catch (err) {
      console.log(`  ⚠️  Could not query schema_migrations: ${err.message}`);
    }

    // Check products table
    try {
      const [rows] = await connection.query(
        'SELECT COUNT(*) as cnt FROM products'
      );
      console.log(`\n📦 Products Table:`);
      console.log(`  Total products: ${rows[0].cnt}`);
    } catch (err) {
      console.log(`\n📦 Products Table:`);
      console.log(`  ❌ Error: ${err.message}`);
    }

    await connection.end();
    console.log('\n' + '='.repeat(50));
    console.log('✅ Diagnostic complete\n');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Database Connection Failed:`);
    console.error(`  ${err.message}`);
    console.error('\n  Possible causes:');
    console.error('  1. Database server is not running or not accessible');
    console.error('  2. Credentials are incorrect (check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    console.error('  3. Database does not exist (need to run init.js first)');
    console.error('\n' + '='.repeat(50));
    process.exit(1);
  }
})();
