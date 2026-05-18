const db = require('../config/db');

/* ================= GET ALL MEMBERSHIPS ================= */
async function getAllMemberships(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT m.*, 
             COALESCE(m.userName, u.username) as username, 
             COALESCE(m.userEmail, u.email) as email, 
             COALESCE(m.userPhone, u.mobile) as mobile, 
             u.role,
             gm.join_date as memberJoinDate,
             gm.expiry_date as memberExpiryDate
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      LEFT JOIN gym_members gm ON 
        (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR 
        (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '') OR
        (m.userEmail = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR
        (m.userPhone = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
      ORDER BY m.createdAt DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching all memberships:", error);
    res.status(500).json({ error: "Failed to fetch memberships" });
  }
}

/* ================= DELETE MEMBERSHIP ================= */

async function deleteMembership(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM memberships WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    res.json({
      success: true,
      message: "Membership deleted successfully",
    });

  } catch (error) {
    console.error("Delete membership error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete membership",
    });
  }
}

/* ================= CREATE MEMBERSHIP ================= */

async function createMembership(req, res) {
  try {
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      planId,
      planName,
      pricePaid,
      price,
      duration,
      startDate,
      endDate,
      paymentId,
      paymentMode,
      status,
      secondPaymentPaid,
      paymentStatus,
      referredBy,
      trainerId,
      trainerName,
    } = req.body;

    const actualPricePaid = pricePaid !== undefined ? pricePaid : price;
    const actualSecondPaymentPaid = secondPaymentPaid !== undefined ? secondPaymentPaid : 0;

    // Auto-calculate payment status if not provided
    let finalPaymentStatus = paymentStatus;
    if (!finalPaymentStatus) {
      const totalPaid = Number(actualPricePaid) + Number(actualSecondPaymentPaid);
      const totalDue = Number(price);
      if (totalPaid >= totalDue) finalPaymentStatus = 'Paid';
      else if (totalPaid > 0) finalPaymentStatus = 'Partial';
      else finalPaymentStatus = 'Pending';
    }

    // If provided userId does not exist in `users` table, null it to avoid FK errors
    let resolvedUserId = userId;
    if (userId) {
      try {
        const [ucheck] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (!ucheck || ucheck.length === 0) resolvedUserId = null;
      } catch (e) {
        resolvedUserId = null;
      }
    }

    const query = `
      INSERT INTO memberships
      (userId, userName, userEmail, userPhone, planId, planName, price, pricePaid, secondPaymentPaid, duration, startDate, endDate, paymentId, paymentMode, status, paymentStatus, referredBy, trainerId, trainerName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      resolvedUserId,
      userName || null,
      userEmail || null,
      userPhone || null,
      planId,
      planName,
      price,
      actualPricePaid,
      actualSecondPaymentPaid,
      duration,
      startDate,
      endDate,
      paymentId || null,
      paymentMode || null,
      status || 'active',
      finalPaymentStatus,
      referredBy || null,
      trainerId || null,
      trainerName || null,
    ];

    const [result] = await db.query(query, values);

    // Sync with gym_members table if a record exists for this user
    try {
      const [userRows] = await db.query("SELECT email, mobile FROM users WHERE id = ?", [userId]);
      if (userRows.length > 0) {
        const u = userRows[0];
        await db.query(
          `UPDATE gym_members 
           SET plan = ?, 
               duration = ?, 
               join_date = ?, 
               expiry_date = ?,
               status = ?
           WHERE (email = ? AND email IS NOT NULL AND email != '') 
              OR (phone = ? AND phone IS NOT NULL AND phone != '')`,
          [planName, duration, startDate, endDate, status || 'active', u.email, u.mobile]
        );
      }
    } catch (syncErr) {
      console.warn('createMembership: failed to sync gym_members', syncErr.message);
    }

    res.status(201).json({
      success: true,
      membershipId: result.insertId,
    });

  } catch (error) {
    console.error("Create membership error:", error);
    if (error && error.stack) console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to create membership",
    });
  }
}

/* ================= GET USER MEMBERSHIPS ================= */

async function getUserMemberships(req, res) {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM memberships WHERE userId = ? ORDER BY createdAt DESC",
      [userId]
    );

    res.json(rows);

  } catch (error) {
    console.error("Fetch memberships error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch memberships",
    });
  }
}

/* ================= GET MEMBERSHIP BY ID ================= */

async function getMembershipById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM memberships WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Membership not found",
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("Fetch membership error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
}

/* ================= UPDATE MEMBERSHIP ================= */
async function updateMembership(req, res) {
  try {
    const { id } = req.params;
    const allowedFields = [
      "status",
      "pricePaid",
      "secondPaymentPaid",
      "paymentMode",
      "paymentId",
      "startDate",
      "endDate",
      "duration",
      "planName",
      "paymentStatus",
      "trainerId",
      "trainerName",
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update" });
    }

    values.push(id);

    const [result] = await db.query(
      `UPDATE memberships SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    // Sync with gym_members table
    try {
      const [membershipRows] = await db.query("SELECT userId, planName, duration, startDate, endDate, status FROM memberships WHERE id = ?", [id]);
      if (membershipRows.length > 0) {
        const m = membershipRows[0];
        const [userRows] = await db.query("SELECT email, mobile FROM users WHERE id = ?", [m.userId]);
        if (userRows.length > 0) {
          const u = userRows[0];
          await db.query(
            `UPDATE gym_members 
             SET plan = ?, 
                 duration = ?, 
                 join_date = ?, 
                 expiry_date = ?,
                 status = ?
             WHERE (email = ? AND email IS NOT NULL AND email != '') 
                OR (phone = ? AND phone IS NOT NULL AND phone != '')`,
            [m.planName, m.duration, m.startDate, m.endDate, m.status, u.email, u.mobile]
          );
        }
      }
    } catch (syncErr) {
      console.warn('updateMembership: failed to sync gym_members', syncErr.message);
    }

    res.json({ success: true, message: "Membership updated successfully" });
  } catch (error) {
    console.error("Update membership error:", error);
    res.status(500).json({ success: false, message: "Failed to update membership" });
  }
}

