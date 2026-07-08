const db = require('./backend/src/config/db.js');
db.query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME IN ('created_by', 'updated_by', 'created_by_name', 'updated_by_name')")
  .then(([rows]) => { console.log(rows); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
