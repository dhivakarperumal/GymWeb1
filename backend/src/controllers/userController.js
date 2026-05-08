const db = require('../config/db');

async function getAllUsers(req, res) {
  try {
    const [rows] = await db.query('SELECT id, user_id, username, email, mobile, role, status, created_at FROM users ORDER BY created_at DESC');
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
      if (!['admin', 'trainer', 'staff', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.push('role = ?');
      params.push(role);
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
