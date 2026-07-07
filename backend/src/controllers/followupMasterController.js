const pool = require('../config/db');
const { createMemberRecord } = require('./memberController');

const followupMasterController = {
    // Get all followups
    getAllFollowups: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM followups ORDER BY created_at DESC');
            res.json(rows);
        } catch (error) {
            console.error('Error fetching followups:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Get followup by ID
    getFollowupById: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await pool.query('SELECT * FROM followups WHERE id = ?', [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Followup not found' });
            }

            res.json(rows[0]);
        } catch (error) {
            console.error('Error fetching followup:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Create new followup record
    createFollowup: async (req, res) => {
        try {
            const {
                name, email, phone, subject, message, location,
                dob, age, address, employer, occupation,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                emergency_contact_phone_home, emergency_contact_phone_work,
                fitness_goal, blood_group, height, weight, bmi, gender,
                plan_name, plan_duration, plan_price, next_followup_date, reg_no, organization, website, best_time_to_reach, referred_by,
                trainer_id, trainer_name
            } = req.body;

            if (!name || !phone) {
                return res.status(400).json({ error: 'Name and phone are required' });
            }

            // Check if phone number already exists
            const [existing] = await pool.query(
                'SELECT id, name FROM followups WHERE phone = ? LIMIT 1',
                [phone]
            );
            if (existing.length > 0) {
                return res.status(409).json({
                    error: `Mobile number ${phone} already exists!`
                });
            }

            const [result] = await pool.query(
                `INSERT INTO followups (
                    name, email, phone, subject, message, location,
                    dob, age, address, employer, occupation,
                    emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                    emergency_contact_phone_home, emergency_contact_phone_work,
                    fitness_goal, blood_group, height, weight, bmi, gender, plan_name, plan_duration, plan_price, next_followup_date,
                    reg_no, organization, website, best_time_to_reach, referred_by,
                    trainer_id, trainer_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name, email || null, phone, subject || null, message || null, location || null,
                    dob || null, age || null, address || null, employer || null, occupation || null,
                    emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
                    emergency_contact_phone_home || null, emergency_contact_phone_work || null,
                    fitness_goal || null, blood_group || null,
                    height || null, weight || null, bmi || null, gender || null,
                    plan_name || null, plan_duration || null, plan_price || null, next_followup_date || null,
                    reg_no || null, organization || null, website || null, best_time_to_reach || null, referred_by || null,
                    trainer_id || null, trainer_name || null
                ]
            );

            const [rows] = await pool.query('SELECT * FROM followups WHERE id = ?', [result.insertId]);
            res.status(201).json(rows[0]);
        } catch (error) {
            console.error('Error creating followup:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update followup record
    updateFollowup: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name, email, phone, subject, message, location,
                dob, age, address, employer, occupation,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                emergency_contact_phone_home, emergency_contact_phone_work,
                fitness_goal, blood_group, height, weight, bmi, gender, plan_name, plan_duration, plan_price, next_followup_date, status,
                reg_no, organization, website, best_time_to_reach, referred_by,
                trainer_id, trainer_name
            } = req.body;

            const [result] = await pool.query(
                `UPDATE followups SET 
                    name = ?, email = ?, phone = ?, subject = ?, message = ?, location = ?,
                    dob = ?, age = ?, address = ?, employer = ?, occupation = ?,
                    emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_address = ?,
                    emergency_contact_phone_home = ?, emergency_contact_phone_work = ?,
                    fitness_goal = ?, blood_group = ?, height = ?, weight = ?, bmi = ?, gender = ?, plan_name = ?, plan_duration = ?, plan_price = ?, next_followup_date = ?, status = ?,
                    reg_no = ?, organization = ?, website = ?, best_time_to_reach = ?, referred_by = ?,
                    trainer_id = ?, trainer_name = ?
                WHERE id = ?`,
                [
                    name, email || null, phone, subject || null, message || null, location || null,
                    dob || null, age || null, address || null, employer || null, occupation || null,
                    emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
                    emergency_contact_phone_home || null, emergency_contact_phone_work || null,
                    fitness_goal || null, blood_group || null,
                    height || null, weight || null, bmi || null, gender || null, plan_name || null, plan_duration || null, plan_price || null, next_followup_date || null, status || 'pending',
                    reg_no || null, organization || null, website || null, best_time_to_reach || null, referred_by || null,
                    trainer_id || null, trainer_name || null,
                    id
                ]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Followup not found' });
            }

            const [rows] = await pool.query('SELECT * FROM followups WHERE id = ?', [id]);
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating followup:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Convert followup to member
    convertFollowupToMember: async (req, res) => {
        const { id } = req.params;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();
            const [rows] = await connection.query('SELECT * FROM followups WHERE id = ?', [id]);
            if (rows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Followup not found' });
            }

            const followup = rows[0];
            const memberPayload = {
                name: followup.name || followup.organization || 'Unknown',
                username: followup.name || followup.email || followup.phone || 'followup-member',
                email: followup.email || null,
                phone: followup.phone || null,
                address: followup.address || followup.location || followup.organization || null,
                notes: followup.message || followup.subject || followup.referred_by || followup.website || null,
                height: followup.height,
                weight: followup.weight,
                bmi: followup.bmi,
                dob: followup.dob || null,
                age: followup.age,
                employer: followup.employer || followup.organization || null,
                occupation: followup.occupation,
                emergency_contact_name: followup.emergency_contact_name,
                emergency_contact_relationship: followup.emergency_contact_relationship,
                emergency_contact_address: followup.emergency_contact_address,
                emergency_contact_phone_home: followup.emergency_contact_phone_home,
                emergency_contact_phone_work: followup.emergency_contact_phone_work,
                fitness_goal: followup.fitness_goal,
                blood_group: followup.blood_group,
                gender: followup.gender,
                plan: null,
                duration: null,
                status: 'active',
                password: followup.phone || 'Gym123'
            };

            const member = await createMemberRecord(connection, memberPayload);
            await connection.query('UPDATE followups SET status = ? WHERE id = ?', ['completed', id]);
            await connection.commit();
            res.json(member);
        } catch (error) {
            await connection.rollback();
            console.error('Error converting followup to member:', error);
            if (error.message && error.message.includes('already exists')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        } finally {
            connection.release();
        }
    },

    // Delete followup
    deleteFollowup: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query('DELETE FROM followups WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Followup not found' });
            }

            res.json({ message: 'Followup deleted successfully' });
        } catch (error) {
            console.error('Error deleting followup:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Delete all followups
    deleteAllFollowups: async (req, res) => {
        try {
            const [result] = await pool.query('DELETE FROM followups');
            res.json({ 
                message: 'All followups deleted successfully',
                affectedRows: result.affectedRows 
            });
        } catch (error) {
            console.error('Error deleting all followups:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = followupMasterController;
