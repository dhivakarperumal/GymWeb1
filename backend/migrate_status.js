require('dotenv').config();
const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log("Checking for status column in trainer_sessions...");
        const [rows] = await connection.query("SHOW COLUMNS FROM trainer_sessions LIKE 'status'");
        if (rows.length === 0) {
            console.log("Adding status column to trainer_sessions...");
            await connection.query("ALTER TABLE trainer_sessions ADD COLUMN status VARCHAR(50) DEFAULT 'Completed' AFTER session_type");
            console.log("Column added successfully.");
        } else {
            console.log("Status column already exists.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
