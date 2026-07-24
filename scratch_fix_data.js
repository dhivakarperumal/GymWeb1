const db = require('./backend/src/config/db.js');

async function fixData() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log("---- Fetching pt_forms for member 3134 or 6259 ----");
    const [forms] = await connection.query(`
      SELECT id, form_data
      FROM pt_forms
      WHERE id = 36
    `);
    
    if (forms.length > 0) {
      let formData = JSON.parse(forms[0].form_data);
      if (formData.sessions[0].trainer_sign === 'DurgaNandhini') {
          formData.sessions[0].trainer_sign = 'rohithkannan.r';
          await connection.query(`
            UPDATE pt_forms
            SET form_data = ?
            WHERE id = 36
          `, [JSON.stringify(formData)]);
          console.log("Data fixed successfully!");
      } else {
          console.log("No need to fix, already correct or different.");
      }
    } else {
      console.log("No pt_forms found for id 36.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

fixData();
