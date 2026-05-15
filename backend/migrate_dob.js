const pool = require('./src/config/db');
const dayjs = require('dayjs');

async function migrateDobToVarchar() {
  const connection = await pool.getConnection();
  try {
    console.log("Starting migration to change dob columns from DATE to VARCHAR...");
    
    const tables = ['enquiries', 'gym_members', 'staff'];
    
    for (const table of tables) {
      try {
        // Check if table and column exist
        const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'dob'`);
        if (columns.length > 0) {
          console.log(`Processing table: ${table}`);
          
          // 1. Fetch existing dates
          const [rows] = await connection.query(`SELECT id, dob FROM ${table} WHERE dob IS NOT NULL`);
          
          // 2. Change column type
          await connection.query(`ALTER TABLE ${table} MODIFY dob VARCHAR(20)`);
          console.log(`Modified dob column to VARCHAR(20) in ${table}`);
          
          // 3. Update existing dates to DD-MM-YYYY format
          let updateCount = 0;
          for (const row of rows) {
            if (row.dob && row.dob !== '0000-00-00') {
              // Convert Date object or YYYY-MM-DD string to DD-MM-YYYY
              const formattedDob = dayjs(row.dob).format('DD-MM-YYYY');
              if (formattedDob !== 'Invalid Date') {
                await connection.query(`UPDATE ${table} SET dob = ? WHERE id = ?`, [formattedDob, row.id]);
                updateCount++;
              }
            } else if (row.dob === '0000-00-00') {
               await connection.query(`UPDATE ${table} SET dob = ? WHERE id = ?`, ["", row.id]);
               updateCount++;
            }
          }
          console.log(`Updated ${updateCount} rows in ${table} to DD-MM-YYYY format.`);
        } else {
            console.log(`Column 'dob' not found in table ${table}, skipping.`);
        }
      } catch (err) {
        console.error(`Error processing table ${table}:`, err.message);
      }
    }
    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrateDobToVarchar();
