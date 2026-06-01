const db = require('./src/config/db');

(async () => {
  try {
    const sql = `
        SELECT 
          gm.id, 
          gm.member_id, 
          gm.fingerprint_id,
          gm.name, 
          gm.phone, 
          gm.email, 
          gm.gender,
          gm.height,
          gm.weight,
          gm.bmi,
          gm.plan,
          gm.duration,
          gm.status,
          gm.pt_status,
          gm.address,
          gm.dob,
          gm.age,
          gm.employer,
          gm.occupation,
          gm.emergency_contact_name,
          gm.emergency_contact_relationship,
          gm.emergency_contact_address,
          gm.emergency_contact_phone_home,
          gm.emergency_contact_phone_work,
          gm.fitness_goal,
          gm.blood_group,
          gm.pt_form_completed,
          u.id AS u_id, 
          COALESCE(gm.user_id, u.user_id) AS u_uuid,
          u.email AS user_email, 
          u.role,
          (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
          (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count,
          gm.join_date,
          gm.expiry_date,
          gm.pt_join_date,
          gm.pt_expiry_date,
          gm.pt_duration,
          gm.created_at,
          m_pay.paymentMode,
          m_pay.price,
          m_pay.pricePaid,
          m_pay.secondPaymentPaid,
          COALESCE(m_pay.has_pt_plan, 0) as has_pt_plan,
          'members' as source
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') 
                          OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        LEFT JOIN (
          SELECT m.userId, m.paymentMode, m.price, m.pricePaid, m.secondPaymentPaid, m.has_pt_plan
          FROM memberships m
          JOIN (
            SELECT userId, MAX(id) AS max_id
            FROM memberships
            GROUP BY userId
          ) mm ON m.userId = mm.userId AND m.id = mm.max_id
        ) m_pay ON m_pay.userId = u.id
        
        UNION ALL
        
        SELECT 
          NULL as id, 
          NULL as member_id, 
          NULL as fingerprint_id,
          u.username as name, 
          u.mobile as phone, 
          u.email, 
          NULL as gender,
          NULL as height,
          NULL as weight,
          NULL as bmi,
          NULL as plan,
          NULL as duration,
          NULL as pt_plan,
          'active' as status,
          NULL as pt_status,
          NULL as address,
          NULL as dob,
          NULL as age,
          NULL as employer,
          NULL as occupation,
          NULL as emergency_contact_name,
          NULL as emergency_contact_relationship,
          NULL as emergency_contact_address,
          NULL as emergency_contact_phone_home,
          NULL as emergency_contact_phone_work,
          NULL as fitness_goal,
          NULL as blood_group,
          0 as pt_form_completed,
          u.id AS u_id, 
          COALESCE(NULL, u.user_id) AS u_uuid,
          u.email AS user_email, 
          u.role,
          0 AS workout_count,
          0 AS diet_count,
          NULL as join_date,
          NULL as expiry_date,
          NULL as pt_join_date,
          NULL as pt_expiry_date,
          NULL as pt_duration,
          u.created_at,
          NULL as paymentMode,
          NULL as price,
          NULL as pricePaid,
          NULL as secondPaymentPaid,
          0 as has_pt_plan,
          'users' as source
        FROM users u
        WHERE u.role = 'user' AND NOT EXISTS (
          SELECT 1 FROM gym_members gm2 
          WHERE (gm2.email = u.email AND u.email IS NOT NULL AND u.email != '') 
             OR (gm2.phone = u.mobile AND u.mobile IS NOT NULL AND u.mobile != '')
        )
        
        ORDER BY created_at DESC
      `;

    console.log('Running members query...');
    const [rows] = await db.query(sql);
    console.log('Rows returned:', rows.length);
    console.log(rows.slice(0,5));
    process.exit(0);
  } catch (err) {
    console.error('Query error:', err);
    process.exit(2);
  }
})();
