const db = require('../config/db');

async function getSessions(req, res) {
    try {
        const { trainerUserId } = req.query;
        const membershipId = req.query.membershipId || req.query.ptPlanId;
        let sql = `
            SELECT ts.*, s.name as trainer_name, gm.status as member_status
            FROM trainer_sessions ts
            LEFT JOIN staff s ON ts.trainer_id = s.id
            LEFT JOIN gym_members gm ON (gm.id = ts.member_id OR gm.member_id = ts.member_id)
            WHERE 1=1
        `;
        const params = [];
        
        if (membershipId) {
            sql += ' AND ts.membership_id = ?';
            params.push(membershipId);
        }

        if (trainerUserId) {
            // Resolve trainer user id to staff id
            const [userRows] = await db.query('SELECT email, username FROM users WHERE id = ?', [trainerUserId]);
            if (userRows.length > 0) {
                const u = userRows[0];
                const [staffRows] = await db.query(
                    'SELECT id FROM staff WHERE email = ? OR username = ? LIMIT 1',
                    [u.email, u.username]
                );
                if (staffRows.length > 0) {
                    sql += ' AND ts.trainer_id = ?';
                    params.push(staffRows[0].id);
                } else {
                    return res.json([]);
                }
            } else {
                return res.json([]);
            }
        }

        sql += ' ORDER BY ts.session_date DESC, ts.start_time DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('getSessions error', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
}

async function createSession(req, res) {
    try {
        const { trainerUserId, memberId, memberName, sessionDate, startTime, endTime, sessionType, status, workouts, notes } = req.body;
        if (!memberId) {
            return res.status(400).json({ error: 'Member ID is required' });
        }
        let membershipId = req.body.membership_id || req.body.pt_plan_id || null;

        const [memberRows] = await db.query(
            `SELECT u.id AS user_id
             FROM gym_members gm
             LEFT JOIN users u ON
               (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR
               (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
             WHERE gm.id = ? OR gm.member_id = ?
             LIMIT 1`,
            [memberId, memberId]
        );
        if (!memberRows.length || !memberRows[0].user_id) {
            return res.status(400).json({ error: 'Member record not found for session tracking' });
        }

        if (!membershipId) {
            const [currentPlans] = await db.query(
                `SELECT id
                 FROM memberships
                 WHERE userId = ? AND has_pt_plan = 1
                 ORDER BY createdAt DESC, id DESC
                 LIMIT 1`,
                [memberRows[0].user_id]
            );
            membershipId = currentPlans[0]?.id || null;
        }
        if (!membershipId) {
            return res.status(400).json({ error: 'PT plan is required to create a session record' });
        }
        const [planRows] = await db.query(
            'SELECT id, pt_endDate < CURDATE() AS is_expired FROM memberships WHERE id = ? AND userId = ? AND has_pt_plan = 1',
            [membershipId, memberRows[0].user_id]
        );
        if (!planRows.length) {
            return res.status(400).json({ error: 'PT plan does not belong to this member' });
        }
        if (planRows[0].is_expired) {
            return res.status(409).json({ error: 'Expired PT plan session history is read-only' });
        }

        // Resolve trainer user id to staff id
        const [userRows] = await db.query('SELECT email, username FROM users WHERE id = ?', [trainerUserId]);
        let staffId = null;
        if (userRows.length > 0) {
            const u = userRows[0];
            const [staffRows] = await db.query(
                'SELECT id FROM staff WHERE email = ? OR username = ? LIMIT 1',
                [u.email, u.username]
            );
            if (staffRows.length > 0) {
                staffId = staffRows[0].id;
            }
        }

        if (!staffId) {
            return res.status(400).json({ error: 'Trainer not found' });
        }

        const sql = `
            INSERT INTO trainer_sessions 
            (trainer_id, member_id, membership_id, member_name, session_date, start_time, end_time, session_type, status, workouts, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            staffId, 
            memberId, 
            membershipId,
            memberName, 
            sessionDate, 
            startTime || null, 
            endTime || null, 
            sessionType, 
            status || 'Pending',
            Array.isArray(workouts) ? JSON.stringify(workouts) : JSON.stringify([]), 
            notes || null
        ];

        const [result] = await db.query(sql, params);
        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('createSession error', err);
        res.status(500).json({ error: 'Failed to create session' });
    }
}

async function updateSession(req, res) {
    try {
        const { id } = req.params;
        const { memberId, memberName, sessionDate, startTime, endTime, sessionType, status, workouts, notes } = req.body;
        const [sessionRows] = await db.query(
            `SELECT ts.membership_id, m.pt_endDate < CURDATE() AS is_expired
             FROM trainer_sessions ts
             LEFT JOIN memberships m ON m.id = ts.membership_id
             WHERE ts.id = ?`,
            [id]
        );
        if (!sessionRows.length) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (sessionRows[0].is_expired) {
            return res.status(409).json({ error: 'Expired PT plan session history is read-only' });
        }

        const sql = `
            UPDATE trainer_sessions SET 
                member_id = ?, 
                member_name = ?, 
                session_date = ?, 
                start_time = ?, 
                end_time = ?, 
                session_type = ?, 
                status = ?,
                workouts = ?, 
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        const params = [
            memberId, 
            memberName, 
            sessionDate, 
            startTime || null, 
            endTime || null, 
            sessionType, 
            status || 'Pending',
            Array.isArray(workouts) ? JSON.stringify(workouts) : JSON.stringify([]), 
            notes || null,
            id
        ];

        await db.query(sql, params);
        res.json({ success: true });
    } catch (err) {
        console.error('updateSession error', err);
        res.status(500).json({ error: 'Failed to update session' });
    }
}

async function deleteSession(req, res) {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM trainer_sessions WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('deleteSession error', err);
        res.status(500).json({ error: 'Failed to delete session' });
    }
}

module.exports = {
    getSessions,
    createSession,
    updateSession,
    deleteSession
};
