const db = require('../config/db');

function normalizeAssignment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userUuid: row.user_id_uuid,
    username: row.member_name || row.username,
    userEmail: row.member_email || row.user_email || row.email || row.userEmail || null,
    userMobile: row.member_mobile || row.user_mobile || row.mobile || row.phone || row.userMobile || null,
    userWeight: (row.member_weight !== null && row.member_weight !== undefined) ? row.member_weight : null,
    gymMemberId: row.member_db_id || null,
    planId: row.plan_id,
    planName: row.plan_name,
    planDuration: row.plan_duration,
    planStartDate: row.plan_start_date,
    planEndDate: row.plan_end_date,
    planPrice: row.pt_price ?? row.plan_price ?? row.price ?? row.amount ?? 0,
    pt_planName: row.pt_planName || null,
    ptPlanId: row.pt_membership_id || null,
    ptCycleId: row.pt_cycle_id || null,
    pt_price: row.pt_price ?? row.plan_price ?? row.price ?? row.amount ?? null,
    pt_duration: row.pt_duration || null,
    pt_startDate: row.pt_startDate || null,
    pt_endDate: row.pt_endDate || null,
    trainerId: row.trainer_id,
    trainerName: row.current_trainer_name || row.trainer_name,
    trainerEmail: row.trainer_email || "",
    trainerPhone: row.trainer_mobile || "",
    trainerPhoto: row.trainer_photo || "",
    trainerSource: row.trainer_source,
    assignmentDate: row.created_at || row.updated_at,
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
    const distinctMembers = req.query.distinctMembers === 'true';

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
             u.email as user_email,
             u.mobile as user_mobile,
             m.weight as member_weight,
             m.pt_form_completed as pt_form_completed,
             m.pt_join_date as m_pt_join_date,
             m.pt_expiry_date as m_pt_expiry_date,
             IF((SELECT COUNT(*) FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL)) > 0, 1, 0) as has_pt_plan,
             (SELECT pt_planName FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL) ORDER BY pt_m.updatedAt DESC, pt_m.id DESC LIMIT 1) AS pt_planName,
             (SELECT id FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL) ORDER BY pt_m.updatedAt DESC, pt_m.id DESC LIMIT 1) AS pt_membership_id,
             (SELECT pt_cycle_id FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL) ORDER BY pt_m.updatedAt DESC, pt_m.id DESC LIMIT 1) AS pt_cycle_id,
             (SELECT pt_price FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL) ORDER BY pt_m.updatedAt DESC, pt_m.id DESC LIMIT 1) AS pt_price,
             (SELECT pt_duration FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL) ORDER BY pt_m.updatedAt DESC, pt_m.id DESC LIMIT 1) AS pt_duration,
             (SELECT pt_startDate FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL) ORDER BY pt_m.updatedAt DESC, pt_m.id DESC LIMIT 1) AS pt_startDate,
             (SELECT pt_endDate FROM memberships pt_m WHERE pt_m.userId = a.user_id AND pt_m.has_pt_plan = 1 AND (pt_m.pt_planId IS NOT NULL OR pt_m.pt_planName IS NOT NULL OR pt_m.pt_endDate IS NOT NULL) ORDER BY pt_m.updatedAt DESC, pt_m.id DESC LIMIT 1) AS pt_endDate,
             s.name as current_trainer_name,
             s.email as trainer_email,
             s.phone as trainer_mobile,
             s.photo as trainer_photo,
             s.role as trainer_source
      FROM trainer_assignments a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN gym_members m ON m.id = (
        SELECT gm_match.id
        FROM gym_members gm_match
        WHERE (gm_match.user_id = u.user_id AND u.user_id IS NOT NULL)
           OR (gm_match.email = u.email AND gm_match.email IS NOT NULL AND gm_match.email != '')
           OR (gm_match.phone = u.mobile AND gm_match.phone IS NOT NULL AND gm_match.phone != '')
        ORDER BY CASE
          WHEN gm_match.user_id = u.user_id AND u.user_id IS NOT NULL THEN 0
          WHEN gm_match.email = u.email AND gm_match.email IS NOT NULL AND gm_match.email != '' THEN 1
          ELSE 2
        END,
        gm_match.created_at DESC,
        gm_match.id DESC
        LIMIT 1
      )
      LEFT JOIN staff s ON s.id = a.trainer_id
    `;
    const params = [];

    if (staffId && !distinctMembers) {
      sql += ' WHERE a.trainer_id = ?';
      params.push(staffId);
    }

    sql += ' ORDER BY a.updated_at DESC';

    const [rows] = await db.query(sql, params);
    let selectedRows = rows;
    if (distinctMembers) {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dateKey = (value) => {
        if (!value) return '';
        if (value instanceof Date) {
          return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
        }
        return String(value).slice(0, 10);
      };
      const timestamp = (value) => {
        const parsed = value ? new Date(value).getTime() : 0;
        return Number.isNaN(parsed) ? 0 : parsed;
      };
      const rank = (row) => [
        String(row.status || '').toLowerCase() === 'active' ? 1 : 0,
        (!row.plan_start_date || dateKey(row.plan_start_date) <= todayKey) &&
          (!row.plan_end_date || dateKey(row.plan_end_date) >= todayKey) ? 1 : 0,
        timestamp(row.updated_at),
        dateKey(row.plan_start_date),
        Number(row.id) || 0,
      ];
      const compareRank = (left, right) => {
        const leftRank = rank(left);
        const rightRank = rank(right);
        for (let index = 0; index < leftRank.length; index += 1) {
          if (leftRank[index] !== rightRank[index]) {
            return leftRank[index] > rightRank[index] ? 1 : -1;
          }
        }
        return 0;
      };

      const latestByMember = new Map();
      for (const row of rows) {
        const memberKey = String(row.user_id);
        const endDate = dateKey(row.plan_end_date);
        if (!memberKey || memberKey === 'undefined' || (endDate && endDate < todayKey)) continue;

        const current = latestByMember.get(memberKey);
        if (!current || compareRank(row, current) > 0) {
          latestByMember.set(memberKey, row);
        }
      }

      selectedRows = [...latestByMember.values()]
        .filter((row) => !staffId || Number(row.trainer_id) === Number(staffId))
        .sort((left, right) => timestamp(right.updated_at) - timestamp(left.updated_at));
    }

    console.log('[assignments] returning', selectedRows.length, 'rows for staffId', staffId);
    res.json(selectedRows.map(normalizeAssignment));
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

      const seenAssignments = new Set();
      for (const a of assignments) {
        const userId = Number(a.userId);
        const trainerId = Number(a.trainerId);
        if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(trainerId) || trainerId <= 0) {
          const error = new Error('A valid member and trainer are required');
          error.statusCode = 400;
          throw error;
        }

        const assignmentKey = a.assignmentId != null
          ? `id:${a.assignmentId}`
          : `member:${userId}:plan:${a.planId ?? ''}`;
        if (seenAssignments.has(assignmentKey)) {
          const error = new Error('Duplicate assignment in request');
          error.statusCode = 400;
          throw error;
        }
        seenAssignments.add(assignmentKey);

        const [userRows] = await connection.query('SELECT id, user_id FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
          const error = new Error('Member account was not found');
          error.statusCode = 400;
          throw error;
        }

        const [trainerRows] = await connection.query(
          "SELECT id, name, role, status FROM staff WHERE id = ?",
          [trainerId]
        );
        const trainerRecord = trainerRows[0];
        if (
          !trainerRecord ||
          String(trainerRecord.role || '').toLowerCase() !== 'trainer' ||
          String(trainerRecord.status || '').toLowerCase() !== 'active'
        ) {
          const error = new Error('Selected trainer is unavailable');
          error.statusCode = 400;
          throw error;
        }

        // Resolve UUID if not provided
        const finalUuid = a.userUuid || userRows[0].user_id || null;

        // simple upsert using unique(user_id, plan_id)
        const params = [
          userId,
          finalUuid,
          a.username || null,
          a.userEmail || null,
          a.planId || null,
          a.planName || null,
          a.planDuration || null,
          a.planStartDate || null,
          a.planEndDate || null,
          a.planPrice || null,
          trainerId,
          a.trainerName || trainerRecord.name || null,
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

        if (a.assignmentId != null) {
          const assignmentId = Number(a.assignmentId);
          if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
            const error = new Error('Invalid assignment record');
            error.statusCode = 400;
            throw error;
          }
          const [assignmentRows] = await connection.query(
            'SELECT id FROM trainer_assignments WHERE id = ? AND user_id = ? FOR UPDATE',
            [assignmentId, userId]
          );
          if (assignmentRows.length === 0) {
            const error = new Error('Assignment record was not found');
            error.statusCode = 404;
            throw error;
          }

          await connection.query(
            `UPDATE trainer_assignments SET
              user_id_uuid = ?, username = ?, user_email = ?, plan_id = ?, plan_name = ?,
              plan_duration = ?, plan_start_date = ?, plan_end_date = ?, plan_price = ?,
              trainer_id = ?, trainer_name = ?, trainer_source = ?, session_time = ?,
              status = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [
              finalUuid,
              a.username || null,
              a.userEmail || null,
              a.planId || null,
              a.planName || null,
              a.planDuration || null,
              a.planStartDate || null,
              a.planEndDate || null,
              a.planPrice || null,
              trainerId,
              a.trainerName || trainerRecord.name || null,
              a.trainerSource || 'unknown',
              a.sessionTime || null,
              a.status || 'active',
              assignmentId,
              userId,
            ]
          );
        } else {
          await connection.query(sql, params);
        }

        // Also update existing diet/workout plans for this member to the new trainer
        await connection.query(
          'UPDATE diet_plans SET trainer_id = ?, trainer_name = ?, trainer_source = ?, user_id_uuid = ? WHERE user_id = ?',
          [trainerId, a.trainerName || trainerRecord.name || null, a.trainerSource || 'unknown', finalUuid, userId]
        );
        await connection.query(
          'UPDATE workout_programs SET trainer_id = ?, trainer_name = ?, trainer_source = ?, user_id_uuid = ? WHERE user_id = ?',
          [trainerId, a.trainerName || trainerRecord.name || null, a.trainerSource || 'unknown', finalUuid, userId]
        );
      }

      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      console.error('upsertAssignments error', err);
      res.status(err.statusCode || 500).json({
        error: err.statusCode ? err.message : 'Failed to save assignments',
      });
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
