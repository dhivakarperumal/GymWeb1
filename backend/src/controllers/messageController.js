// nodemailer removed as per user request to only store in database
// const nodemailer = require('nodemailer');
const db = require('../config/db');

/* ==========================================
   RECORD MESSAGES TO HISTORY
   - No longer sends real emails as per user request
   - Stores the message and recipient list in message_history table
========================================== */
async function sendMessages(req, res) {
  try {
    const { subject, message, recipients } = req.body;

    if (!message || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'message and recipients are required' });
    }

    // Prepare recipients for storage
    const recipientsToStore = recipients.map(r => ({ 
      memberId: r.memberId || null, 
      userId: r.userId || null,
      name: r.name, 
      email: r.email, 
      phone: r.phone 
    }));

    // Determine if we should store individual IDs (if only 1 recipient)
    const singleRecipient = recipients.length === 1 ? recipients[0] : null;
    let userId = singleRecipient ? singleRecipient.userId : null;
    const memberId = singleRecipient ? singleRecipient.memberId : null;
    
    // Fetch the user_id (UUID) from users table if userId is provided
    let userUuid = null;
    if (userId) {
      // Try to fetch using the userId as either the ID or the UUID
      const [users] = await db.query(
        "SELECT user_id FROM users WHERE id = ? OR user_id = ? LIMIT 1",
        [userId, userId]
      );
      if (users.length > 0) {
        userUuid = users[0].user_id;
      }
    }

    // Insert into message_history
    const [insertRes] = await db.query(
      "INSERT INTO message_history (subject, message, sent_to, failed, userId, user_id, memberId, recipients_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        subject || 'Message from Gym', 
        message, 
        recipients.length, 
        0, 
        userId,
        userUuid,
        memberId,
        JSON.stringify(recipientsToStore)
      ]
    );

    // Return success to client
    return res.json({
      success: true,
      message: 'Message recorded in history',
      historyId: insertRes.insertId,
      total: recipients.length,
      results: recipients.map(r => ({ status: 'sent', recipient: r.name })) // simulated results for frontend compatibility
    });

  } catch (err) {
    console.error("Critical message recording error:", err);
    return res.status(500).json({ 
      error: "Failed to record message in history", 
      details: err.message 
    });
  }
}

async function getMessageHistory(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM message_history ORDER BY sent_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching message history:", err);
    res.status(500).json({ error: "Failed to fetch message history" });
  }
}

async function sendSingleMessage(req, res) {
  try {
    const { userId, memberId, phone, message, type } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    // Fetch the user_id (UUID) from users table if userId is provided
    let userUuid = null;
    if (userId) {
      const [users] = await db.query(
        "SELECT user_id FROM users WHERE id = ? OR user_id = ? LIMIT 1",
        [userId, userId]
      );
      if (users.length > 0) {
        userUuid = users[0].user_id;
      }
    }

    // SIMULATE SENDING WHATSAPP/SMS MESSAGE HERE
    // For now, we will assume it succeeds immediately.
    const isSuccess = true; 
    const status = isSuccess ? 'sent' : 'failed';

    // Store the result in the messages collection
    // Added memberId and ensuring userId is also stored, plus the user_id (UUID)
    const [result] = await db.query(
      `INSERT INTO messages (userId, user_id, memberId, phone, message, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, userUuid || null, memberId || null, phone, message, type || 'general', status]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully', 
      messageId: result.insertId 
    });

  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
}

module.exports = { sendMessages, getMessageHistory, sendSingleMessage };
