require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/src/config/db');

async function migrate() {
    try {
        console.log("Checking for status column in trainer_sessions...");
        const [rows] = await db.query("SHOW COLUMNS FROM trainer_sessions LIKE 'status'");
        if (rows.length === 0) {
            console.log("Adding status column to trainer_sessions...");
            await db.query("ALTER TABLE trainer_sessions ADD COLUMN status VARCHAR(50) DEFAULT 'Completed' AFTER session_type");
            console.log("Column added successfully.");
        } else {
            console.log("Status column already exists.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
