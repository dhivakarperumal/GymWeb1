const db = require('./src/config/db');
(async () => {
  try {
    const [rows] = await db.query('DESCRIBE offers');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
