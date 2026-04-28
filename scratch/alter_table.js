const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/db');

async function run() {
    try {
        console.log("Altering followups table...");
        await pool.query("ALTER TABLE followups ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) DEFAULT 'Admin'");
        console.log("Table altered successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error altering table:", err);
        process.exit(1);
    }
}

run();
