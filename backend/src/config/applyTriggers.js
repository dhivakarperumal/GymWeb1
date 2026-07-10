const db = require('./db.js');

function quoteIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

async function applyTriggers() {
  console.log("Applying triggers to automatically populate created_by and updated_by...");
  try {
    const [tables] = await db.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
    `);

    for (const row of tables) {
      const tableName = row.TABLE_NAME;
      const [columns] = await db.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      `, [tableName]);

      const colNames = new Set(columns.map((c) => c.COLUMN_NAME));
      const hasCreatedBy = colNames.has('created_by');
      const hasCreatedByName = colNames.has('created_by_name');
      const hasUpdatedBy = colNames.has('updated_by');
      const hasUpdatedByName = colNames.has('updated_by_name');

      if (!hasCreatedBy && !hasUpdatedBy && !hasCreatedByName && !hasUpdatedByName) {
        continue;
      }

      console.log(`Processing table: ${tableName}`);

      if (hasCreatedBy || hasCreatedByName) {
        const triggerNameInsert = `before_insert_${tableName}`.replace(/[^a-zA-Z0-9_]/g, '_');
        await db.query(`DROP TRIGGER IF EXISTS ${quoteIdentifier(triggerNameInsert)}`);

        let insertBody = '';
        if (hasCreatedBy) insertBody += 'IF NEW.created_by IS NULL THEN SET NEW.created_by = @web_user_id; END IF;\n';
        if (hasCreatedByName) insertBody += 'IF NEW.created_by_name IS NULL THEN SET NEW.created_by_name = @web_username; END IF;\n';

        if (insertBody) {
          await db.query(`
            CREATE TRIGGER ${quoteIdentifier(triggerNameInsert)}
            BEFORE INSERT ON ${quoteIdentifier(tableName)}
            FOR EACH ROW
            BEGIN
              IF @web_user_id IS NOT NULL THEN
                ${insertBody}
              END IF;
            END;
          `);
          console.log('  - Created BEFORE INSERT trigger');
        }
      }

      if (hasUpdatedBy || hasUpdatedByName) {
        const triggerNameUpdate = `before_update_${tableName}`.replace(/[^a-zA-Z0-9_]/g, '_');
        await db.query(`DROP TRIGGER IF EXISTS ${quoteIdentifier(triggerNameUpdate)}`);

        let updateBody = '';
        if (hasUpdatedBy) updateBody += 'SET NEW.updated_by = @web_user_id;\n';
        if (hasUpdatedByName) updateBody += 'SET NEW.updated_by_name = @web_username;\n';

        if (updateBody) {
          await db.query(`
            CREATE TRIGGER ${quoteIdentifier(triggerNameUpdate)}
            BEFORE UPDATE ON ${quoteIdentifier(tableName)}
            FOR EACH ROW
            BEGIN
              IF @web_user_id IS NOT NULL THEN
                ${updateBody}
              END IF;
            END;
          `);
          console.log('  - Created BEFORE UPDATE trigger');
        }
      }
    }

    console.log('✅ All triggers applied successfully.');
  } catch (err) {
    console.error('❌ Error applying triggers:', err);
    throw err;
  }
}

if (require.main === module) {
  applyTriggers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { applyTriggers };
