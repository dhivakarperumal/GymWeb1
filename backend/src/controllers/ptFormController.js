const db = require('../config/db');

function mergeFormData(existingData, incomingData) {
  const merged = { ...existingData };

  Object.entries(incomingData).forEach(([key, value]) => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      return;
    }
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      merged[key] &&
      typeof merged[key] === 'object' &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = mergeFormData(merged[key], value);
      return;
    }
    merged[key] = value;
  });

  return merged;
}

async function savePTForm(req, res) {
  const { member_id, user_id, formData, completed = false } = req.body;

  if (!member_id) {
    return res.status(400).json({ error: 'Member ID is required' });
  }
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return res.status(400).json({ error: 'Valid PT form data is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Save or update PT form data
    const [existing] = await connection.query(
      'SELECT id, user_id, form_data FROM pt_forms WHERE member_id = ?',
      [member_id]
    );
    let existingFormData = {};
    if (existing.length > 0 && existing[0].form_data) {
      existingFormData = typeof existing[0].form_data === 'string'
        ? JSON.parse(existing[0].form_data)
        : existing[0].form_data;
      if (!existingFormData || typeof existingFormData !== 'object' || Array.isArray(existingFormData)) {
        existingFormData = {};
      }
    }
    const incomingPlanId = String(
      formData.pt_plan_id ||
      formData.active_pt_plan_id ||
      existingFormData.pt_plan_id ||
      existingFormData.active_pt_plan_id ||
      'legacy'
    );
    const existingCycles = existingFormData.session_cycles &&
      typeof existingFormData.session_cycles === 'object' &&
      !Array.isArray(existingFormData.session_cycles)
      ? { ...existingFormData.session_cycles }
      : {};
    if (Array.isArray(existingFormData.sessions) && existingFormData.sessions.length > 0) {
      const previousPlanId = existingFormData.pt_plan_id ||
        existingFormData.active_pt_plan_id ||
        `legacy:${existingFormData.pt_join_date || 'unassigned'}`;
      const incomingCurrentCycle = formData.session_cycles?.[incomingPlanId];
      const incomingContainsLegacySessions =
        Array.isArray(formData.sessions) &&
        Array.isArray(incomingCurrentCycle?.sessions) &&
        JSON.stringify(formData.sessions) === JSON.stringify(existingFormData.sessions);
      if (!incomingContainsLegacySessions && !existingCycles[String(previousPlanId)]) {
        existingCycles[String(previousPlanId)] = {
          pt_plan_id: String(previousPlanId),
          plan_name: existingFormData.pt_plan || existingFormData.plan_name || 'Previous PT Plan',
          pt_join_date: existingFormData.pt_join_date || null,
          pt_expiry_date: existingFormData.pt_expiry_date || null,
          sessions: existingFormData.sessions,
        };
      }
    }

    if (/^\d+$/.test(incomingPlanId) && Array.isArray(formData.sessions)) {
      const [planRows] = await connection.query(
        'SELECT pt_endDate, pt_endDate < CURDATE() AS is_expired FROM memberships WHERE id = ? AND has_pt_plan = 1',
        [incomingPlanId]
      );
      const storedPlanId = String(existingFormData.pt_plan_id || existingFormData.active_pt_plan_id || '');
      const incomingCurrentCycle = formData.session_cycles?.[incomingPlanId];
      const incomingMatchesLegacySessions =
        Array.isArray(existingFormData.sessions) &&
        Array.isArray(incomingCurrentCycle?.sessions) &&
        JSON.stringify(incomingCurrentCycle.sessions) === JSON.stringify(existingFormData.sessions);
      const currentSessions = existingCycles[incomingPlanId]?.sessions ||
        (storedPlanId === incomingPlanId || incomingMatchesLegacySessions ? existingFormData.sessions : null) ||
        [];
      const isExpired = Boolean(planRows[0]?.is_expired);
      if (isExpired && JSON.stringify(formData.sessions) !== JSON.stringify(currentSessions)) {
        await connection.rollback();
        return res.status(409).json({
          error: 'This PT plan has expired. Its session history is read-only.',
        });
      }
    }
    const updatedFormData = mergeFormData(existingFormData, formData);
    const incomingCycles = formData.session_cycles &&
      typeof formData.session_cycles === 'object' &&
      !Array.isArray(formData.session_cycles)
      ? formData.session_cycles
      : {};
    const sessionCycles = { ...existingCycles };
    Object.entries(incomingCycles).forEach(([cycleId, cycle]) => {
      if (!sessionCycles[cycleId]) sessionCycles[cycleId] = cycle;
    });
    if (Array.isArray(formData.sessions)) {
      sessionCycles[incomingPlanId] = {
        ...(sessionCycles[incomingPlanId] || {}),
        pt_plan_id: incomingPlanId,
        plan_name: formData.pt_plan || formData.plan_name || sessionCycles[incomingPlanId]?.plan_name || null,
        pt_join_date: formData.pt_join_date || sessionCycles[incomingPlanId]?.pt_join_date || null,
        pt_expiry_date: formData.pt_expiry_date || sessionCycles[incomingPlanId]?.pt_expiry_date || null,
        sessions: formData.sessions,
      };
    }
    updatedFormData.session_cycles = sessionCycles;
    updatedFormData.active_pt_plan_id = incomingPlanId;
    updatedFormData.pt_plan_id = incomingPlanId;
    updatedFormData.sessions = sessionCycles[incomingPlanId]?.sessions || [];

    if (existing.length > 0) {
      await connection.query(
        'UPDATE pt_forms SET form_data = ?, user_id = ? WHERE member_id = ?',
        [JSON.stringify(updatedFormData), user_id || existing[0].user_id || null, member_id]
      );
    } else {
      await connection.query(
        'INSERT INTO pt_forms (member_id, user_id, form_data) VALUES (?, ?, ?)',
        [member_id, user_id || null, JSON.stringify(updatedFormData)]
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
        updatedFormData.name || null,
        updatedFormData.email || null,
        updatedFormData.phone || null,
        updatedFormData.gender || null,
        updatedFormData.height || null,
        updatedFormData.weight || null,
        updatedFormData.bmi || null,
        updatedFormData.address || null,
        updatedFormData.dob || null,
        updatedFormData.age || null,
        updatedFormData.occupation || null,
        updatedFormData.fitness_goal || null,
        updatedFormData.blood_group || null,
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
  return res.status(410).json({
    error: 'PT session history is preserved. Resetting session records is no longer supported.',
  });
}

module.exports = { savePTForm, getPTForm, resetPTForm };
