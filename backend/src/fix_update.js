const fs = require('fs');
const file = 'd:/Q Techx Projects/Q Techx Mobile App/GYMWEBNEW1/Gyms_Web_App-Backend_FrontendAdmin/backend/src/controllers/memberController.js';
let content = fs.readFileSync(file, 'utf8');

// Fix dupQuery
content = content.replace(
  /let dupQuery;\s+let dupParams;\s+if \(isNum\) \{[\s\S]+?\}\s+const \[existing\] = await connection\.query\(dupQuery, dupParams\);/m,
  `const dupQuery = \`SELECT id FROM gym_members WHERE phone = ? AND id != ?\`;
      const dupParams = [phone, existingMember.id];
      const [existing] = await connection.query(dupQuery, dupParams);`
);

// Fix updateQuery
content = content.replace(
  /let updateQuery;\s+let updateParams;\s+if \(isNum\) \{[\s\S]+?\}\s+const \[result\] = await connection\.query\(updateQuery, updateParams\);/m,
  `const updateQuery = \`UPDATE gym_members SET
      name=?, phone=?, email=?, gender=?,
      height=?, weight=?, bmi=?, plan=?, duration=?,
      join_date=?, expiry_date=?, status=?,
      photo=?, notes=?, address=?,
      dob=?, age=?, employer=?, occupation=?,
      emergency_contact_name=?, emergency_contact_relationship=?, emergency_contact_address=?,
      emergency_contact_phone_home=?, emergency_contact_phone_work=?,
      fitness_goal=?, blood_group=?, pt_form_completed=?,
      pt_plan=?, pt_duration=?, pt_join_date=?, pt_expiry_date=?, pt_status=?,
      fingerprint_id=?,
      updated_at=CURRENT_TIMESTAMP
     WHERE id=?\`;
    const updateParams = [
      name, phone, email, gender, numHeight, numWeight, numBmi,
      plan, numDuration, joinDate, expiryDate, status,
      photo, notes, address,
      dob || null, age || null, employer || null, occupation || null,
      emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
      emergency_contact_phone_home || null, emergency_contact_phone_work || null,
      fitness_goal || null, blood_group || null,
      pt_form_completed ? 1 : 0,
      pt_plan || null, pt_duration || null, pt_join_date || null, pt_expiry_date || null, pt_status || null,
      fingerprintId || null,
      existingMember.id
    ];
    const [result] = await connection.query(updateQuery, updateParams);`
);

// Fix sql
content = content.replace(
  /let sql;\s+let params;\s+if \(isNum\) \{[\s\S]+?\}\s+const \[updatedRows\] = await connection\.query\(sql, params\);/m,
  `const sql = \`
      SELECT gm.*,
             u.id AS u_id,
             u.user_id AS u_uuid,
             u.email AS user_email,
             (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
             (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
      FROM gym_members gm
      LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
      WHERE gm.id = ?
    \`;
    const params = [existingMember.id];
    const [updatedRows] = await connection.query(sql, params);`
);

fs.writeFileSync(file, content);
console.log('Fixed');