/* ================= GET EXPIRING SOON ================= */
async function getExpiringSoon(req, res) {
  try {
    const { trainerUserId } = req.query;
    let staffId = null;

    if (trainerUserId) {
      const [userRows] = await db.query(
        'SELECT id, email, username FROM users WHERE id = ?',
        [trainerUserId]
      );
      if (userRows.length > 0) {
        const u = userRows[0];
        // Find matching staff record by email or username
        const [staffRows] = await db.query(
          'SELECT id FROM staff WHERE email = ? OR username = ? LIMIT 1',
          [u.email, u.username]
        );
        if (staffRows.length > 0) {
          staffId = staffRows[0].id;
        }
      }
    }

    let sql = `
      SELECT m.*, 
             COALESCE(m.userName, u.username) as username, 
             COALESCE(m.userEmail, u.email) as email
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
    `;
    
    if (trainerUserId) {
      if (staffId) {
        sql += ` INNER JOIN trainer_assignments ta ON ta.user_id = m.userId AND ta.trainer_id = ? `;
      } else {
        // If trainerUserId was provided but no staff matches, return empty to avoid mismatch
        return res.json([]);
      }
    }

    // Add filter: expiring in next 5 days
    sql += ` WHERE m.status = 'active' 
             AND m.endDate IS NOT NULL
             AND m.endDate >= CURDATE() 
             AND m.endDate <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
             ORDER BY m.endDate ASC `;

    const [rows] = await db.query(sql, staffId ? [staffId] : []);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching expiring memberships:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
}

/* ================= GET TODAY REGISTRATIONS ================= */
async function getTodayRegistrations(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT m.*, 
             COALESCE(m.userName, u.username) as username, 
             COALESCE(m.userEmail, u.email) as email,
             COALESCE(m.userPhone, u.mobile) as phone
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      WHERE DATE(m.createdAt) = CURDATE()
      ORDER BY m.createdAt DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching today's registrations:", error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
}

module.exports = {
  createMembership,
  getUserMemberships,
  getMembershipById,
  getAllMemberships,
  getExpiringSoon,
  getTodayRegistrations, // Added
  updateMembership,
  deleteMembership,
};