const db = require('../config/db');

async function savePTForm(req, res) {
  const { member_id, user_id, formData, completed = false } = req.body;

  if (!member_id) {
    return res.status(400).json({ error: 'Member ID is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Save or update PT form data
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
        pt_form_completed = CASE WHEN ? THEN 1 ELSE pt_form_completed END,
        pt_form_completed_at = CASE WHEN ? THEN NOW() ELSE pt_form_completed_at END,
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        gender = COALESCE(?, gender),
        height = COALESCE(?, height),
        weight = COALESCE(?, weight),
        bmi = COALESCE(?, bmi),
        address = COALESCE(?, address),
        dob = COALESCE(?, dob),
        age = COALESCE(?, age),
        occupation = COALESCE(?, occupation),
        fitness_goal = COALESCE(?, fitness_goal),
        blood_group = COALESCE(?, blood_group)
       WHERE id = ? OR member_id = ?`,
      [
        completed ? 1 : 0,
        completed ? 1 : 0,
        formData.name || null,
        formData.email || null,
        formData.phone || null,
        formData.gender || null,
        formData.height || null,
        formData.weight || null,
        formData.bmi || null,
        formData.address || null,
        formData.dob || null,
        formData.age || null,
        formData.occupation || null,
        formData.fitness_goal || null,
        formData.blood_group || null,
        member_id,
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
    const record = rows[0];
    if (record.form_data && typeof record.form_data === 'string') {
      try {
        record.form_data = JSON.parse(record.form_data);
      } catch (parseError) {
        console.warn('Failed to parse pt_forms.form_data', parseError);
      }
    }
    res.json(record);
  } catch (err) {
    console.error('getPTForm error:', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function resetPTForm(req, res) {
  const { member_id } = req.params;
  if (!member_id) {
    return res.status(400).json({ error: 'Member ID is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Clear the saved form data from pt_forms table
    await connection.query(
      'UPDATE pt_forms SET form_data = NULL WHERE member_id = ?',
      [member_id]
    );

    // Reset pt_form_completed flag in gym_members
    await connection.query(
      'UPDATE gym_members SET pt_form_completed = 0, pt_form_completed_at = NULL WHERE id = ? OR member_id = ?',
      [member_id, member_id]
    );

    await connection.commit();
    res.json({ success: true, message: 'PT Form reset successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('resetPTForm error:', err);
    res.status(500).json({ error: 'Failed to reset PT Form' });
  } finally {
    connection.release();
  }
}

module.exports = { savePTForm, getPTForm, resetPTForm };
