const db = require('../config/db');

// helper to parse JSON columns
function parseDiet(row) {
  if (!row) return row;
  return {
    ...row,
    days: typeof row.days === 'string' ? JSON.parse(row.days || '{}') : row.days,
  };
}

async function resolveTrainerStaffId(trainerUserId) {
  const [rows] = await db.query(
    'SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ? LIMIT 1',
    [trainerUserId]
  );
  return rows.length > 0 ? rows[0].id : null;
}

async function getAllDiets(req, res) {
  try {
    let sql = `
      SELECT dp.*, 
             COALESCE(dp.user_id_uuid, u.user_id) AS user_id_uuid
      FROM diet_plans dp
      LEFT JOIN users u ON u.id = dp.user_id
    `;
    const params = [];
    const conditions = [];

    if (req.query.trainerId) {
      const trainerId = req.query.trainerId;
      const resolvedStaffId = await resolveTrainerStaffId(trainerId);

      if (resolvedStaffId) {
        conditions.push('dp.user_id IN (SELECT ta.user_id FROM trainer_assignments ta WHERE ta.trainer_id = ?)');
        params.push(resolvedStaffId);
      } else {
        // Fallback: if can't resolve staff id, just show plans created by this trainer
        conditions.push('dp.trainer_id = ?');
        params.push(trainerId);
      }
    }

    if (req.query.memberId) {
      conditions.push('(dp.member_id = ? OR dp.user_id = ? OR dp.user_id_uuid = ?)');
      params.push(req.query.memberId, req.query.memberId, req.query.memberId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY dp.created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows.map(parseDiet));
  } catch (err) {
    console.error('getAllDiets error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getDietById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('getDietById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createDiet(req, res) {
  try {
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      userId,
      memberName,
      memberEmail,
      memberMobile,
      memberWeight,
      title,
      totalCalories,
      duration,
      days,
      status,
    } = req.body;

    const targetUserId = userId || memberId;
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID or Member ID is required' });
    }

    // Robust data lookup
    const [userRows] = await db.query(`
      SELECT 
        COALESCE(u.user_id, gm.user_id) as uuid,
        COALESCE(gm.name, u.username) as gm_name,
        COALESCE(u.email, gm.email) as email,
        COALESCE(u.mobile, gm.phone) as mobile,
        gm.weight
      FROM users u
      LEFT JOIN gym_members gm ON (gm.user_id = u.user_id AND u.user_id IS NOT NULL)
                               OR (gm.email = u.email AND u.email IS NOT NULL AND u.email != '')
                               OR (gm.phone = u.mobile AND u.mobile IS NOT NULL AND u.mobile != '')
      WHERE u.id = ?
    `, [targetUserId]);

    const uData = userRows[0] || {};
    const finalMemberName = memberName || uData.gm_name || uData.username || 'Member';
    const finalMemberEmail = memberEmail || uData.email || '';
    const finalMemberMobile = memberMobile || uData.mobile || '';
    const finalMemberWeight = memberWeight || uData.weight || '';
    const userUuid = uData.uuid || null;

    const [result] = await db.query(
      `INSERT INTO diet_plans
      (trainer_id, trainer_name, trainer_source,
       member_id, member_name, member_email, member_mobile, member_weight,
       title, total_calories, duration, days, status, user_id, user_id_uuid)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId || userId || null,
        finalMemberName,
        finalMemberEmail,
        finalMemberMobile,
        finalMemberWeight,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        userId || memberId || null,
        userUuid,
      ]
    );

    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [result.insertId]);
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('createDiet error', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

async function updateDiet(req, res) {
  try {
    const { id } = req.params;
    const {
      trainerId,
      trainerName,
      trainerSource,
      memberId,
      userId,
      memberName,
      memberEmail,
      memberMobile,
      memberWeight,
      title,
      totalCalories,
      duration,
      days,
      status,
    } = req.body;

    const targetUserId = userId || memberId;
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID or Member ID is required' });
    }

    // Robust data lookup
    const [userRows] = await db.query(`
      SELECT 
        COALESCE(u.user_id, gm.user_id) as uuid,
        COALESCE(gm.name, u.username) as gm_name,
        COALESCE(u.email, gm.email) as email,
        COALESCE(u.mobile, gm.phone) as mobile,
        gm.weight
      FROM users u
      LEFT JOIN gym_members gm ON (gm.user_id = u.user_id AND u.user_id IS NOT NULL)
                               OR (gm.email = u.email AND u.email IS NOT NULL AND u.email != '')
                               OR (gm.phone = u.mobile AND u.mobile IS NOT NULL AND u.mobile != '')
      WHERE u.id = ?
    `, [targetUserId]);

    const uData = userRows[0] || {};
    const finalMemberName = memberName || uData.gm_name || uData.username || 'Member';
    const finalMemberEmail = memberEmail || uData.email || '';
    const finalMemberMobile = memberMobile || uData.mobile || '';
    const finalMemberWeight = memberWeight || uData.weight || '';
    const userUuid = uData.uuid || null;

    const [result] = await db.query(
      `UPDATE diet_plans SET
        trainer_id=?, trainer_name=?, trainer_source=?,
        member_id=?, member_name=?, member_email=?, member_mobile=?, member_weight=?,
        title=?, total_calories=?, duration=?, days=?, status=?, user_id=?, user_id_uuid=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId || userId || null,
        finalMemberName,
        finalMemberEmail,
        finalMemberMobile,
        finalMemberWeight,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        userId || memberId || null,
        userUuid,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [id]);
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('updateDiet error', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

async function deleteDiet(req, res) {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM diet_plans WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('deleteDiet error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
};