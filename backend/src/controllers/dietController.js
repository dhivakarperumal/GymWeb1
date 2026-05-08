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
    let sql = 'SELECT DISTINCT dp.* FROM diet_plans dp';
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
      conditions.push('(dp.member_id = ? OR dp.user_id = ?)');
      params.push(req.query.memberId, req.query.memberId);
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

    const [result] = await db.query(
      `INSERT INTO diet_plans
      (trainer_id, trainer_name, trainer_source,
       member_id, member_name, member_email, member_mobile, member_weight,
       title, total_calories, duration, days, status, user_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId || userId || null,
        memberName || null,
        memberEmail || null,
        memberMobile || null,
        memberWeight || null,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        userId || memberId || null,
      ]
    );

    const [rows] = await db.query('SELECT * FROM diet_plans WHERE id = ?', [result.insertId]);
    res.json(parseDiet(rows[0]));
  } catch (err) {
    console.error('createDiet error', err);
    res.status(500).json({ error: 'Server error' });
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

    const [result] = await db.query(
      `UPDATE diet_plans SET
        trainer_id=?, trainer_name=?, trainer_source=?,
        member_id=?, member_name=?, member_email=?, member_mobile=?, member_weight=?,
        title=?, total_calories=?, duration=?, days=?, status=?, user_id=?,
        updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [
        trainerId,
        trainerName || null,
        trainerSource || null,
        memberId || userId || null,
        memberName || null,
        memberEmail || null,
        memberMobile || null,
        memberWeight || null,
        title || null,
        totalCalories ? Number(totalCalories) : null,
        duration ? Number(duration) : null,
        JSON.stringify(days || {}),
        status || 'active',
        userId || memberId || null,
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
    res.status(500).json({ error: 'Server error' });
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