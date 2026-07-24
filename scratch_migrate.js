const db = require('./backend/src/config/db.js');

async function migrate() {
  let connection;
  try {
    connection = await db.getConnection();
    
    // Add membership_id to trainer_sessions
    await connection.query(`
      ALTER TABLE trainer_sessions 
      ADD COLUMN membership_id INT NULL,
      ADD INDEX idx_trainer_sessions_membership_id (membership_id);
    `);
    console.log("Migration successful");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column membership_id already exists");
    } else {
      console.error(err);
    }
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

migrate();
