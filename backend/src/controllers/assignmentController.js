const db = require('../config/db');

function normalizeAssignment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userUuid: row.user_id_uuid,
    username: row.member_name || row.username,
    userEmail: row.member_email || row.user_email,
    userMobile: row.member_mobile || row.user_mobile,
    userWeight: (row.member_weight !== null && row.member_weight !== undefined) ? row.member_weight : null,
    gymMemberId: row.member_db_id || null,
    planId: row.plan_id,
    planName: row.plan_name,
    planDuration: row.plan_duration,
    planStartDate: row.plan_start_date,
    planEndDate: row.plan_end_date,
    planPrice: row.plan_price,
    pt_planName: row.pt_planName || null,
    pt_price: row.pt_price || null,
    pt_duration: row.pt_duration || null,
    pt_startDate: row.pt_startDate || null,
    pt_endDate: row.pt_endDate || null,
    trainerId: row.trainer_id,
    trainerName: row.current_trainer_name || row.trainer_name,
    trainerEmail: row.trainer_email || "",
    trainerPhone: row.trainer_mobile || "",
    trainerSource: row.trainer_source,
    sessionTime: row.session_time || null,
    status: row.status,
    ptFormCompleted: row.pt_form_completed || 0,
    ptJoinDate: row.m_pt_join_date || null,
    ptExpiryDate: row.m_pt_expiry_date || null,
    hasPtPlan: row.has_pt_plan,
    // joinDate: row.m_join_date || null,
    // expiryDate: row.m_expiry_date || null,
    updatedAt: row.updated_at,
  };
}

