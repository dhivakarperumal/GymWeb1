const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function createTestFollowup() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gymwebsite_db',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Inserting test followup record...');

        const [result] = await connection.query(`
            INSERT INTO followups (
                name, email, phone, subject, message, status, organization, website, referred_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'Test Followup User',
            'test@example.com',
            '9876543210',
            'Membership Inquiry',
            'Interested in premium plan. Needs callback.',
            'pending',
            'Tech Corp',
            'www.techcorp.com',
            'Friend'
        ]);

        console.log(`Test followup created with ID: ${result.insertId}`);

        // Also add an initial interaction log
        await connection.query(`
            INSERT INTO followup_interactions (
                followup_id, interaction_date, notes, status
            ) VALUES (?, NOW(), ?, ?)
        `, [result.insertId, 'Initial system entry created.', 'pending']);

        console.log('Initial interaction log added.');

    } catch (error) {
        console.error('Failed to create test followup:', error);
    } finally {
        await connection.end();
    }
}

createTestFollowup();
