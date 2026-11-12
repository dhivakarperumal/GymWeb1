const db = require('../config/db');

async function getAllUsers(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.user_id, u.username, u.email, u.mobile, u.role, u.status, u.created_at,
             gm.member_id, s.employee_id
      FROM users u
      LEFT JOIN (
        SELECT user_id, MAX(CAST(member_id AS UNSIGNED)) AS member_id
        FROM gym_members
        WHERE user_id IS NOT NULL AND member_id IS NOT NULL
        GROUP BY user_id
      ) gm ON gm.user_id = u.user_id
      LEFT JOIN (
        SELECT user_id, MAX(employee_id) AS employee_id
        FROM staff
        WHERE user_id IS NOT NULL AND employee_id IS NOT NULL
        GROUP BY user_id
      ) s ON s.user_id = u.user_id
      ORDER BY (gm.member_id IS NULL) ASC, gm.member_id DESC, u.created_at DESC, u.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('getAllUsers error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    const [rows] = await db.query(
      `SELECT u.id, u.user_id, u.username, u.email, u.mobile, u.role, u.status, u.created_at, 
              (u.password_hash IS NOT NULL) AS hasPassword,
              COALESCE(gm.name, s.name, u.username) as full_name,
              gm.id as member_id
       FROM users u
       LEFT JOIN gym_members gm ON u.mobile = gm.phone OR u.email = gm.email
       LEFT JOIN staff s ON u.mobile = s.phone OR u.email = s.email
       WHERE u.id = ?
       LIMIT 1`,
      [idNum]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getUserById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role, username, mobile, active, status } = req.body;
    const idNum = parseInt(id, 10);

    const updates = [];
    const params = [];

    if (role) {
      const validRoles = ['admin', 'trainer', 'staff', 'member', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      // normalize legacy 'user' role to 'member'
      const normalizedRole = role === 'user' ? 'member' : role;
      updates.push('role = ?');
      params.push(normalizedRole);
    }

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }

    if (mobile) {
      updates.push('mobile = ?');
      params.push(mobile);
    }

    // Support both `active` boolean (from frontend toggle) or `status` string
    if (active !== undefined) {
      updates.push('status = ?');
      params.push(active ? 'active' : 'inactive');
    } else if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(idNum);

    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [rows] = await db.query(
      'SELECT id, user_id, username, email, mobile, role, status, created_at FROM users WHERE id = ?',
      [idNum]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('updateUserRole error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
};
