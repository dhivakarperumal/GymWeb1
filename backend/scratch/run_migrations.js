const { runMigrations } = require('../src/config/migrate');

async function run() {
  try {
    await runMigrations();
    console.log("Migrations finished successfully");
    process.exit(0);
  } catch (err) {
    console.error("MIGRATION FAILED:");
    console.error(err);
    process.exit(1);
  }
}

run();
