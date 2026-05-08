const db = require('./src/config/db');

(async () => {
  try {
    const [rows] = await db.query('SHOW COLUMNS FROM workout_programs');
    console.table(rows.map(r => ({Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key, Default: r.Default, Extra: r.Extra})));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();