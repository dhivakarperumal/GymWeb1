const pool = require('../config/db');

const followupInteractionController = {
    // Get all interactions for a specific followup record
    getInteractionsByFollowupId: async (req, res) => {
        try {
            const { followupId } = req.params;
            const [rows] = await pool.query(
                'SELECT * FROM followup_interactions WHERE followup_id = ? ORDER BY interaction_date DESC',
                [followupId]
            );
            res.json(rows);
        } catch (error) {
            console.error('Error fetching interactions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Create a new interaction
    createInteraction: async (req, res) => {
        try {
            const { followup_id, interaction_date, notes, status, next_followup_date, staff_name } = req.body;
            
            if (!followup_id || !interaction_date) {
                return res.status(400).json({ error: 'Followup ID and interaction date are required' });
            }

            const [result] = await pool.query(
                `INSERT INTO followup_interactions (
                    followup_id, interaction_date, notes, status, next_followup_date, staff_name
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [followup_id, interaction_date, notes || null, status || 'pending', next_followup_date || null, staff_name || 'Admin']
            );

            // Update the main followup status and next_followup_date
            await pool.query(
                'UPDATE followups SET status = ?, next_followup_date = ? WHERE id = ?',
                [status || 'pending', next_followup_date || null, followup_id]
            );

            const [rows] = await pool.query('SELECT * FROM followup_interactions WHERE id = ?', [result.insertId]);
            res.status(201).json(rows[0]);
        } catch (error) {
            console.error('Error creating interaction:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    // Delete an interaction
    deleteInteraction: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await pool.query('DELETE FROM followup_interactions WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            res.json({ message: 'Interaction deleted successfully' });
        } catch (error) {
            console.error('Error deleting interaction:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = followupInteractionController;
