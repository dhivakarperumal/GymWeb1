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
        console.log('Starting migrations...');

        // 1. Create enquiry_followups table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS enquiry_followups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                enquiry_id INT NOT NULL,
                followup_date DATETIME NOT NULL,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                next_followup_date DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE
            )
        `);
        console.log('Table enquiry_followups checked/created.');

        // 2. Add missing columns to enquiries
        const columnsToAdd = [
            { name: 'reg_no', type: 'VARCHAR(50)' },
            { name: 'organization', type: 'VARCHAR(255)' },
            { name: 'website', type: 'VARCHAR(255)' },
            { name: 'best_time_to_reach', type: 'VARCHAR(255)' },
            { name: 'referred_by', type: 'VARCHAR(255)' }
        ];

        const [existingColumns] = await connection.query(`SHOW COLUMNS FROM enquiries`);
        const existingColumnNames = existingColumns.map(c => c.Field);

        for (const col of columnsToAdd) {
            if (!existingColumnNames.includes(col.name)) {
                await connection.query(`ALTER TABLE enquiries ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Column ${col.name} added to enquiries.`);
            }
        }

        console.log('Migrations completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
