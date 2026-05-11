require("dotenv").config();
const mysql = require("mysql2/promise");

async function resetDatabase() {
  try {
    // Connect without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    const dbName = process.env.DB_NAME || 'gymwebsite_db';
    
    console.log(`Dropping database ${dbName} if it exists...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    
    console.log(`Creating database ${dbName}...`);
    await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`Database reset successfully!`);
    
    await connection.end();
  } catch (error) {
    console.error('Error resetting database:', error.message);
    process.exit(1);
  }
}

resetDatabase();
