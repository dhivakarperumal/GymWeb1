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
      id: r.id, 
      name: r.name, 
      email: r.email, 
      phone: r.phone 
    }));

    // Insert into message_history
    const [insertRes] = await db.query(
      "INSERT INTO message_history (subject, message, sent_to, failed, recipients_json) VALUES (?, ?, ?, ?, ?)",
      [
        subject || 'Message from Gym', 
        message, 
        recipients.length, 
        0, 
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
    const { userId, phone, message, type } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    // SIMULATE SENDING WHATSAPP/SMS MESSAGE HERE
    // For now, we will assume it succeeds immediately.
    // In a real scenario, you'd call Twilio, WhatsApp Business API, or MSG91 here.
    const isSuccess = true; 
    const status = isSuccess ? 'sent' : 'failed';

    // Store the result in the messages collection
    const [result] = await db.query(
      `INSERT INTO messages (userId, phone, message, type, status) VALUES (?, ?, ?, ?, ?)`,
      [userId || null, phone, message, type || 'general', status]
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
