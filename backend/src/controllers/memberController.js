const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function getAllMembers(req, res) {
  try {
    const { trainerUserId } = req.query;
    let staffId = null;

    if (trainerUserId) {
      const [userRows] = await db.query(
        'SELECT id, email, username FROM users WHERE id = ?',
        [trainerUserId]
      );
      if (userRows.length > 0) {
        const u = userRows[0];
        const [staffRows] = await db.query(
          'SELECT id FROM staff WHERE email = ? OR username = ? LIMIT 1',
          [u.email, u.username]
        );
        if (staffRows.length > 0) {
          staffId = staffRows[0].id;
        } else {
          // If trainerUserId was provided but no staff matches, return empty to avoid leak
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    }

    let sql;
    let params = [];

    if (staffId) {
      sql = `
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
          COALESCE(m_pay.m_planName, NULLIF(gm.plan, '')) AS plan,
          COALESCE(m_pay.m_duration, gm.duration) AS duration,
          COALESCE(m_pay.m_status, NULLIF(gm.status, ''), 'active') AS status,
          gm.pt_plan,
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
          COALESCE(m_pay.m_startDate, gm.join_date) AS join_date,
          COALESCE(m_pay.m_endDate, gm.expiry_date) AS expiry_date,
          gm.pt_join_date,
          gm.pt_expiry_date,
          gm.pt_duration,
          gm.created_at,
          m_pay.paymentMode,
          m_pay.price,
          m_pay.pricePaid,
          m_pay.secondPaymentPaid,
          IF((SELECT COUNT(*) FROM memberships pt_m WHERE pt_m.userId = u.id AND pt_m.has_pt_plan = 1 AND (pt_m.status = 'active' OR pt_m.pt_status = 'active')) > 0, 1, 0) as has_pt_plan,
          'members' as source
        FROM gym_members gm
        INNER JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') 
                          OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        INNER JOIN trainer_assignments ta ON ta.user_id = u.id AND ta.trainer_id = ?
        LEFT JOIN (
          SELECT m.userId, m.paymentMode, m.price, m.pricePaid, m.secondPaymentPaid, m.has_pt_plan,
                 m.planName AS m_planName, m.startDate AS m_startDate, m.endDate AS m_endDate, m.status AS m_status, m.duration AS m_duration
          FROM memberships m
          JOIN (
            SELECT userId, MAX(id) AS max_id
            FROM memberships
            WHERE (has_pt_plan = 0 OR has_pt_plan IS NULL)
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
          m_pay.m_planName as plan,
          m_pay.m_duration as duration,
          COALESCE(m_pay.m_status, 'active') as status,
          NULL as pt_plan,
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
          m_pay.m_startDate as join_date,
          m_pay.m_endDate as expiry_date,
          NULL as pt_join_date,
          NULL as pt_expiry_date,
          NULL as pt_duration,
          u.created_at,
          m_pay.paymentMode,
          m_pay.price,
          m_pay.pricePaid,
          m_pay.secondPaymentPaid,
          IF((SELECT COUNT(*) FROM memberships pt_m WHERE pt_m.userId = u.id AND pt_m.has_pt_plan = 1 AND (pt_m.status = 'active' OR pt_m.pt_status = 'active')) > 0, 1, 0) as has_pt_plan,
          'users' as source
        FROM users u
        INNER JOIN trainer_assignments ta ON ta.user_id = u.id AND ta.trainer_id = ?
        LEFT JOIN (
          SELECT m.userId, m.paymentMode, m.price, m.pricePaid, m.secondPaymentPaid, m.has_pt_plan,
                 m.planName AS m_planName, m.startDate AS m_startDate, m.endDate AS m_endDate, m.status AS m_status, m.duration AS m_duration
          FROM memberships m
          JOIN (
            SELECT userId, MAX(id) AS max_id
            FROM memberships
            WHERE (has_pt_plan = 0 OR has_pt_plan IS NULL)
            GROUP BY userId
          ) mm ON m.userId = mm.userId AND m.id = mm.max_id
        ) m_pay ON m_pay.userId = u.id
        WHERE u.role = 'user' AND NOT EXISTS (
          SELECT 1 FROM gym_members gm2 
          WHERE (gm2.email = u.email AND u.email IS NOT NULL AND u.email != '') 
             OR (gm2.phone = u.mobile AND u.mobile IS NOT NULL AND u.mobile != '')
        )
        
        ORDER BY created_at DESC
      `;
      params = [staffId, staffId];
    } else {
      sql = `
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
          COALESCE(m_pay.m_planName, NULLIF(gm.plan, '')) AS plan,
          COALESCE(m_pay.m_duration, gm.duration) AS duration,
          COALESCE(m_pay.m_status, NULLIF(gm.status, ''), 'active') AS status,
          gm.pt_plan,
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
          COALESCE(m_pay.m_startDate, gm.join_date) AS join_date,
          COALESCE(m_pay.m_endDate, gm.expiry_date) AS expiry_date,
          gm.pt_join_date,
          gm.pt_expiry_date,
          gm.pt_duration,
          gm.created_at,
          m_pay.paymentMode,
          m_pay.price,
          m_pay.pricePaid,
          m_pay.secondPaymentPaid,
          IF((SELECT COUNT(*) FROM memberships pt_m WHERE pt_m.userId = u.id AND pt_m.has_pt_plan = 1 AND (pt_m.status = 'active' OR pt_m.pt_status = 'active')) > 0, 1, 0) as has_pt_plan,
          'members' as source
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') 
                          OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        LEFT JOIN (
          SELECT m.userId, m.paymentMode, m.price, m.pricePaid, m.secondPaymentPaid, m.has_pt_plan,
                 m.planName AS m_planName, m.startDate AS m_startDate, m.endDate AS m_endDate, m.status AS m_status, m.duration AS m_duration
          FROM memberships m
          JOIN (
            SELECT userId, MAX(id) AS max_id
            FROM memberships
            WHERE (has_pt_plan = 0 OR has_pt_plan IS NULL)
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
          m_pay.m_planName as plan,
          m_pay.m_duration as duration,
          COALESCE(m_pay.m_status, 'active') as status,
          NULL as pt_plan,
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
          m_pay.m_startDate as join_date,
          m_pay.m_endDate as expiry_date,
          NULL as pt_join_date,
          NULL as pt_expiry_date,
          NULL as pt_duration,
          u.created_at,
          m_pay.paymentMode,
          m_pay.price,
          m_pay.pricePaid,
          m_pay.secondPaymentPaid,
          IF((SELECT COUNT(*) FROM memberships pt_m WHERE pt_m.userId = u.id AND pt_m.has_pt_plan = 1 AND (pt_m.status = 'active' OR pt_m.pt_status = 'active')) > 0, 1, 0) as has_pt_plan,
          'users' as source
        FROM users u
        LEFT JOIN (
          SELECT m.userId, m.paymentMode, m.price, m.pricePaid, m.secondPaymentPaid, m.has_pt_plan,
                 m.planName AS m_planName, m.startDate AS m_startDate, m.endDate AS m_endDate, m.status AS m_status, m.duration AS m_duration
          FROM memberships m
          JOIN (
            SELECT userId, MAX(id) AS max_id
            FROM memberships
            WHERE (has_pt_plan = 0 OR has_pt_plan IS NULL)
            GROUP BY userId
          ) mm ON m.userId = mm.userId AND m.id = mm.max_id
        ) m_pay ON m_pay.userId = u.id
        WHERE u.role = 'user' AND NOT EXISTS (
          SELECT 1 FROM gym_members gm2 
          WHERE (gm2.email = u.email AND u.email IS NOT NULL AND u.email != '') 
             OR (gm2.phone = u.mobile AND u.mobile IS NOT NULL AND u.mobile != '')
        )
        
        ORDER BY created_at DESC
      `;
    }

    let rows;
    try {
      [rows] = await db.query(sql, params);
      res.json(rows);
      return;
    } catch (err) {
      console.warn('getAllMembers primary query failed, falling back to gym-members only query', err.message || err);
    }

    // Fallback to simpler gym-members only query
    let fallbackSql;
    let fallbackParams = [];

    if (staffId) {
      fallbackSql = `
        SELECT 
          gm.id,
          gm.member_id,
          COALESCE(gm.fingerprint_id, NULL) AS fingerprint_id,
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
          gm.pt_plan,
          gm.pt_status,
          gm.address,
          COALESCE(gm.dob, NULL) AS dob,
          COALESCE(gm.age, NULL) AS age,
          COALESCE(gm.employer, NULL) AS employer,
          COALESCE(gm.occupation, NULL) AS occupation,
          COALESCE(gm.emergency_contact_name, NULL) AS emergency_contact_name,
          COALESCE(gm.emergency_contact_relationship, NULL) AS emergency_contact_relationship,
          COALESCE(gm.emergency_contact_address, NULL) AS emergency_contact_address,
          COALESCE(gm.emergency_contact_phone_home, NULL) AS emergency_contact_phone_home,
          COALESCE(gm.emergency_contact_phone_work, NULL) AS emergency_contact_phone_work,
          COALESCE(gm.fitness_goal, NULL) AS fitness_goal,
          COALESCE(gm.blood_group, NULL) AS blood_group,
          COALESCE(gm.pt_form_completed, 0) AS pt_form_completed,
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
          NULL AS paymentMode,
          NULL AS price,
          NULL AS pricePaid,
          NULL AS secondPaymentPaid,
          'members' AS source
        FROM gym_members gm
        INNER JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '')
                          OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        INNER JOIN trainer_assignments ta ON ta.user_id = u.id AND ta.trainer_id = ?
        ORDER BY gm.created_at DESC
      `;
      fallbackParams = [staffId];
    } else {
      fallbackSql = `
        SELECT 
          gm.id,
          gm.member_id,
          COALESCE(gm.fingerprint_id, NULL) AS fingerprint_id,
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
          gm.pt_plan,
          gm.pt_status,
          gm.address,
          COALESCE(gm.dob, NULL) AS dob,
          COALESCE(gm.age, NULL) AS age,
          COALESCE(gm.employer, NULL) AS employer,
          COALESCE(gm.occupation, NULL) AS occupation,
          COALESCE(gm.emergency_contact_name, NULL) AS emergency_contact_name,
          COALESCE(gm.emergency_contact_relationship, NULL) AS emergency_contact_relationship,
          COALESCE(gm.emergency_contact_address, NULL) AS emergency_contact_address,
          COALESCE(gm.emergency_contact_phone_home, NULL) AS emergency_contact_phone_home,
          COALESCE(gm.emergency_contact_phone_work, NULL) AS emergency_contact_phone_work,
          COALESCE(gm.fitness_goal, NULL) AS fitness_goal,
          COALESCE(gm.blood_group, NULL) AS blood_group,
          COALESCE(gm.pt_form_completed, 0) AS pt_form_completed,
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
          NULL AS paymentMode,
          NULL AS price,
          NULL AS pricePaid,
          NULL AS secondPaymentPaid,
          'members' AS source
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '')
                          OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        ORDER BY gm.created_at DESC
      `;
    }
    [rows] = await db.query(fallbackSql, fallbackParams);
    res.json(rows);
  } catch (err) {
    console.error('getAllMembers error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    const idStr = String(id);
    const sql = `
        SELECT gm.*,
               u.id AS u_id,
               COALESCE(gm.user_id, u.user_id) AS u_uuid,
               u.email AS user_email,
               (SELECT COUNT(*) FROM workout_programs wp WHERE wp.member_id = gm.id) AS workout_count,
               (SELECT COUNT(*) FROM diet_plans dp WHERE dp.member_id = gm.id) AS diet_count
        FROM gym_members gm
        LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
        WHERE gm.id = ? OR gm.member_id = ?
    `;
    const params = [idStr, idStr];

    const [rows] = await db.query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getMemberById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getMemberByUserId(req, res) {
  try {
    const { user_id } = req.params;
    const [memberRows] = await db.query(
      `SELECT gm.*, u.id AS u_id, u.user_id AS u_uuid, u.email AS user_email
       FROM gym_members gm
       JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '')
                    OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
       WHERE u.id = ?
       LIMIT 1`,
      [user_id]
    );

    if (memberRows.length > 0) {
      return res.json({ ...memberRows[0], source: 'member' });
    }

    const [userRows] = await db.query(
      `SELECT id AS u_id, user_id AS u_uuid, username AS name, email, mobile AS phone, role
       FROM users
       WHERE id = ?`,
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ ...userRows[0], source: 'user' });
  } catch (err) {
    console.error('getMemberByUserId error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createMemberRecord(connection, payload) {
  const {
    name, phone, email, gender, height, weight, bmi,
    plan, duration, joinDate, expiryDate, status,
    photo, notes, address,
    username, password,
    dob, age, employer, occupation,
    emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
    emergency_contact_phone_home, emergency_contact_phone_work,
    fitness_goal, blood_group, pt_form_completed,
    fingerprintId
  } = payload;

  const resolvedName = name || "Unknown";
  const resolvedPhone = phone || "";

  if (resolvedPhone || email) {
    const [existingMember] = await connection.query(
      "SELECT id FROM gym_members WHERE (phone != '' AND phone = ?) OR (email IS NOT NULL AND email != '' AND email = ?)",
      [resolvedPhone, email]
    );

    if (existingMember.length > 0) {
      throw new Error("A member with this phone or email already exists in members directory");
    }
  }

  const [existingUser] = await connection.query(
    "SELECT id, user_id FROM users WHERE (mobile = ? AND mobile != '') OR (email = ? AND email IS NOT NULL AND email != '')",
    [resolvedPhone, email]
  );

  let userId_uuid = existingUser.length > 0 ? existingUser[0].user_id : uuidv4();

  const numHeight = height != null && !isNaN(height) ? Number(height) : null;
  const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
  const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;
  const numDuration = duration != null && !isNaN(duration) ? Number(duration) : null;

  const [maxResult] = await connection.query(
    "SELECT MAX(CAST(member_id AS UNSIGNED)) as maxnum FROM gym_members"
  );

  let nextNumber = (maxResult[0].maxnum || 0) + 1;
  let memberId = String(nextNumber);

  let inserted = false;
  let result;
  for (let attempt = 0; attempt < 2 && !inserted; attempt++) {
    try {
      [result] = await connection.query(
        `INSERT INTO gym_members
      (user_id, member_id, name, phone, email, gender, height, weight, bmi, plan, duration,
       join_date, expiry_date, status, photo, notes, address,
       dob, age, employer, occupation,
       emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
       emergency_contact_phone_home, emergency_contact_phone_work,
       fitness_goal, blood_group, pt_form_completed, fingerprint_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          userId_uuid, memberId, resolvedName, resolvedPhone, email, gender, numHeight, numWeight, numBmi,
          plan, numDuration, joinDate, expiryDate, status, photo, notes, address,
          dob || null, age || null, employer || null, occupation || null,
          emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
          emergency_contact_phone_home || null, emergency_contact_phone_work || null,
          fitness_goal || null, blood_group || null,
          pt_form_completed ? 1 : 0,
          fingerprintId || null
        ]
      );
      inserted = true;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('member_id')) {
        nextNumber += 1;
        memberId = String(nextNumber);
      } else {
        throw err;
      }
    }
  }

  if (!inserted) {
    throw new Error('Failed to generate unique member_id');
  }

  if (email || resolvedPhone) {
    try {
      const pwd = password || resolvedPhone || 'Gym123';
      const hashed = await bcrypt.hash(pwd, 10);

      if (existingUser.length > 0) {
        await connection.query(
          `UPDATE users SET password_hash = ?, username = ? WHERE id = ?`,
          [hashed, username || null, existingUser[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO users (user_id, email, password_hash, role, username, mobile)
               VALUES (?, ?, ?, ?, ?, ?)`,
          [userId_uuid, email || null, hashed, 'user', username || null, resolvedPhone || null]
        );
      }
    } catch (userErr) {
      if (userErr.code === 'ER_DUP_ENTRY') {
        console.warn('createMember: user already exists (duplicate entry), skipping user insert');
      } else {
        throw userErr;
      }
    }
  }

  const [fetched] = await connection.query(
    `
      SELECT gm.*,
             u.id AS u_id,
             u.user_id AS u_uuid,
             u.email AS user_email,
             0 AS workout_count,
             0 AS diet_count
      FROM gym_members gm
      LEFT JOIN users u ON (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
      WHERE gm.member_id = ?
    `,
    [memberId]
  );

  return fetched[0] || {
    id: result.insertId,
    member_id: memberId,
    name: resolvedName,
    phone: resolvedPhone,
    email,
    gender,
    height: numHeight,
    weight: numWeight,
    bmi: numBmi,
    plan,
    duration: numDuration,
    join_date: joinDate,
    expiry_date: expiryDate,
    status,
    photo,
    notes,
    address
  };
}

async function createMember(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const member = await createMemberRecord(connection, req.body);
    await connection.commit();
    res.json(member);
  } catch (err) {
    await connection.rollback();
    console.error('createMember error:', err.message || err);
    if (err.message && err.message.includes('already exists')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    connection.release();
  }
}

async function updateMember(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const idStr = String(id);
    const selectExistingQuery = `SELECT * FROM gym_members WHERE id = ? OR member_id = ?`;
    const [existingRows] = await connection.query(selectExistingQuery, [idStr, idStr]);
    if (existingRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Member not found' });
    }
    const existingMember = existingRows[0];

    // Fetch linked user BEFORE updating gym_members (so old email/phone still matches)
    let linkedUserId = null;
    try {
      const [userLookup] = await connection.query(
        `SELECT id FROM users WHERE email = ? OR mobile = ? LIMIT 1`,
        [existingMember.email || '', existingMember.phone || '']
      );
      if (userLookup.length > 0) linkedUserId = userLookup[0].id;
    } catch (e) {
      console.warn('updateMember: could not pre-fetch linked user', e.message);
    }
    const rawBody = req.body || {};
    const getField = (camel, snake) => {
      if (Object.prototype.hasOwnProperty.call(rawBody, camel)) return rawBody[camel];
      if (Object.prototype.hasOwnProperty.call(rawBody, snake)) return rawBody[snake];
      return existingMember[snake];
    };

    const name = getField('name', 'name');
    const phone = getField('phone', 'phone');
    const email = getField('email', 'email');
    const gender = getField('gender', 'gender');
    const height = getField('height', 'height');
    const weight = getField('weight', 'weight');
    const bmi = getField('bmi', 'bmi');
    const plan = getField('plan', 'plan');
    const duration = getField('duration', 'duration');
    const joinDate = getField('joinDate', 'join_date');
    const expiryDate = getField('expiryDate', 'expiry_date');
    const status = getField('status', 'status');
    const photo = getField('photo', 'photo');
    const notes = getField('notes', 'notes');
    const address = getField('address', 'address');
    const username = getField('username', 'username');
    const dob = getField('dob', 'dob');
    const age = getField('age', 'age');
    const employer = getField('employer', 'employer');
    const occupation = getField('occupation', 'occupation');
    const emergency_contact_name = getField('emergency_contact_name', 'emergency_contact_name');
    const emergency_contact_relationship = getField('emergency_contact_relationship', 'emergency_contact_relationship');
    const emergency_contact_address = getField('emergency_contact_address', 'emergency_contact_address');
    const emergency_contact_phone_home = getField('emergency_contact_phone_home', 'emergency_contact_phone_home');
    const emergency_contact_phone_work = getField('emergency_contact_phone_work', 'emergency_contact_phone_work');
    const fitness_goal = getField('fitness_goal', 'fitness_goal');
    const blood_group = getField('blood_group', 'blood_group');
    const pt_form_completed = getField('pt_form_completed', 'pt_form_completed');
    const pt_plan = getField('pt_plan', 'pt_plan');
    const pt_duration = getField('pt_duration', 'pt_duration');
    const pt_join_date = getField('pt_join_date', 'pt_join_date');
    const pt_expiry_date = getField('pt_expiry_date', 'pt_expiry_date');
    const pt_status = getField('pt_status', 'pt_status');
    const fingerprintId = getField('fingerprintId', 'fingerprint_id');

    // ensure numeric values are correctly typed
    const numHeight = height != null && !isNaN(height) ? Number(height) : null;
    const numWeight = weight != null && !isNaN(weight) ? Number(weight) : null;
    const numBmi = bmi != null && !isNaN(bmi) ? Number(bmi) : null;
    const numDuration = duration != null && !isNaN(duration) ? Number(duration) : null;

    // Check for duplicate phone in gym_members AND users
    if (phone && phone !== existingMember.phone) {
      const dupQuery = `SELECT id FROM gym_members WHERE phone = ? AND id != ?`;
      const dupParams = [phone, existingMember.id];
      const [existing] = await connection.query(dupQuery, dupParams);
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: "Mobile number already in use by another member" });
      }
      // Also check in users table (excluding the linked user)
      if (linkedUserId) {
        const [existingInUsers] = await connection.query(
          `SELECT id FROM users WHERE mobile = ? AND id != ?`,
          [phone, linkedUserId]
        );
        if (existingInUsers.length > 0) {
          await connection.rollback();
          return res.status(400).json({ message: "Mobile number already registered in user accounts" });
        }
      }
    }

    const updateQuery = `UPDATE gym_members SET
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
     WHERE id=?`;
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
    const [result] = await connection.query(updateQuery, updateParams);

    const updatedMember = {
      ...existingMember,
      name,
      phone,
      email,
      gender,
      height: numHeight,
      weight: numWeight,
      bmi: numBmi,
      plan,
      duration: numDuration,
      join_date: joinDate,
      expiry_date: expiryDate,
      status,
      photo,
      notes,
      address,
      dob: dob || null,
      age: age || null,
      employer: employer || null,
      occupation: occupation || null,
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_relationship: emergency_contact_relationship || null,
      emergency_contact_address: emergency_contact_address || null,
      emergency_contact_phone_home: emergency_contact_phone_home || null,
      emergency_contact_phone_work: emergency_contact_phone_work || null,
      fitness_goal: fitness_goal || null,
      blood_group: blood_group || null,
      pt_form_completed: pt_form_completed ? 1 : 0,
      pt_plan: pt_plan || null,
      pt_duration: pt_duration || null,
      pt_join_date: pt_join_date || null,
      pt_expiry_date: pt_expiry_date || null,
      pt_status: pt_status || null,
      fingerprint_id: fingerprintId || null,
      u_id: linkedUserId
    };

    if (updatedMember && updatedMember.u_id) {
      try {
        let planPrice = null;
        let planId = null;
        const newPlanName = plan === undefined ? updatedMember.plan : plan;
        if (newPlanName) {
          const [planRows] = await connection.query(`SELECT id, final_price, price FROM gym_plans WHERE name = ?`, [newPlanName]);
          if (planRows.length > 0) {
            planId = planRows[0].id;
            planPrice = planRows[0].final_price || planRows[0].price;
          }
        }

        if (planPrice !== null) {
          await connection.query(
            `UPDATE memberships 
             SET endDate = ?, 
                 startDate = ?, 
                 duration = ?, 
                 planId = ?,
                 planName = ?,
                 userName = ?,
                 userEmail = ?,
                 userPhone = ?,
                 price = ?,
                 pricePaid = ?,
                 paymentMode = 'cash',
                 paymentStatus = 'Paid'
             WHERE userId = ? 
             ORDER BY createdAt DESC 
             LIMIT 1`,
            [
              expiryDate === undefined ? updatedMember.expiry_date : expiryDate,
              joinDate === undefined ? updatedMember.join_date : joinDate,
              duration === undefined ? updatedMember.duration : numDuration,
              planId,
              newPlanName,
              name === undefined ? updatedMember.name : name,
              email === undefined ? updatedMember.email : email,
              phone === undefined ? updatedMember.phone : phone,
              planPrice,
              planPrice,
              updatedMember.u_id
            ]
          );
        } else {
          await connection.query(
            `UPDATE memberships 
             SET endDate = ?, 
                 startDate = ?, 
                 duration = ?, 
                 planId = ?,
                 planName = ?,
                 userName = ?,
                 userEmail = ?,
                 userPhone = ?
             WHERE userId = ? 
             ORDER BY createdAt DESC 
             LIMIT 1`,
            [
              expiryDate === undefined ? updatedMember.expiry_date : expiryDate,
              joinDate === undefined ? updatedMember.join_date : joinDate,
              duration === undefined ? updatedMember.duration : numDuration,
              planId,
              newPlanName,
              name === undefined ? updatedMember.name : name,
              email === undefined ? updatedMember.email : email,
              phone === undefined ? updatedMember.phone : phone,
              updatedMember.u_id
            ]
          );
        }
        // If PT-plan related fields were intentionally cleared by the caller, also clear PT fields
        // in the latest membership record so the PT plan is removed from membership history/view.
        const wantsClearPt = (Object.prototype.hasOwnProperty.call(req.body, 'pt_plan') && req.body.pt_plan === null)
          || req.body.has_pt_plan === false
          || (Object.prototype.hasOwnProperty.call(req.body, 'pt_expiry_date') && req.body.pt_expiry_date === null);
        const wantsClearNormal = (Object.prototype.hasOwnProperty.call(req.body, 'plan') && req.body.plan === null)
          || (Object.prototype.hasOwnProperty.call(req.body, 'joinDate') && req.body.joinDate === null)
          || (Object.prototype.hasOwnProperty.call(req.body, 'expiryDate') && req.body.expiryDate === null)
          || (Object.prototype.hasOwnProperty.call(req.body, 'duration') && req.body.duration === null);

        if (wantsClearPt) {
          try {
            // Update only the most recent membership for this user
            await connection.query(
              `UPDATE memberships SET 
                 has_pt_plan = 0,
                 pt_planId = NULL,
                 pt_planName = NULL,
                 pt_price = NULL,
                 pt_pricePaid = NULL,
                 pt_duration = NULL,
                 pt_startDate = NULL,
                 pt_endDate = NULL,
                 pt_paymentMode = NULL,
                 pt_paymentDate = NULL,
                 pt_paymentStatus = NULL,
                 pt_status = NULL,
                 pt_trainerId = NULL,
                 pt_trainerName = NULL,
                 pt_discount = NULL,
                 pt_amount = NULL
               WHERE id = (
                 SELECT id FROM (SELECT id FROM memberships WHERE userId = ? ORDER BY createdAt DESC LIMIT 1) AS latest
               )`,
              [updatedMember.u_id]
            );
          } catch (ptClearErr) {
            console.warn('updateMember: failed to clear PT fields in memberships', ptClearErr.message || ptClearErr);
          }
        }

        if (wantsClearNormal) {
          try {
            await connection.query(
              `UPDATE memberships SET
                 planId = NULL,
                 planName = NULL,
                 price = NULL,
                 pricePaid = NULL,
                 secondPaymentPaid = NULL,
                 duration = NULL,
                 startDate = NULL,
                 endDate = NULL,
                 paymentMode = NULL,
                 paymentDate = NULL,
                 status = NULL,
                 paymentStatus = NULL,
                 discount = NULL,
                 amount = NULL,
                 collectedBy = NULL
               WHERE id = (
                 SELECT id FROM (SELECT id FROM memberships WHERE userId = ? ORDER BY createdAt DESC LIMIT 1) AS latest
               )`,
              [updatedMember.u_id]
            );

            const [latestRows] = await connection.query(
              `SELECT id, planId, pt_planId, has_pt_plan FROM memberships WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
              [updatedMember.u_id]
            );
            if (latestRows.length > 0) {
              const latest = latestRows[0];
              const hasPt = latest.pt_planId || latest.has_pt_plan;
              if (!latest.planId && !hasPt) {
                await connection.query(
                  `DELETE FROM memberships WHERE id = ?`,
                  [latest.id]
                );
              }
            }
          } catch (normalClearErr) {
            console.warn('updateMember: failed to clear normal plan fields in memberships', normalClearErr.message || normalClearErr);
          }
        }
      } catch (syncErr) {
        console.warn('updateMember: failed to sync memberships table', syncErr.message);
      }
    }

    // sync user info (email / mobile / username / password)
    try {
      const bcrypt = require('bcryptjs');
      const userFields = [];
      const userParams = [];

      if (email !== undefined) {
        userFields.push('email = ?');
        userParams.push(email);
      }
      if (phone !== undefined) {
        userFields.push('mobile = ?');
        userParams.push(phone);
      }
      if (username !== undefined) {
        userFields.push('username = ?');
        userParams.push(username);
      }

      // Password logic:
      // Frontend always sends password (mobile number as default, or explicit new password)
      // Always update password_hash to keep it in sync with the mobile number
      const newPassword = rawBody.password;

      // Use explicit password if provided; otherwise always use current phone (mobile = default password)
      const passwordToHash = (newPassword && newPassword.trim()) ? newPassword.trim() : phone;

      if (passwordToHash) {
        try {
          const hashed = await bcrypt.hash(passwordToHash, 10);
          userFields.push('password_hash = ?');
          userParams.push(hashed);
        } catch (bcryptErr) {
          console.warn('updateMember: failed to hash password', bcryptErr.message);
        }
      }

      if (userFields.length > 0) {
        // Always update updated_at
        userFields.push('updated_at = CURRENT_TIMESTAMP');

        if (linkedUserId) {
          // Use the pre-fetched user ID (guaranteed correct even when phone/email changed)
          const updateSql = `UPDATE users SET ${userFields.join(', ')} WHERE id = ?`;
          await connection.query(updateSql, [...userParams, linkedUserId]);
        } else {
          // Fallback: try to find user by old email or old mobile
          const oldEmail = existingMember.email;
          const oldPhone = existingMember.phone;
          const whereClause = [];
          const whereParams = [];
          if (oldEmail) { whereClause.push('email = ?'); whereParams.push(oldEmail); }
          if (oldPhone) { whereClause.push('mobile = ?'); whereParams.push(oldPhone); }
          if (whereClause.length) {
            const updateSql = `UPDATE users SET ${userFields.join(', ')} WHERE ${whereClause.join(' OR ')}`;
            await connection.query(updateSql, [...userParams, ...whereParams]);
          }
        }
      }
    } catch (userErr) {
      console.warn('updateMember: failed to sync user', userErr.message);
      // continue without fatal error
    }

    await connection.commit();
    res.json(updatedMember);

  } catch (err) {
    await connection.rollback();
    console.error('updateMember error', err);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
}

async function deleteMember(req, res) {
  const { id } = req.params;
  const idStr = String(id);
  const selectQuery = `SELECT id, email, phone, user_id FROM gym_members WHERE id = ? OR member_id = ?`;
  const deleteQuery = `DELETE FROM gym_members WHERE id = ? OR member_id = ?`;
  const params = [idStr, idStr];

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // ── Step 1: Fetch gym_member record first ─────────────────────────────────
    const [rows] = await connection.query(selectQuery, params);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = rows[0];
    const internalMemberId = member.id;

    // ── Step 2: Find the linked user (users table) ───────────────────────────
    let internalUserId = null;
    let userRole = null;
    if (member.user_id || member.email || member.phone) {
      const userQuery = `SELECT id, role FROM users WHERE (user_id = ? AND user_id IS NOT NULL AND user_id != '') OR (email = ? AND email IS NOT NULL AND email != '') OR (mobile = ? AND mobile IS NOT NULL AND mobile != '') LIMIT 1`;
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
    }

    const del = async (table, col, val) => {
      if (val == null) return;
      try {
        await connection.query(`DELETE FROM \`${table}\` WHERE \`${col}\` = ?`, [val]);
      } catch (e) {
        console.warn(`deleteMember: could not delete from ${table}:`, e.message);
      }
    };

    // ── Step 3: Delete all related data keyed by userId (users.id) ───────────
    if (internalUserId) {
      await del('memberships',          'userId',           internalUserId);
      await del('trainer_assignments',  'user_id',          internalUserId);
      await del('pt_forms',             'user_id',          internalUserId);
      await del('orders',               'user_id',          internalUserId);
      await del('cart_items',           'user_id',          internalUserId);
      await del('message_history',      'user_id',          internalUserId);
      await del('reviews',              'user_id',          internalUserId);
      await del('user_addresses',       'user_id',          internalUserId);
    }

    // ── Step 4: Delete all related data keyed by gym_members.id ─────────────
    if (internalMemberId) {
      await del('diet_plans',           'member_id',        internalMemberId);
      await del('workout_programs',     'member_id',        internalMemberId);
      await del('pt_forms',             'member_id',        internalMemberId);
      await del('attendance',           'member_id',        internalMemberId);
      await del('trainer_sessions',     'member_id',        internalMemberId);
    }

    // ── Step 5: Delete linked enquiries + their followups/interactions ────────
    if (member.email || member.phone) {
      // Fetch enquiry IDs for this member's email or phone
      const [enqRows] = await connection.query(
        `SELECT id FROM enquiries WHERE (email = ? AND email != '') OR (phone = ? AND phone != '')`,
        [member.email || '', member.phone || '']
      );
      for (const enq of enqRows) {
        // First delete followup_interactions for each followup of this enquiry
        const [followupRows] = await connection.query(
          `SELECT id FROM followups WHERE enquiry_id = ?`, [enq.id]
        ).catch(() => [[]]);
        for (const fu of followupRows) {
          await del('followup_interactions', 'followup_id', fu.id);
        }
        await del('followups',         'enquiry_id',  enq.id);
        await del('enquiries',         'id',          enq.id);
      }
    }

    // ── Step 6: Delete gym_members record ────────────────────────────────────
    const gymDeleteQuery = `DELETE FROM gym_members WHERE id = ? OR member_id = ?`;
    const [deleteResult] = await connection.query(gymDeleteQuery, params);
    if (deleteResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Member delete failed' });
    }

    // ── Step 7: Delete user account (only regular members/users) ─────────────
    if (internalUserId && (userRole === 'user' || userRole === 'member')) {
      await del('users', 'id', internalUserId);
    }

    await connection.commit();
    res.json({ success: true, message: 'Member and all related data deleted successfully' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('deleteMember error', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  } finally {
    if (connection) connection.release();
  }
}

async function getMemberPlans(req, res) {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get member info and their plan
    const sql = `
      SELECT m.membership_plan_id, p.*, m.is_active as member_active
      FROM members m
      LEFT JOIN plans p ON m.membership_plan_id = p.id
      WHERE m.user_id = ?
    `;

    const [rows] = await db.query(sql, [userId]);

    if (rows.length === 0) {
      return res.json([]); // No member found, return empty array
    }

    const member = rows[0];

    if (!member.membership_plan_id) {
      return res.json([]); // No plan assigned
    }

    // Return plan with status
    const planWithStatus = {
      ...member,
      status: member.member_active ? 'active' : 'inactive'
    };

    // Remove redundant fields
    delete planWithStatus.membership_plan_id;
    delete planWithStatus.member_active;

    res.json([planWithStatus]);
  } catch (err) {
    console.error('getMemberPlans error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function deleteAllMembers(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM gym_members');
    await connection.query("DELETE FROM users WHERE role = 'user'");
    await connection.commit();
    res.json({ message: 'All members and user accounts deleted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('deleteAllMembers error', err);
    res.status(500).json({ error: 'Failed to delete all members' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllMembers,
  getMemberById,
  getMemberByUserId,
  createMember,
  createMemberRecord,
  updateMember,
  deleteMember,
  getMemberPlans,
  deleteAllMembers
};
