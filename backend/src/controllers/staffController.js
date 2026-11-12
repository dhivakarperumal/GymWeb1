const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { normalizePhone, normalizeEmail } = require('../utils/memberIdentity');

async function generateEmployeeId(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [select] = await connection.query("SELECT current FROM counters WHERE name = ? FOR UPDATE", ['employees']);
    
    if (select.length === 0) {
      await connection.query("INSERT INTO counters(name, current) VALUES (?, ?)", ['employees', 1]);
      await connection.commit();
      return res.json({ employeeId: `EMP${String(1).padStart(3, '0')}` });
    }

    const current = select[0].current || 0;
    const next = current + 1;
    await connection.query('UPDATE counters SET current = ? WHERE name = ?', [next, 'employees']);
    await connection.commit();
    return res.json({ employeeId: `EMP${String(next).padStart(3, '0')}` });
  } catch (err) {
    await connection.rollback();
    console.error('generateEmployeeId error', err);
    res.status(500).json({ error: 'Failed to generate employee id' });
  } finally {
    connection.release();
  }
}

async function getStaffById(req, res) {
  try {
    const { id } = req.params;
    const isNum = /^\d+$/.test(id);
    const idNum = isNum ? Number(id) : null;
    
    let query;
    let params;
    if (isNum) {
      query = `SELECT * FROM staff WHERE id = ?`;
      params = [idNum];
    } else {
      query = `SELECT * FROM staff WHERE employee_id = ?`;
      params = [id];
    }
    
    const [rows] = await db.query(query, params);
    if (rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    const staff = rows[0];
    let linkedUsers = [];
    if (staff.user_id) {
      [linkedUsers] = await db.query(
        'SELECT id, user_id, name, email, mobile, username FROM users WHERE user_id = ?',
        [staff.user_id]
      );
    } else if (staff.email || staff.username) {
      [linkedUsers] = await db.query(
        `SELECT id, user_id, name, email, mobile, username FROM users
         WHERE (? IS NOT NULL AND email = ?) OR (? IS NOT NULL AND username = ?)
         ORDER BY id LIMIT 2`,
        [staff.email || null, staff.email || null, staff.username || null, staff.username || null]
      );
    }

    res.json({
      ...staff,
      linked_user_id: linkedUsers.length === 1 ? linkedUsers[0].id : null,
      linked_user_uuid: linkedUsers.length === 1 ? linkedUsers[0].user_id : null,
      linked_user_name: linkedUsers.length === 1 ? linkedUsers[0].name : null,
      linked_user_email: linkedUsers.length === 1 ? linkedUsers[0].email : null,
      linked_user_mobile: linkedUsers.length === 1 ? linkedUsers[0].mobile : null,
      linked_username: linkedUsers.length === 1 ? linkedUsers[0].username : null,
    });
  } catch (err) {
    console.error('getStaffById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createStaff(req, res) {
  // create staff record and also add a user entry for login (trainer role)
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = req.body;

    const query = `INSERT INTO staff
      (user_id, employee_id, username, name, email, phone, role, gender, blood_group,
       dob, joining_date, qualification, experience, shift, salary, address,
       emergency_name, emergency_phone, status, time_in, time_out,
       photo, aadhar_doc, id_doc, certificate_doc, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const staffUuid = uuidv4();
    const params = [
      staffUuid,
      body.employee_id || null,
      body.username || null,
      body.name || null,
      body.email || null,
      body.phone || null,
      body.role || null,
      body.gender || null,
      body.blood_group || null,
      body.dob || null,
      body.joining_date || null,
      body.qualification || null,
      body.experience || null,
      body.shift || null,
      body.salary || null,
      body.address || null,
      body.emergency_name || null,
      body.emergency_phone || null,
      body.status || 'active',
      body.time_in || null,
      body.time_out || null,
      body.photo || null,
      body.aadhar_doc || null,
      body.id_doc || null,
      body.certificate_doc || null,
      new Date(),
      new Date(),
    ];

    const [result] = await connection.query(query, params);

    // create corresponding user entry (trainer role)
    try {
      const passwordToHash = body.password || body.phone || '';
      const hashed = passwordToHash ? await bcrypt.hash(passwordToHash, 10) : null;
      const userRole = body.role || 'trainer';
      await connection.query(
        `INSERT INTO users (user_id, name, email, password_hash, role, username, mobile)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [staffUuid, body.name || null, body.email || null, hashed, userRole, body.username || null, body.phone || null]
      );
    } catch (userErr) {
      // duplicate user entries should not block staff creation,
      // just log warning and continue
      if (userErr.code === 'ER_DUP_ENTRY') {
        console.warn('createStaff: user already exists, skipping user insert');
      } else {
        console.error('createStaff user insert error', userErr);
        // rollback entire transaction because something unexpected happened
        throw userErr;
      }
    }

    await connection.commit();

    // Fetch the created staff record
    let fetchQuery;
    let fetchParams;
    if (body.employee_id) {
      fetchQuery = `SELECT * FROM staff WHERE employee_id = ?`;
      fetchParams = [body.employee_id];
    } else {
      fetchQuery = `SELECT * FROM staff WHERE id = ?`;
      fetchParams = [result.insertId];
    }

    const [rows] = await db.query(fetchQuery, fetchParams);
    res.status(201).json(rows[0]);
  } catch (err) {
    await connection.rollback();
    console.error('createStaff error', err);
    res.status(500).json({ error: 'Failed to create staff', message: err.message });
  } finally {
    connection.release();
  }
}

