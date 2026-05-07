const pool = require('../config/db');

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
                plan_name, plan_duration, plan_price, reg_no, organization, website, best_time_to_reach, referred_by,
                trainer_id, trainer_name
            } = req.body;

            if (!name || !phone) {
                return res.status(400).json({ error: 'Name and phone are required' });
            }

            const [result] = await pool.query(
                `INSERT INTO followups (
                    name, email, phone, subject, message, location,
                    dob, age, address, employer, occupation,
                    emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                    emergency_contact_phone_home, emergency_contact_phone_work,
                    fitness_goal, blood_group, height, weight, bmi, gender, plan_name, plan_duration, plan_price,
                    reg_no, organization, website, best_time_to_reach, referred_by, updated_by,
                    trainer_id, trainer_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name, email || null, phone, subject || null, message || null, location || null,
                    dob || null, age || null, address || null, employer || null, occupation || null,
                    emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
                    emergency_contact_phone_home || null, emergency_contact_phone_work || null,
                    fitness_goal || null, blood_group || null,
                    height || null, weight || null, bmi || null, gender || null,
                    plan_name || null, plan_duration || null, plan_price || null,
                    reg_no || null, organization || null, website || null, best_time_to_reach || null, referred_by || null,
                    req.body.updated_by || 'Admin',
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
                fitness_goal, blood_group, height, weight, bmi, gender, plan_name, plan_duration, plan_price, status,
                reg_no, organization, website, best_time_to_reach, referred_by,
                trainer_id, trainer_name
            } = req.body;

            const [result] = await pool.query(
                `UPDATE followups SET 
                    name = ?, email = ?, phone = ?, subject = ?, message = ?, location = ?,
                    dob = ?, age = ?, address = ?, employer = ?, occupation = ?,
                    emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_address = ?,
                    emergency_contact_phone_home = ?, emergency_contact_phone_work = ?,
                    fitness_goal = ?, blood_group = ?, height = ?, weight = ?, bmi = ?, gender = ?, plan_name = ?, plan_duration = ?, plan_price = ?, status = ?,
                    reg_no = ?, organization = ?, website = ?, best_time_to_reach = ?, referred_by = ?, updated_by = ?,
                    trainer_id = ?, trainer_name = ?
                WHERE id = ?`,
                [
                    name, email || null, phone, subject || null, message || null, location || null,
                    dob || null, age || null, address || null, employer || null, occupation || null,
                    emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
                    emergency_contact_phone_home || null, emergency_contact_phone_work || null,
                    fitness_goal || null, blood_group || null,
                    height || null, weight || null, bmi || null, gender || null, plan_name || null, plan_duration || null, plan_price || null, status || 'pending',
                    reg_no || null, organization || null, website || null, best_time_to_reach || null, referred_by || null,
                    req.body.updated_by || 'Admin',
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
