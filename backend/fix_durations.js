const db = require('./src/config/db');

async function fixDurations() {
  console.log('🔄 Normalizing plan durations...');
  
  const mapping = {
    '1': '1 Month',
    '3': '3 Months',
    '6': '6 Months',
    '12': '1 Year',
    '12 Months': '1 Year'
  };

  const [rows] = await db.query('SELECT id, duration FROM gym_plans');
  
  for (const row of rows) {
    if (mapping[row.duration]) {
      await db.query('UPDATE gym_plans SET duration = ? WHERE id = ?', [mapping[row.duration], row.id]);
      console.log(`✅ ID ${row.id}: ${row.duration} -> ${mapping[row.duration]}`);
    }
  }
  
  console.log('✨ Durations normalized!');
  process.exit();
}

fixDurations();
