const pool = require('../config/db');

const enquiryController = {
    // Get all enquiries
    getAllEnquiries: async (req, res) => {
        try {
            const [rows] = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
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
        try {
            const {
                name, email, phone, subject, message, location,
                dob, age, address, employer, occupation,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                emergency_contact_phone_home, emergency_contact_phone_work,
                fitness_goal, blood_group, height, weight, bmi, gender, termsAccepted,
                plan_name, plan_duration, consent_data
            } = req.body;

            if (!name || !email) {
                return res.status(400).json({ error: 'Name and email are required' });
            }

            const [result] = await pool.query(
                `INSERT INTO enquiries (
                    name, email, phone, subject, message, location,
                    dob, age, address, employer, occupation,
                    emergency_contact_name, emergency_contact_relationship, emergency_contact_address,
                    emergency_contact_phone_home, emergency_contact_phone_work,
                    fitness_goal, blood_group, height, weight, bmi, gender, plan_name, plan_duration, terms_accepted, consent_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    name, email, phone, subject || null, message || null, location || null,
                    dob || null, age || null, address || null, employer || null, occupation || null,
                    emergency_contact_name || null, emergency_contact_relationship || null, emergency_contact_address || null,
                    emergency_contact_phone_home || null, emergency_contact_phone_work || null,
                    fitness_goal || null, blood_group || null,
                    height || null, weight || null, bmi || null, gender || null,
                    plan_name || null, plan_duration || null,
                    termsAccepted ? 1 : 0,
                    consent_data ? JSON.stringify(consent_data) : null
                ]
            );

            const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [result.insertId]);
            if (rows[0] && rows[0].consent_data && typeof rows[0].consent_data === 'string') {
                try {
                    rows[0].consent_data = JSON.parse(rows[0].consent_data);
                } catch (err) {
                    console.warn('Failed to parse consent_data for created enquiry', err);
                }
            }
            res.status(201).json(rows[0]);
        } catch (error) {
            console.error('Error creating enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
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
                fitness_goal, blood_group, height, weight, bmi, gender, plan_name, plan_duration, status, termsAccepted, consent_data
            } = req.body;

            const [result] = await pool.query(
                `UPDATE enquiries SET 
                    name = ?, email = ?, phone = ?, subject = ?, message = ?, location = ?,
                    dob = ?, age = ?, address = ?, employer = ?, occupation = ?,
                    emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_address = ?,
                    emergency_contact_phone_home = ?, emergency_contact_phone_work = ?,
                    fitness_goal = ?, blood_group = ?, height = ?, weight = ?, bmi = ?, gender = ?, plan_name = ?, plan_duration = ?, status = ?, terms_accepted = ?, consent_data = ?,
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
    }
};

module.exports = enquiryController;