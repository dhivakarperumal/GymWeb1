const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const enquiryController = {
    // Get all enquiries
    getAllEnquiries: async (req, res) => {
        try {
            let query = 'SELECT * FROM enquiries';
            const params = [];

            if (req.query.email) {
                query += ' WHERE email = ?';
                params.push(req.query.email);
            }

            query += ' ORDER BY created_at DESC';
            const [rows] = await pool.query(query, params);

            rows.forEach(row => {
                if (row.consent_data && typeof row.consent_data === 'string') {
                    try {
                        row.consent_data = JSON.parse(row.consent_data);
                    } catch (err) {
                        console.warn('Failed to parse consent_data in enquiry row', err);
                    }
                }
            });
            res.json(rows);
        } catch (error) {
            console.error('Error fetching enquiries:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get enquiry by ID
    getEnquiryById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            if (rows[0].consent_data && typeof rows[0].consent_data === 'string') {
                try {
                    rows[0].consent_data = JSON.parse(rows[0].consent_data);
                } catch (err) {
                    console.warn('Failed to parse consent_data for enquiry', err);
                }
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    createEnquiry: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const {
                name, email, phone, subject, message, location,
                dob, age, address, employer, occupation,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                emergency_contact_phone_home, emergency_contact_phone_work,
                fitness_goal, blood_group, height, weight, bmi, gender, termsAccepted,
                plan_name, plan_duration, consent_data, trainer_id, trainer_name
            } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required' });
            }

            const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
            const normalizedPhone = String(phone).replace(/\D/g, '');

            if (normalizedPhone.length !== 10) {
                return res.status(400).json({ error: 'A valid 10-digit phone number is required' });
            }

            // Check for duplicate in users / gym_members
            const [existingUsers] = await connection.query(
                `SELECT id, user_id, username, email, mobile FROM users
                 WHERE (LOWER(TRIM(email)) = ? AND email IS NOT NULL AND TRIM(email) != '')
                    OR REPLACE(REPLACE(REPLACE(REPLACE(mobile, ' ', ''), '-', ''), '+91', ''), '(', '') = ?`,
                [normalizedEmail, normalizedPhone]
            );

            const [existingMembers] = await connection.query(
                `SELECT id, name, email, phone FROM gym_members
                 WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+91', ''), '(', '') = ?
                    OR (LOWER(TRIM(email)) = ? AND email IS NOT NULL AND TRIM(email) != '')`,
                [normalizedPhone, normalizedEmail]
            );

            const existingUser = existingUsers.find(userRecord =>
                String(userRecord.mobile || '').replace(/\D/g, '') === normalizedPhone
            );

            if (existingMembers.length > 0 || (existingUsers.length > 0 && !existingUser)) {
                const matchedRecord = existingMembers[0] || existingUsers[0];
                const matchedByPhone = matchedRecord && String(matchedRecord.mobile || matchedRecord.phone || '').replace(/\D/g, '') === normalizedPhone;
                return res.status(409).json({
                    error: matchedByPhone
                        ? 'This mobile number is already registered. Please log in or use a different number.'
                        : 'This email address is already registered. Please use a different email address.',
                    duplicate: true,
                    field: matchedByPhone ? 'phone' : 'email'
                });
            }

            await connection.beginTransaction();

            // Reuse an account that exists without a member record; otherwise create both records.
            let userId_uuid;
            let memberEmail = normalizedEmail || null;
            if (existingUser) {
                userId_uuid = existingUser.user_id;
                memberEmail = existingUser.email || memberEmail;
            } else {
                userId_uuid = uuidv4();
                const passwordHash = await bcrypt.hash(normalizedPhone, 10);
                await connection.query(
                    `INSERT INTO users (user_id, username, email, mobile, password_hash, role, status, created_at)
                     VALUES (?, ?, ?, ?, ?, 'user', 'active', NOW())`,
                    [userId_uuid, name, memberEmail, normalizedPhone, passwordHash]
                );
            }

            // 2. Generate numeric member_id sequence matching admin-created members
            const [maxResult] = await connection.query(
                "SELECT MAX(CAST(member_id AS UNSIGNED)) as maxnum FROM gym_members"
            );
            let nextNumber = (maxResult[0].maxnum || 0) + 1;
            let memberId = String(nextNumber);

            // 3. Create gym_member record
            await connection.query(
                `INSERT INTO gym_members (
                    user_id, member_id, name, phone, email, gender, height, weight, bmi,
                    plan, duration, join_date, status, address, dob, age,
                    employer, occupation, emergency_contact_name, emergency_contact_relationship,
                    emergency_contact_address, emergency_contact_phone_home, emergency_contact_phone_work,
                    fitness_goal, blood_group
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId_uuid, memberId, name, normalizedPhone, memberEmail, gender,
                    height || null, weight || null, bmi || null, plan_name || null, plan_duration || null,
                    address || null, dob || null, age || null, employer || null, occupation || null,
                    emergency_contact_name || null, emergency_contact_relationship || null,
                    emergency_contact_address || null, emergency_contact_phone_home || null,
                    emergency_contact_phone_work || null, fitness_goal || null, blood_group || null
                ]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Member registered successfully.',
                user_id: userId_uuid,
                member_id: memberId
            });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error registering member directly:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        } finally {
            if (connection) connection.release();
        }
    },

    // Update enquiry (all fields)
    updateEnquiry: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name, email, phone, subject, message, location,
                dob, age, address, employer, occupation,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                emergency_contact_phone_home, emergency_contact_phone_work,
                fitness_goal, blood_group, height, weight, bmi, gender, plan_name, plan_duration, status, termsAccepted, consent_data, trainer_id, trainer_name
            } = req.body;

            const [result] = await pool.query(
                `UPDATE enquiries SET 
                    name = ?, email = ?, phone = ?, subject = ?, message = ?, location = ?,
                    dob = ?, age = ?, address = ?, employer = ?, occupation = ?,
                    emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_address = ?,
                    emergency_contact_phone_home = ?, emergency_contact_phone_work = ?,
                    fitness_goal = ?, blood_group = ?, height = ?, weight = ?, bmi = ?, gender = ?, plan_name = ?, plan_duration = ?, status = ?, terms_accepted = ?, consent_data = ?, trainer_id = ?, trainer_name = ?,
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`,
                [
                    name, email, phone, subject || null, message || null, location || null,
                    dob || null, age || null, address || null, employer || null, occupation || null,
                    emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
                    emergency_contact_phone_home || null, emergency_contact_phone_work || null,
                    fitness_goal || null, blood_group || null,
                    height || null, weight || null, bmi || null, gender || null, plan_name || null, plan_duration || null, status || 'pending',
                    termsAccepted ? 1 : 0,
                    consent_data ? JSON.stringify(consent_data) : null,
                    trainer_id || null, trainer_name || null,
                    id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
            if (rows[0] && rows[0].consent_data && typeof rows[0].consent_data === 'string') {
                try {
                    rows[0].consent_data = JSON.parse(rows[0].consent_data);
                } catch (err) {
                    console.warn('Failed to parse consent_data for updated enquiry', err);
                }
            }
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update enquiry status (partial update)
    updateEnquiryStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            const [result] = await pool.query(
                'UPDATE enquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Bulk update enquiry status
    bulkUpdateStatus: async (req, res) => {
        try {
            const { ids, status } = req.body;

            if (!status || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'Status and ids array are required' });
            }

            const [result] = await pool.query(
                'UPDATE enquiries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (?)',
                [status, ids]
            );

            res.json({
                message: `Successfully updated ${result.affectedRows} enquiries`,
                affectedRows: result.affectedRows
            });
        } catch (error) {
            console.error('Error bulk updating enquiries:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Delete enquiry
    deleteEnquiry: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query('DELETE FROM enquiries WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            res.json({ message: 'Enquiry deleted successfully' });
        } catch (error) {
            console.error('Error deleting enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Convert enquiry to user
    convertToUser: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            const { id } = req.params;

            // 1. Get Enquiry details
            const [enquiries] = await connection.query('SELECT * FROM enquiries WHERE id = ?', [id]);
            if (enquiries.length === 0) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }

            const enquiry = enquiries[0];
            if (!enquiry.phone) {
                return res.status(400).json({ error: 'Enquiry must have a phone number to convert' });
            }

            await connection.beginTransaction();

            // 2. Check if user already exists
            const [existingUsers] = await connection.query(
                'SELECT * FROM users WHERE (email = ? AND email IS NOT NULL AND email != "") OR mobile = ?',
                [enquiry.email, enquiry.phone]
            );

            let userId_uuid;
            let db_userId_int;

            if (existingUsers.length > 0) {
                userId_uuid = existingUsers[0].user_id;
                db_userId_int = existingUsers[0].id;
                // If user exists, we might want to update their info, but for now let's just use the ID
            } else {
                // 3. Create the user if not exists
                userId_uuid = uuidv4();
                // Password is mobile number
                const defaultPassword = enquiry.phone.toString();
                const passwordHash = await bcrypt.hash(defaultPassword, 10);

                const [userResult] = await connection.query(
                    `INSERT INTO users (user_id, username, email, mobile, password_hash, role, status, created_at)
                     VALUES (?, ?, ?, ?, ?, 'user', 'active', NOW())`,
                    [userId_uuid, enquiry.name, enquiry.email || null, enquiry.phone, passwordHash]
                );
                db_userId_int = userResult.insertId;
            }

            // 4. Check if gym_member already exists
            const [existingMembers] = await connection.query(
                'SELECT id FROM gym_members WHERE phone = ? OR (email = ? AND email IS NOT NULL AND email != "")',
                [enquiry.phone, enquiry.email]
            );

            if (existingMembers.length === 0) {
                // 5. Create gym_member record
                // Generate numeric member_id sequence matching admin-created members
                const [maxResult] = await connection.query(
                    "SELECT MAX(CAST(member_id AS UNSIGNED)) as maxnum FROM gym_members"
                );
                let nextNumber = (maxResult[0].maxnum || 0) + 1;
                let memberId = String(nextNumber);

                await connection.query(
                    `INSERT INTO gym_members (
                        user_id, member_id, name, phone, email, gender, height, weight, bmi,
                        plan, duration, join_date, status, address, dob, age,
                        employer, occupation, emergency_contact_name, emergency_contact_relationship,
                        emergency_contact_address, emergency_contact_phone_home, emergency_contact_phone_work,
                        fitness_goal, blood_group
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId_uuid, memberId, enquiry.name, enquiry.phone, enquiry.email || null, enquiry.gender, 
                        enquiry.height, enquiry.weight, enquiry.bmi, null, null,
                        enquiry.address, enquiry.dob, enquiry.age, enquiry.employer, enquiry.occupation,
                        enquiry.emergency_contact_name, enquiry.emergency_contact_relationship,
                        enquiry.emergency_contact_address, enquiry.emergency_contact_phone_home,
                        enquiry.emergency_contact_phone_work, enquiry.fitness_goal, enquiry.blood_group
                    ]
                );
            } else {
                // Update existing member's user_id if missing
                await connection.query(
                    'UPDATE gym_members SET user_id = ? WHERE id = ? AND (user_id IS NULL OR user_id = "")',
                    [userId_uuid, existingMembers[0].id]
                );
            }

            // 6. Update enquiry status
            await connection.query('UPDATE enquiries SET status = ? WHERE id = ?', ['converted', id]);

            await connection.commit();

            res.status(201).json({
                message: 'Enquiry successfully converted to Member.',
                user_id: userId_uuid,
                memberExists: existingMembers.length > 0
            });

        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error converting enquiry to user:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        } finally {
            if (connection) connection.release();
        }
    },

    // Delete all enquiries
    deleteAllEnquiries: async (req, res) => {
        try {
            const [result] = await pool.query('DELETE FROM enquiries');
            res.json({
                message: 'All enquiries deleted successfully',
                affectedRows: result.affectedRows
            });
        } catch (error) {
            console.error('Error deleting all enquiries:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = enquiryController;