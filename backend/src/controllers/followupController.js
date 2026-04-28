const pool = require('../config/db');

const followupController = {
    // Get all follow-ups for a specific enquiry
    getFollowupsByEnquiryId: async (req, res) => {
        try {
            const { enquiryId } = req.params;
            const [rows] = await pool.query(
                'SELECT * FROM enquiry_followups WHERE enquiry_id = ? ORDER BY followup_date DESC',
                [enquiryId]
            );
            res.json(rows);
        } catch (error) {
            console.error('Error fetching follow-ups:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Create a new follow-up
    createFollowup: async (req, res) => {
        try {
            const { enquiry_id, followup_date, notes, status, next_followup_date } = req.body;

            if (!enquiry_id || !followup_date) {
                return res.status(400).json({ error: 'Enquiry ID and follow-up date are required' });
            }

            const [result] = await pool.query(
                `INSERT INTO enquiry_followups (
                    enquiry_id, followup_date, notes, status, next_followup_date
                ) VALUES (?, ?, ?, ?, ?)`,
                [enquiry_id, followup_date, notes || null, status || 'pending', next_followup_date || null]
            );

            // Update the main enquiry status if needed
            if (status) {
                await pool.query('UPDATE enquiries SET status = ? WHERE id = ?', [status, enquiry_id]);
            }

            const [rows] = await pool.query('SELECT * FROM enquiry_followups WHERE id = ?', [result.insertId]);
            res.status(201).json(rows[0]);
        } catch (error) {
            console.error('Error creating follow-up:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Update a follow-up
    updateFollowup: async (req, res) => {
        try {
            const { id } = req.params;
            const { followup_date, notes, status, next_followup_date } = req.body;

            const [result] = await pool.query(
                `UPDATE enquiry_followups SET 
                    followup_date = ?, notes = ?, status = ?, next_followup_date = ?
                WHERE id = ?`,
                [followup_date, notes || null, status || 'pending', next_followup_date || null, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Follow-up not found' });
            }

            // If status is updated, we might want to update the enquiry status too
            const [followup] = await pool.query('SELECT enquiry_id FROM enquiry_followups WHERE id = ?', [id]);
            if (followup.length > 0 && status) {
                await pool.query('UPDATE enquiries SET status = ? WHERE id = ?', [status, followup[0].enquiry_id]);
            }

            const [rows] = await pool.query('SELECT * FROM enquiry_followups WHERE id = ?', [id]);
            res.json(rows[0]);
        } catch (error) {
            console.error('Error updating follow-up:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Delete a follow-up
    deleteFollowup: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query('DELETE FROM enquiry_followups WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Follow-up not found' });
            }

            res.json({ message: 'Follow-up deleted successfully' });
        } catch (error) {
            console.error('Error deleting follow-up:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = followupController;
