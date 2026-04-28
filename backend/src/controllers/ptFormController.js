const db = require('../config/db');

async function savePTForm(req, res) {
  const { member_id, user_id, formData } = req.body;

  if (!member_id) {
    return res.status(400).json({ error: 'Member ID is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Save or Update PT Form data
    const [existing] = await connection.query(
      'SELECT id FROM pt_forms WHERE member_id = ?',
      [member_id]
    );

    if (existing.length > 0) {
      await connection.query(
        'UPDATE pt_forms SET form_data = ?, user_id = ? WHERE member_id = ?',
        [JSON.stringify(formData), user_id || null, member_id]
      );
    } else {
      await connection.query(
        'INSERT INTO pt_forms (member_id, user_id, form_data) VALUES (?, ?, ?)',
        [member_id, user_id || null, JSON.stringify(formData)]
      );
    }

    // 2. Update gym_members table status and basic info
    await connection.query(
      `UPDATE gym_members SET 
        pt_form_completed = 1, 
        pt_form_completed_at = NOW(),
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        gender = COALESCE(?, gender),
        height = COALESCE(?, height),
        weight = COALESCE(?, weight),
        bmi = COALESCE(?, bmi)
       WHERE id = ?`,
      [
        formData.name || null,
        formData.email || null,
        formData.phone || null,
        formData.gender || null,
        formData.height || null,
        formData.weight || null,
        formData.bmi || null,
        member_id
      ]
    );

    await connection.commit();
    res.json({ success: true, message: 'PT Form saved successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('savePTForm error:', err);
    res.status(500).json({ error: 'Failed to save PT Form' });
  } finally {
    connection.release();
  }
}

async function getPTForm(req, res) {
  const { member_id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM pt_forms WHERE member_id = ?',
      [member_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getPTForm error:', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

module.exports = { savePTForm, getPTForm };