async function updateStaff(req, res) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const isNum = /^\d+$/.test(id);
    const idNum = isNum ? Number(id) : null;
    const body = req.body;

    const [staffRows] = await connection.query(
      `SELECT * FROM staff WHERE ${isNum ? 'id = ?' : 'employee_id = ?'} FOR UPDATE`,
      [isNum ? idNum : id]
    );
    if (staffRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Staff not found' });
    }
    const currentStaff = staffRows[0];

    if (!body.name?.trim() || !body.email?.trim() || !body.phone?.trim() || !body.username?.trim()) {
      await connection.rollback();
      return res.status(400).json({ error: 'Name, email, mobile number, and username are required' });
    }

    const email = normalizeEmail(body.email);
    const phone = String(body.phone).trim();
    const phoneIdentity = normalizePhone(phone);
    const username = String(body.username).trim();
    const newPassword = typeof body.password === 'string' ? body.password.trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
      await connection.rollback();
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (phoneIdentity.length !== 10) {
      await connection.rollback();
      return res.status(400).json({ error: 'A valid 10-digit mobile number is required' });
    }
    if (newPassword && newPassword.length < 6) {
      await connection.rollback();
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let linkedUsers = [];
    if (currentStaff.user_id) {
      [linkedUsers] = await connection.query(
        'SELECT id, user_id FROM users WHERE user_id = ? FOR UPDATE',
        [currentStaff.user_id]
      );
    } else {
      [linkedUsers] = await connection.query(
        `SELECT id, user_id FROM users
         WHERE (? IS NOT NULL AND email = ?) OR (? IS NOT NULL AND username = ?)
         ORDER BY id LIMIT 2 FOR UPDATE`,
        [
          currentStaff.email || null,
          currentStaff.email || null,
          currentStaff.username || null,
          currentStaff.username || null,
        ]
      );
    }

    if (linkedUsers.length !== 1) {
      await connection.rollback();
      return res.status(409).json({
        error: linkedUsers.length
          ? 'Staff account link is ambiguous; no records were changed'
          : 'Linked user account was not found; no records were changed',
      });
    }
    const linkedUser = linkedUsers[0];
    if (body.linked_user_id != null && Number(body.linked_user_id) !== linkedUser.id) {
      await connection.rollback();
      return res.status(409).json({ error: 'Linked user does not match this staff member' });
    }

    const [duplicateUsers] = await connection.query(
      `SELECT id FROM users
       WHERE id <> ? AND (email_identity = ? OR phone_identity = ?)
       LIMIT 1`,
      [linkedUser.id, email, phoneIdentity]
    );
    if (duplicateUsers.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'Email or mobile number is already used by another account' });
    }

    const [otherStaff] = await connection.query(
      'SELECT id, email, phone FROM staff WHERE id <> ?',
      [currentStaff.id]
    );
    const duplicateStaff = otherStaff.some((staff) =>
      (normalizeEmail(staff.email) && normalizeEmail(staff.email) === email) ||
      (normalizePhone(staff.phone) && normalizePhone(staff.phone) === phoneIdentity)
    );
    if (duplicateStaff) {
      await connection.rollback();
      return res.status(409).json({ error: 'Email or mobile number is already used by another staff member' });
    }

    let query;
    let params;
    
    const baseParams = [
      body.employee_id || null,
      username,
      body.name.trim(),
      email,
      phone,
      body.role || null,
      body.gender || null,
      body.blood_group || null,
      body.dob || null,
      body.joining_date || null,
      body.qualification || null,
      body.experience || null,
      body.shift || null,
      body.salary || null,
      body.address || null,
      body.emergency_name || null,
      body.emergency_phone || null,
      body.status || 'active',
      body.time_in || null,
      body.time_out || null,
      body.photo || null,
      body.aadhar_doc || null,
      body.id_doc || null,
      body.certificate_doc || null,
    ];

    if (isNum) {
      query = `UPDATE staff SET
        employee_id = ?, username = ?, name = ?, email = ?, phone = ?, role = ?,
        gender = ?, blood_group = ?, dob = ?, joining_date = ?,
        qualification = ?, experience = ?, shift = ?, salary = ?, address = ?,
        emergency_name = ?, emergency_phone = ?, status = ?, time_in = ?, time_out = ?,
        photo = ?, aadhar_doc = ?, id_doc = ?, certificate_doc = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
      params = [...baseParams, idNum];
    } else {
      query = `UPDATE staff SET
        employee_id = ?, username = ?, name = ?, email = ?, phone = ?, role = ?,
        gender = ?, blood_group = ?, dob = ?, joining_date = ?,
        qualification = ?, experience = ?, shift = ?, salary = ?, address = ?,
        emergency_name = ?, emergency_phone = ?, status = ?, time_in = ?, time_out = ?,
        photo = ?, aadhar_doc = ?, id_doc = ?, certificate_doc = ?, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ?`;
      params = [...baseParams, id];
    }

    await connection.query(query, params);

    const userParams = [
      body.name.trim(),
      email,
      phone,
      username,
      body.role || null,
      body.status || 'active',
    ];
    const passwordUpdate = newPassword ? ', password_hash = ?' : '';
    if (newPassword) {
      userParams.push(await bcrypt.hash(newPassword, 10));
    }
    userParams.push(linkedUser.id);
    await connection.query(
      `UPDATE users
       SET name = ?, email = ?, mobile = ?, username = ?, role = ?, status = ?${passwordUpdate}
       WHERE id = ?`,
      userParams
    );

    const [rows] = await connection.query(
      `SELECT s.*, u.id AS linked_user_id, u.user_id AS linked_user_uuid
       FROM staff s JOIN users u ON u.id = ?
       WHERE s.${isNum ? 'id' : 'employee_id'} = ?`,
      [linkedUser.id, isNum ? idNum : id]
    );

    await connection.commit();
    res.json(rows[0]);
  } catch (err) {
    await connection.rollback();
    console.error('updateStaff error', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or mobile number is already in use' });
    }
    res.status(500).json({ error: 'Failed to update staff' });
  } finally {
    connection.release();
  }
}

async function getAllStaff(req, res) {
  try {
    const { role } = req.query;
    let sql = 'SELECT * FROM staff';
    const params = [];
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAllStaff error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    let query;
    let params;
    if (isNum) {
      query = `DELETE FROM staff WHERE id = ?`;
      params = [idNum];
    } else {
      query = `DELETE FROM staff WHERE employee_id = ?`;
      params = [id];
    }
    
    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json({ message: 'Staff deleted' });
  } catch (err) {
    console.error('deleteStaff error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = {
  generateEmployeeId,
  getStaffById,
  createStaff,
  updateStaff,
  getAllStaff,
  deleteStaff,
};
