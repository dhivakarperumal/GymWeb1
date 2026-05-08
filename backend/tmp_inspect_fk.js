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
    const [tables] = await conn.query("SELECT table_name, engine FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('branches','users','members','trainers')", [config.database]);
    console.log('TABLES:', tables);
    const [cols] = await conn.query("SELECT table_name, column_name, column_type, is_nullable FROM information_schema.columns WHERE table_schema = ? AND table_name IN ('branches','users','members','trainers') ORDER BY table_name, ordinal_position", [config.database]);
    console.log('COLUMNS:');
    console.table(cols);
    const [fks] = await conn.query("SELECT table_name, constraint_name, column_name, referenced_table_name, referenced_column_name FROM information_schema.key_column_usage WHERE table_schema = ? AND table_name IN ('members','trainers') AND referenced_table_name IS NOT NULL", [config.database]);
    console.log('FOREIGN KEYS:');
    console.table(fks);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();