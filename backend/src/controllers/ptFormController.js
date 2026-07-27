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

    // Get existing form data
    const [existing] = await connection.query(
      'SELECT form_data FROM pt_forms WHERE member_id = ?',
      [member_id]
    );

    if (existing.length > 0 && existing[0].form_data) {
      // Parse existing form data safely
      let formData = existing[0].form_data;
      let parsedSuccessfully = true;

      if (typeof formData === 'string') {
        try {
          formData = JSON.parse(formData);
        } catch (parseError) {
          console.warn(`Failed to parse form_data for member ${member_id}:`, parseError);
          parsedSuccessfully = false;
          // If parsing fails, don't update - keep original data intact
        }
      } else if (typeof formData === 'object' && formData !== null) {
        // Already an object, use it as-is
        parsedSuccessfully = true;
      } else {
        parsedSuccessfully = false;
      }

      // Only update if we have valid data to work with
      if (parsedSuccessfully && formData && Object.keys(formData).length > 0) {
        // Keep all form data (VA enquiry, health history, fitness screening, flexibility measurement)
        // but ONLY reset the sessions array (session tracker step)
        formData.sessions = [];

        // Update pt_forms with cleared sessions but keep all other data
        await connection.query(
          'UPDATE pt_forms SET form_data = ? WHERE member_id = ?',
          [JSON.stringify(formData), member_id]
        );
        console.log(`✅ Session tracker cleared for member ${member_id}, first 5 tabs retained`);
      } else {
        console.warn(`⚠️ Could not parse form data for member ${member_id}, keeping as-is`);
      }
    } else {
      console.log(`ℹ️ No existing form data for member ${member_id}, skipping reset`);
    }

    // Reset pt_form_completed flag only for session tracker completion
    // Users can re-save with new sessions for the new plan
    await connection.query(
      'UPDATE gym_members SET pt_form_completed = 0, pt_form_completed_at = NULL WHERE id = ? OR member_id = ?',
      [member_id, member_id]
    );

    await connection.commit();
    res.json({ success: true, message: 'PT Form session tracker reset successfully (first 5 steps retained)' });
  } catch (err) {
    await connection.rollback();
    console.error('resetPTForm error:', err);
    res.status(500).json({ error: 'Failed to reset PT Form sessions' });
  } finally {
    connection.release();
  }
}

module.exports = { savePTForm, getPTForm, resetPTForm };
