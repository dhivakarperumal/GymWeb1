const fs = require('fs');
const db = require('./config/db');
const file = 'd:/Q Techx Projects/Q Techx Mobile App/GYMWEBNEW1/Gyms_Web_App-Backend_FrontendAdmin/backend/src/controllers/memberController.js';
let content = fs.readFileSync(file, 'utf8');

// Fix Step 2 of deleteMember
content = content.replace(
  /let internalUserId = null;\s+if \(member\.user_id \|\| member\.email \|\| member\.phone\) \{[\s\S]+?\}\s+\}/m,
  `let internalUserId = null;
    let userRole = null;
    if (member.user_id || member.email || member.phone) {
      const userQuery = \`SELECT id, role FROM users WHERE (user_id = ? AND user_id IS NOT NULL AND user_id != '') OR (email = ? AND email IS NOT NULL AND email != '') OR (mobile = ? AND mobile IS NOT NULL AND mobile != '') LIMIT 1\`;
      const userParams = [
        member.user_id || '',
        member.email || '',
        member.phone || ''
      ];
      const [userRows] = await connection.query(userQuery, userParams);
      if (userRows.length > 0) {
        internalUserId = userRows[0].id;
        userRole = userRows[0].role;
      }
    }`
);

fs.writeFileSync(file, content);

(async () => {
  try {
    const [result] = await db.query(`
      DELETE FROM users 
      WHERE role = 'user' AND NOT EXISTS (
        SELECT 1 FROM gym_members gm2 
        WHERE (gm2.email = users.email AND users.email IS NOT NULL AND users.email != '') 
           OR (gm2.phone = users.mobile AND users.mobile IS NOT NULL AND users.mobile != '')
      )
    `);
    console.log(`Deleted ${result.affectedRows} orphaned users.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
