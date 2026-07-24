const fs = require('fs');
const file = 'd:/Q Techx Projects/Q Techx Mobile App/GYMWEBNEW1/Gyms_Web_App-Backend_FrontendAdmin/backend/src/controllers/memberController.js';
let content = fs.readFileSync(file, 'utf8');

// Replace getMemberById
content = content.replace(
  /const idNum = parseInt\(id, 10\);\s+const isNum = !isNaN\(idNum\);\s+let sql;\s+let params;\s+if \(isNum\) \{[\s\S]+?\}\s+const \[rows\] = await db\.query\(sql, params\);/m,
  `const idStr = String(id);
    const sql = \`
        SELECT gm.*,
               u.id AS u_id,
               COALESCE(gm.user_id, u.user_id) AS u_uuid,
               u.email AS user_email,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        WHERE gm.id = ? OR gm.member_id = ?
    \`;
    const params = [idStr, idStr];

    const [rows] = await db.query(sql, params);`
);

// Replace updateMember
content = content.replace(
  /const idNum = parseInt\(id, 10\);\s+const isNum = !isNaN\(idNum\);\s+const selectExistingQuery = isNum\s+\? `SELECT \* FROM gym_members WHERE id = \?`\s+: `SELECT \* FROM gym_members WHERE member_id = \?`;\s+const \[existingRows\] = await connection\.query\(selectExistingQuery, \[isNum \? idNum : id\]\);/m,
  `const idStr = String(id);
    const selectExistingQuery = \`SELECT * FROM gym_members WHERE id = ? OR member_id = ?\`;
    const [existingRows] = await connection.query(selectExistingQuery, [idStr, idStr]);`
);

// Replace deleteMember
content = content.replace(
  /const idNum = parseInt\(id, 10\);\s+const isNum = !isNaN\(idNum\);\s+const selectQuery = isNum \?\s+`SELECT id, email, phone, user_id FROM gym_members WHERE id = \?` :\s+`SELECT id, email, phone, user_id FROM gym_members WHERE member_id = \?`;\s+const deleteQuery = isNum \?\s+`DELETE FROM gym_members WHERE id = \?` :\s+`DELETE FROM gym_members WHERE member_id = \?`;\s+const params = \[isNum \? idNum : id\];/m,
  `const idStr = String(id);
  const selectQuery = \`SELECT id, email, phone, user_id FROM gym_members WHERE id = ? OR member_id = ?\`;
  const deleteQuery = \`DELETE FROM gym_members WHERE id = ? OR member_id = ?\`;
  const params = [idStr, idStr];`
);

// We also need to fix step 6 in deleteMember
content = content.replace(
  /const gymDeleteQuery = isNum\s+\? `DELETE FROM gym_members WHERE id = \?`\s+: `DELETE FROM gym_members WHERE member_id = \?`;\s+const \[deleteResult\] = await connection\.query\(gymDeleteQuery, params\);/m,
  `const gymDeleteQuery = \`DELETE FROM gym_members WHERE id = ? OR member_id = ?\`;
    const [deleteResult] = await connection.query(gymDeleteQuery, params);`
);

fs.writeFileSync(file, content);
console.log('Fixed');
