const db = require('../config/db');

/* ================= GET ALL MEMBERSHIPS ================= */
async function getAllMemberships(req, res) {
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
        const [staffRows] = await db.query(
          'SELECT id FROM staff WHERE email = ? OR username = ? LIMIT 1',
          [u.email, u.username]
        );
        if (staffRows.length > 0) {
          staffId = staffRows[0].id;
        }
      }
      if (!staffId) {
        return res.json([]);
      }
    }

    let sql = `
      SELECT m.*, 
             COALESCE(m.userName, u.username) as username, 
             COALESCE(m.userEmail, u.email) as email, 
             COALESCE(m.userPhone, u.mobile) as mobile, 
             u.role,
             gm.join_date as memberJoinDate,
             gm.expiry_date as memberExpiryDate,
             COALESCE(gp.trainer_included, m.has_pt_plan, 0) as has_pt_plan,
             gp.trainer_included
      FROM memberships m
      LEFT JOIN users u ON m.userId = u.id
      LEFT JOIN gym_members gm ON 
        (u.email = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR 
        (u.mobile = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '') OR
        (m.userEmail = gm.email AND gm.email IS NOT NULL AND gm.email != '') OR
        (m.userPhone = gm.phone AND gm.phone IS NOT NULL AND gm.phone != '')
      LEFT JOIN gym_plans gp ON m.planId = gp.id
    `;

    if (staffId) {
      sql += ` INNER JOIN trainer_assignments ta ON ta.user_id = m.userId AND ta.trainer_id = ? `;
    }

    sql += ` ORDER BY m.createdAt DESC`;

    const [rows] = await db.query(sql, staffId ? [staffId] : []);
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
      paymentDate,
      status,
      secondPaymentPaid,
      paymentStatus,
      referredBy,
      trainerId,
      trainerName,
      discount,
      amount,
      
      pt_planId,
      pt_planName,
      pt_price,
      pt_pricePaid,
      pt_duration,
      pt_startDate,
      pt_endDate,
      pt_paymentMode,
      pt_paymentDate,
      pt_paymentStatus,
      pt_trainerId,
      pt_trainerName,
      pt_discount,
      pt_amount,
      isPTPlanPurchase,
    } = req.body;

    const actualPricePaid = pricePaid !== undefined ? pricePaid : (price || 0);
    const actualSecondPaymentPaid = secondPaymentPaid !== undefined ? secondPaymentPaid : 0;

    // Auto-calculate payment status if not provided for normal plans
    let finalPaymentStatus = paymentStatus;
    if (!finalPaymentStatus && price !== undefined) {
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

    // Check if the plan is a PT plan (fallback logic)
    let isPTPlan = isPTPlanPurchase ? 1 : 0;
    if (!isPTPlanPurchase && planId) {
      try {
        const [planRows] = await db.query('SELECT trainer_included FROM gym_plans WHERE id = ?', [planId]);
        if (planRows.length > 0) {
          isPTPlan = planRows[0].trainer_included ? 1 : 0;
        }
      } catch (e) {
        isPTPlan = 0;
      }
    }

    const query = `
      INSERT INTO memberships
      (userId, userName, userEmail, userPhone, planId, planName, price, pricePaid, secondPaymentPaid, duration, startDate, endDate, paymentId, paymentMode, paymentDate, status, paymentStatus, referredBy, trainerId, trainerName, discount, amount, collectedBy, has_pt_plan, pt_planId, pt_planName, pt_price, pt_pricePaid, pt_duration, pt_startDate, pt_endDate, pt_paymentMode, pt_paymentDate, pt_paymentStatus, pt_trainerId, pt_trainerName, pt_discount, pt_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      resolvedUserId,
      userName || null,
      userEmail || null,
      userPhone || null,
      planId || null,
      planName || null,
      price || null,
      actualPricePaid,
      actualSecondPaymentPaid,
      duration || null,
      startDate || null,
      endDate || null,
      paymentId || null,
      paymentMode || null,
      paymentDate || null,
      status || 'active',
      finalPaymentStatus || null,
      referredBy || null,
      trainerId || null,
      trainerName || null,
      discount !== undefined ? discount : 0,
      amount !== undefined ? amount : 0,
      req.body.collectedBy || null,
      isPTPlan,
      pt_planId || null,
      pt_planName || null,
      pt_price || null,
      pt_pricePaid || null,
      pt_duration || null,
      pt_startDate || null,
      pt_endDate || null,
      pt_paymentMode || null,
      pt_paymentDate || null,
      pt_paymentStatus || null,
      pt_trainerId || null,
      pt_trainerName || null,
      pt_discount || 0,
      pt_amount || 0,
    ];

    const [result] = await db.query(query, values);

    // Sync with gym_members table if a record exists for this user
    try {
      const [userRows] = await db.query("SELECT email, mobile FROM users WHERE id = ?", [userId]);
      if (userRows.length > 0) {
        const u = userRows[0];
        
        if (isPTPlanPurchase) {
          await db.query(
            `UPDATE gym_members 
             SET pt_plan = ?, 
                 pt_duration = ?, 
                 pt_join_date = ?, 
                 pt_expiry_date = ?,
                 pt_status = ?
             WHERE (email = ? AND email IS NOT NULL AND email != '') 
                OR (phone = ? AND phone IS NOT NULL AND phone != '')`,
            [pt_planName, pt_duration, pt_startDate, pt_endDate, pt_status || 'active', u.email, u.mobile]
          );
        } else {
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
      "price",
      "pricePaid",
      "secondPaymentPaid",
      "paymentMode",
      "paymentDate",
      "paymentId",
      "planId",
      "startDate",
      "endDate",
      "duration",
      "planName",
      "paymentStatus",
      "trainerId",
      "trainerName",
      "discount",
      "amount",
      "collectedBy",
      "has_pt_plan",
      "pt_planId",
      "pt_planName",
      "pt_price",
      "pt_pricePaid",
      "pt_secondPaymentPaid",
      "pt_duration",
      "pt_startDate",
      "pt_endDate",
      "pt_paymentId",
      "pt_paymentMode",
      "pt_paymentDate",
      "pt_paymentStatus",
      "pt_status",
      "pt_trainerId",
      "pt_trainerName",
      "pt_discount",
      "pt_amount"
    ];

    const updates = [];
    const values = [];

    // If planId is being updated, automatically calculate has_pt_plan
    if (req.body.planId !== undefined) {
      try {
        const [planRows] = await db.query('SELECT trainer_included FROM gym_plans WHERE id = ?', [req.body.planId]);
        if (planRows.length > 0) {
          req.body.has_pt_plan = planRows[0].trainer_included ? 1 : 0;
        }
      } catch (e) {
        console.warn('Failed to fetch plan for has_pt_plan calculation', e.message);
      }
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0 && req.body.paymentAmount === undefined) {
      return res.status(400).json({ success: false, message: "No valid fields provided for update" });
    }

    // Perform the main update if there are fields to update
    let result;
    if (updates.length > 0) {
      values.push(id);
      const [resUpdate] = await db.query(`UPDATE memberships SET ${updates.join(", ")} WHERE id = ?`, values);
      result = resUpdate;

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Membership not found" });
      }
    }

    // If a discrete payment amount was provided, append a dues entry (keeps history of instalments)
    if (req.body.paymentAmount !== undefined) {
      const paymentAmount = Number(req.body.paymentAmount) || 0;
      const collectedBy = req.body.collectedBy || null;
      const paymentId = req.body.paymentId || null;

      // Safely fetch current dues JSON; if the `dues` column is missing, attempt to create it.
      let currentDues = [];
      try {
        const [membershipRows] = await db.query("SELECT dues FROM memberships WHERE id = ?", [id]);
        if (membershipRows && membershipRows[0] && membershipRows[0].dues) {
          try {
            currentDues = typeof membershipRows[0].dues === 'string' ? JSON.parse(membershipRows[0].dues) : membershipRows[0].dues;
          } catch (e) {
            currentDues = [];
          }
        }
      } catch (selectErr) {
        console.warn('updateMembership: SELECT dues failed, attempting to add `dues` column', selectErr.message);
        // Try to add a JSON column; if that fails (older MySQL), fall back to LONGTEXT
        try {
          await db.query("ALTER TABLE memberships ADD COLUMN dues JSON NULL");
        } catch (alterErr) {
          console.warn('updateMembership: adding JSON column failed, trying LONGTEXT', alterErr.message);
          try {
            await db.query("ALTER TABLE memberships ADD COLUMN dues LONGTEXT NULL");
          } catch (alt2) {
            console.error('updateMembership: failed to add dues column', alt2.message);
            throw alt2;
          }
        }
        currentDues = [];
      }

      const entry = {
        amount: Number(paymentAmount),
        collectedBy: collectedBy,
        collectedAt: new Date().toISOString(),
        paymentId: paymentId || null,
      };

      currentDues.push(entry);

      // Try to write dues; if column isn't present, attempt to create it then retry.
      try {
        await db.query("UPDATE memberships SET dues = ? WHERE id = ?", [JSON.stringify(currentDues), id]);
      } catch (updateErr) {
        console.warn('updateMembership: UPDATE dues failed, attempting to add column then retry', updateErr.message);
        try {
          await db.query("ALTER TABLE memberships ADD COLUMN IF NOT EXISTS dues JSON NULL");
        } catch (alterErr) {
          // best-effort fallback to LONGTEXT
          try {
            await db.query("ALTER TABLE memberships ADD COLUMN dues LONGTEXT NULL");
          } catch (alt2) {
            console.error('updateMembership: failed to add dues column on retry', alt2.message);
            throw alt2;
          }
        }
        await db.query("UPDATE memberships SET dues = ? WHERE id = ?", [JSON.stringify(currentDues), id]);
      }
    }

    // Sync with gym_members table
    try {
      const [membershipRows] = await db.query("SELECT userId, planName, duration, startDate, endDate, status, pt_planName, pt_duration, pt_startDate, pt_endDate, pt_status FROM memberships WHERE id = ?", [id]);
      if (membershipRows.length > 0) {
        const m = membershipRows[0];
        const [userRows] = await db.query("SELECT email, mobile FROM users WHERE id = ?", [m.userId]);
        if (userRows.length > 0) {
          const u = userRows[0];
          if (req.body.isPTPlanPurchase) {
            await db.query(
              `UPDATE gym_members 
               SET pt_plan = ?, 
                   pt_duration = ?, 
                   pt_join_date = ?, 
                   pt_expiry_date = ?,
                   pt_status = ?
               WHERE (email = ? AND email IS NOT NULL AND email != '') 
                  OR (phone = ? AND phone IS NOT NULL AND phone != '')`,
              [m.pt_planName, m.pt_duration, m.pt_startDate, m.pt_endDate, m.pt_status, u.email, u.mobile]
            );
          } else {
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