const db = require('../src/config/db');

async function createTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS offers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        offer_name VARCHAR(255) NOT NULL,
        offer_type ENUM('plan', 'product') NOT NULL,
        target_id INT NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        description TEXT,
        offer_image LONGTEXT,
        active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.query(sql);
    console.log('✅ Table "offers" created or already exists.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
    process.exit(1);
  }
}

createTable();