async function getAllAssignments(req, res) {
  try {
    const { trainerUserId, trainerEmail } = req.query;

    let staffId = null;

    // If called by a trainer, resolve their users.id → staff.id
    if (trainerUserId) {
      const [userRows] = await db.query(
        'SELECT id, email, username FROM users WHERE id = ?',
        [trainerUserId]
      );

      const u = userRows[0] || null;
      // Use the email from the users table, or fall back to the email passed directly
      const resolvedEmail = (u?.email || trainerEmail || '').trim().toLowerCase();
      const resolvedUsername = (u?.username || '').trim().toLowerCase();

      console.log('[assignments] resolving trainer user:', trainerUserId, resolvedEmail, resolvedUsername);

      if (resolvedEmail || resolvedUsername) {
        // Try matching staff by email first, then username
        const [staffRows] = await db.query(
          `SELECT id, name FROM staff WHERE 
            (? != '' AND LOWER(email) = ?) OR 
            (? != '' AND LOWER(username) = ?) 
          LIMIT 1`,
          [resolvedEmail, resolvedEmail, resolvedUsername, resolvedUsername]
        );

        console.log('[assignments] staff match:', staffRows.length, staffRows[0]);

        if (staffRows.length > 0) {
          staffId = staffRows[0].id;
        } else {
          // Also try matching by trainerEmail directly if users table had no match
          if (trainerEmail) {
            const emailLower = trainerEmail.trim().toLowerCase();
            const [staffByEmailRows] = await db.query(
              'SELECT id, name FROM staff WHERE LOWER(email) = ? LIMIT 1',
              [emailLower]
            );
            if (staffByEmailRows.length > 0) {
              staffId = staffByEmailRows[0].id;
              console.log('[assignments] staff matched by trainerEmail param:', staffId);
            }
          }
          if (!staffId) {
            console.warn('[assignments] Could not resolve staff for user', trainerUserId, '- returning empty');
            return res.json([]);
          }
        }
      } else {
        console.warn('[assignments] No email/username to resolve staff for user', trainerUserId);
        return res.json([]);
      }
    }

    let sql = `
      SELECT a.*,
             COALESCE(a.user_id_uuid, u.user_id) AS user_id_uuid,
             m.id as member_db_id,
             m.name as member_name,
             m.email as member_email,
             m.phone as member_mobile,
             m.weight as member_weight,
             m.pt_form_completed as pt_form_completed,
             m.pt_join_date as m_pt_join_date,
             m.pt_expiry_date as m_pt_expiry_date,
             IF((SELECT COUNT(*) FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1) > 0, 1, 0) as has_pt_plan,
             (SELECT pt_planName FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 ORDER BY pt_m.createdAt DESC LIMIT 1) AS pt_planName,
             (SELECT pt_price FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 ORDER BY pt_m.createdAt DESC LIMIT 1) AS pt_price,
             (SELECT pt_duration FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 ORDER BY pt_m.createdAt DESC LIMIT 1) AS pt_duration,
             (SELECT pt_startDate FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 ORDER BY pt_m.createdAt DESC LIMIT 1) AS pt_startDate,
             (SELECT pt_endDate FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 ORDER BY pt_m.createdAt DESC LIMIT 1) AS pt_endDate,
             s.name as current_trainer_name,
             s.email as trainer_email,
             s.phone as trainer_mobile,
             s.role as trainer_source
      FROM trainer_assignments a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN gym_members m ON (m.user_id = u.user_id AND u.user_id IS NOT NULL)
                              OR (m.email = u.email AND m.email IS NOT NULL AND m.email != '') 
                              OR (m.phone = u.mobile AND m.phone IS NOT NULL AND m.phone != '')
      LEFT JOIN staff s ON s.id = a.trainer_id
    `;
    const params = [];

    if (staffId) {
      sql += ' WHERE a.trainer_id = ?';
      params.push(staffId);
    }

    sql += ' GROUP BY a.id ORDER BY a.updated_at DESC';

    const [rows] = await db.query(sql, params);
    console.log('[assignments] returning', rows.length, 'rows for staffId', staffId);
    res.json(rows.map(normalizeAssignment));
  } catch (err) {
    console.error('getAllAssignments error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

// accepts { assignments: [ {userId, planId, planName,..., trainerId, trainerName, trainerSource, status} ] }
async function upsertAssignments(req, res) {
  try {
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'No assignments provided' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const a of assignments) {
        // Resolve UUID if not provided
        const [userUuidResult] = await connection.query('SELECT user_id FROM users WHERE id = ?', [a.userId]);
        const finalUuid = a.userUuid || (userUuidResult[0] ? userUuidResult[0].user_id : null);

        // simple upsert using unique(user_id, plan_id)
        const params = [
          a.userId,
          finalUuid,
          a.username || null,
          a.userEmail || null,
          a.planId || null,
          a.planName || null,
          a.planDuration || null,
          a.planStartDate || null,
          a.planEndDate || null,
          a.planPrice || null,
          a.trainerId,
          a.trainerName || null,
          a.trainerSource || 'unknown',
          a.sessionTime || null,
          a.status || 'active',
        ];

        const sql = `
          INSERT INTO trainer_assignments
          (user_id, user_id_uuid, username, user_email, plan_id, plan_name, plan_duration, plan_start_date, plan_end_date, plan_price, trainer_id, trainer_name, trainer_source, session_time, status)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            user_id_uuid=VALUES(user_id_uuid),
            username=VALUES(username),
            user_email=VALUES(user_email),
            plan_name=VALUES(plan_name),
            plan_duration=VALUES(plan_duration),
            plan_start_date=VALUES(plan_start_date),
            plan_end_date=VALUES(plan_end_date),
            plan_price=VALUES(plan_price),
            trainer_id=VALUES(trainer_id),
            trainer_name=VALUES(trainer_name),
            trainer_source=VALUES(trainer_source),
            session_time=VALUES(session_time),
            status=VALUES(status),
            updated_at=CURRENT_TIMESTAMP
        `;

        await connection.query(sql, params);

        // Also update existing diet/workout plans for this member to the new trainer
        await connection.query(
          'UPDATE diet_plans SET trainer_id = ?, trainer_name = ?, trainer_source = ?, user_id_uuid = ? WHERE user_id = ?',
          [a.trainerId, a.trainerName || null, a.trainerSource || 'unknown', finalUuid, a.userId]
        );
        await connection.query(
          'UPDATE workout_programs SET trainer_id = ?, trainer_name = ?, trainer_source = ?, user_id_uuid = ? WHERE user_id = ?',
          [a.trainerId, a.trainerName || null, a.trainerSource || 'unknown', finalUuid, a.userId]
        );
      }

      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      console.error('upsertAssignments error', err);
      res.status(500).json({ error: 'Failed to save assignments' });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('upsertAssignments outer error', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getAllAssignments,
  upsertAssignments,
};
