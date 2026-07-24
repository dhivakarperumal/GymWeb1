const db = require('./backend/src/config/db.js');

async function runQueries() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("---- Fetching pt_forms for member 3134 or 6259 ----");
    const [forms] = await connection.query(`
      SELECT id, member_id, user_id, form_data
      FROM pt_forms
      WHERE member_id = 3134 OR member_id = 6259 OR member_id = '6259' OR member_id = '3134'
    `);
    
    if (forms.length > 0) {
      const formData = JSON.parse(forms[0].form_data);
      console.log("Sessions:", JSON.stringify(formData.sessions, null, 2));
      console.log("trainer_name_assigned:", formData.trainer_name_assigned);
      console.log("Row ID:", forms[0].id);
    } else {
      console.log("No pt_forms found for this member.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

runQueries();
