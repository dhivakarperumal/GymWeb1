const db = require('../config/db');

async function getSessions(req, res) {
    try {
        const { trainerUserId } = req.query;
        let sql = 'SELECT * FROM trainer_sessions';
        const params = [];

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
                    sql += ' WHERE trainer_id = ?';
                    params.push(staffRows[0].id);
                } else {
                    return res.json([]);
                }
            } else {
                return res.json([]);
            }
        }

        sql += ' ORDER BY session_date DESC, start_time DESC';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('getSessions error', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
}

async function createSession(req, res) {
    try {
        const { trainerUserId, memberId, memberName, sessionDate, startTime, endTime, sessionType, workouts, notes } = req.body;

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
            (trainer_id, member_id, member_name, session_date, start_time, end_time, session_type, workouts, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            staffId, 
            memberId, 
            memberName, 
            sessionDate, 
            startTime || null, 
            endTime || null, 
            sessionType, 
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
    deleteSession
};
