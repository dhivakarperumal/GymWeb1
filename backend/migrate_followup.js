const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gymwebsite_db',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Starting migrations for separate Followup table...');

        // 1. Create separate followups table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS followups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                subject VARCHAR(255),
                message TEXT,
                location VARCHAR(255),
                dob DATE,
                age INT,
                address TEXT,
                employer VARCHAR(255),
                occupation VARCHAR(255),
                emergency_contact_name VARCHAR(255),
                emergency_contact_relationship VARCHAR(255),
                emergency_contact_address TEXT,
                emergency_contact_phone_home VARCHAR(50),
                emergency_contact_phone_work VARCHAR(50),
                fitness_goal TEXT,
                blood_group VARCHAR(10),
                height VARCHAR(20),
                weight VARCHAR(20),
                bmi VARCHAR(20),
                gender VARCHAR(20),
                plan_name VARCHAR(100),
                plan_duration INT,
                status VARCHAR(50) DEFAULT 'pending',
                reg_no VARCHAR(50),
                organization VARCHAR(255),
                website VARCHAR(255),
                best_time_to_reach VARCHAR(255),
                referred_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Table followups created.');

        // 2. Create followup_interactions table (for the logs)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS followup_interactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                followup_id INT NOT NULL,
                interaction_date DATETIME NOT NULL,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                next_followup_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (followup_id) REFERENCES followups(id) ON DELETE CASCADE
            )
        `);
        console.log('Table followup_interactions created.');

        console.log('Migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
