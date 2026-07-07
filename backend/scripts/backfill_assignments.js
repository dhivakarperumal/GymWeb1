const db = require('../src/config/db');

(async () => {
  try {
    const res = await db.query(
      "UPDATE trainer_assignments SET created_by = updated_by, created_by_name = updated_by_name WHERE created_by IS NULL AND updated_by IS NOT NULL"
    );
    console.log('BACKFILL RESULT:', res);
  } catch (err) {
    console.error('BACKFILL ERROR:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
