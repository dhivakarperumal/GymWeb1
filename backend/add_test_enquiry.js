const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function addTestEnquiry() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gymwebsite_db',
        port: process.env.DB_PORT || 3306
    });

    try {
        const [result] = await connection.execute(
            `INSERT INTO enquiries (
                name, email, phone, location, dob, age, address, 
                employer, occupation, emergency_contact_name, 
                emergency_contact_relationship, emergency_contact_address, 
                emergency_contact_phone_home, emergency_contact_phone_work, 
                fitness_goal, blood_group, height, weight, bmi, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'John Doe', 'john.doe@example.com', '9876543210', 'Main Branch', 
                '1995-05-15', 31, '123 Gym Street, Fitness City', 
                'Tech Corp', 'Software Engineer', 'Jane Doe', 
                'Spouse', '123 Gym Street, Fitness City', 
                '9876543211', '044-123456', 
                'Lose 5kg and build muscle', 'O+', 
                175.5, 80.0, 26.0, 'pending'
            ]
        );
        console.log('✅ Test Enquiry added successfully! ID:', result.insertId);
    } catch (error) {
        console.error('❌ Error adding test enquiry:', error.message);
    } finally {
        await connection.end();
    }
}

addTestEnquiry();
