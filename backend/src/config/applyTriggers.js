const db = require('./db.js');

async function applyTriggers() {
  console.log("Applying triggers to automatically populate created_by and updated_by...");
  try {
    // 1. Get all tables in the current database
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
    `);

    // 2. For each table, check if created_by and updated_by exist
    for (const row of tables) {
      const tableName = row.TABLE_NAME;
      
      const [columns] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      `, [tableName]);
      
      const colNames = columns.map(c => c.COLUMN_NAME);
      
      const hasCreatedBy = colNames.includes('created_by');
      const hasCreatedByName = colNames.includes('created_by_name');
      const hasUpdatedBy = colNames.includes('updated_by');
      const hasUpdatedByName = colNames.includes('updated_by_name');
      
      if (hasCreatedBy || hasUpdatedBy) {
        console.log(`Processing table: ${tableName}`);
        
        // INSERT TRIGGER
        if (hasCreatedBy || hasCreatedByName) {
          const triggerNameInsert = `before_insert_${tableName}`;
          await db.query(`DROP TRIGGER IF EXISTS ${triggerNameInsert}`);
          
          let insertBody = '';
          if (hasCreatedBy) insertBody += 'IF NEW.created_by IS NULL THEN SET NEW.created_by = @web_user_id; END IF;\n';
          if (hasCreatedByName) insertBody += 'IF NEW.created_by_name IS NULL THEN SET NEW.created_by_name = @web_username; END IF;\n';
          
          if (insertBody) {
            await db.query(`
              CREATE TRIGGER ${triggerNameInsert}
              BEFORE INSERT ON ${tableName}
              FOR EACH ROW
              BEGIN
                IF @web_user_id IS NOT NULL THEN
                  ${insertBody}
                END IF;
              END;
            `);
            console.log(`  - Created BEFORE INSERT trigger`);
          }
        }
        
        // UPDATE TRIGGER
        if (hasUpdatedBy || hasUpdatedByName) {
          const triggerNameUpdate = `before_update_${tableName}`;
          await db.query(`DROP TRIGGER IF EXISTS ${triggerNameUpdate}`);
          
          let updateBody = '';
          if (hasUpdatedBy) updateBody += 'SET NEW.updated_by = @web_user_id;\n';
          if (hasUpdatedByName) updateBody += 'SET NEW.updated_by_name = @web_username;\n';
          
          if (updateBody) {
            await db.query(`
              CREATE TRIGGER ${triggerNameUpdate}
              BEFORE UPDATE ON ${tableName}
              FOR EACH ROW
              BEGIN
                IF @web_user_id IS NOT NULL THEN
                  ${updateBody}
                END IF;
              END;
            `);
            console.log(`  - Created BEFORE UPDATE trigger`);
          }
        }
      }
    }
    console.log("✅ All triggers applied successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error applying triggers:", err);
    process.exit(1);
  }
}

applyTriggers();
