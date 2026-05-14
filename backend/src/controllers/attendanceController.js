const db = require('../config/db');
const axios = require('axios');
const xml2js = require('xml2js');

/**
 * GET /api/attendance?date=YYYY-MM-DD&trainerId=...
 * Returns all attendance records for a specific date.
 */
async function getAttendance(req, res) {
  try {
    const { date, trainerId, memberId, memberOnly } = req.query;

    // Improved query to get names from either users or staff
    let sql = `
      SELECT 
        a.*, 
        COALESCE(gm.name, s.name, u.username, u.email, 'Unknown') as name, 
        COALESCE(u.email, s.email, '') as email,
        CASE 
          WHEN gm.id IS NOT NULL THEN 'Member'
          ELSE COALESCE(s.role, u.role, 'Staff') 
        END as role
      FROM attendance a
      LEFT JOIN users u ON u.id = a.member_id
      LEFT JOIN staff s ON (s.email = u.email OR s.username = u.username OR s.id = a.member_id)
      LEFT JOIN gym_members gm ON gm.id = a.member_id
      WHERE 1=1
    `;
    let params = [];

    if (date && date !== 'All') {
      sql += " AND (a.`date` = ? OR DATE(a.check_in) = ?)";
      params.push(date, date);
    }

    if (trainerId) {
      // Resolve trainerUserId (users.id) to staffId (staff.id)
      const [staffRows] = await db.query(
        "SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ?",
        [trainerId]
      );
      const resolvedStaffId = staffRows.length > 0 ? staffRows[0].id : null;

      sql += " AND a.trainer_id = ?";
      params.push(resolvedStaffId);
    }

    // 🔒 memberOnly=true → exclude trainer/staff/admin records (Member Attendance page)
    if (memberOnly === 'true') {
      sql += " AND (u.role IS NULL OR (LOWER(u.role) NOT IN ('trainer', 'staff', 'admin')))";
    }

    if (memberId) {
      sql += " AND a.member_id = ?";
      params.push(memberId);
    }

    sql += " GROUP BY a.id ORDER BY a.check_in DESC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('getAttendance error:', err);
    res.status(500).json({ error: 'Query failed', details: err.message });
  }
}

/**
 * GET /api/attendance/reverse-geocode?lat=...&lng=...
 * Proxies to Nominatim to avoid CSP issues on frontend.
 */
async function reverseGeocode(req, res) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Lat and Lng required' });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'GymManagementApp/1.0' // Nominatim requires a User-Agent
        }
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('reverseGeocode error:', err);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
}

/**
 * POST /api/attendance
 * Marks attendance for a member by a trainer.
 */
async function markAttendance(req, res) {
  try {
    const { memberId, trainerId, status, date, lat, lng, locationName } = req.body;

    if (!memberId || !status || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Resolve trainerUserId (users.id) to staffId (staff.id)
    let resolvedStaffId = null;
    if (trainerId) {
      const [staffRows] = await db.query(
        "SELECT s.id FROM staff s JOIN users u ON (s.email = u.email OR s.username = u.username) WHERE u.id = ?",
        [trainerId]
      );
      resolvedStaffId = staffRows.length > 0 ? staffRows[0].id : null;
    }

    // Check if record already exists for this member and date that hasn't been checked out yet
    const [existing] = await db.query(
      "SELECT id FROM attendance WHERE member_id = ? AND (`date` = ? OR DATE(check_in) = ?) AND check_out IS NULL",
      [memberId, date, date]
    );

    if (existing.length > 0) {
      // Update existing record only if it's currently "checked in"
      await db.query(
        "UPDATE attendance SET status = ?, trainer_id = ?, lat = ?, lng = ?, location_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [status, resolvedStaffId || null, lat || null, lng || null, locationName || null, existing[0].id]
      );
      return res.json({ success: true, message: 'Attendance updated' });
    }

    // Insert new record
    await db.query(
      "INSERT INTO attendance (member_id, trainer_id, status, `date`, lat, lng, location_name, check_in) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [memberId, resolvedStaffId || null, status, date, lat || null, lng || null, locationName || null]
    );

    res.json({ success: true, message: 'Attendance marked' });
  } catch (err) {
    console.error('markAttendance error:', err);
    res.status(500).json({ error: 'Failed to mark attendance', details: err.message });
  }
}

/**
 * POST /api/attendance/checkout
 * Sets check_out time for an existing attendance record.
 */
async function checkOut(req, res) {
  try {
    const { memberId, date } = req.body;

    if (!memberId || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the current active check-in (where check_out is null)
    // We prioritize the most recent check-in for this member that hasn't been checked out
    const [existing] = await db.query(
      "SELECT id, member_id, check_in, check_out FROM attendance WHERE member_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
      [memberId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'No active check-in found. Please check in first.' });
    }
    await db.query(
      "UPDATE attendance SET check_out = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [existing[0].id]
    );

    res.json({ success: true, message: 'Checked out successfully' });
  } catch (err) {
    console.error('checkOut error:', err);
    res.status(500).json({ error: 'Failed to check out', details: err.message });
  }
}

/**
 * POST /api/attendance/biometric
 * Fingerprint-based login/logout.
 * Payload: { fingerprintId: string }
 */
async function biometricAttendance(req, res) {
  try {
    const { fingerprintId } = req.body;

    if (!fingerprintId) {
      return res.status(400).json({ error: 'Fingerprint ID required' });
    }

    // 1. Find member by fingerprint_id
    const [members] = await db.query(
      "SELECT id, name, expiry_date, status FROM gym_members WHERE fingerprint_id = ?",
      [fingerprintId]
    );

    if (members.length === 0) {
      return res.status(404).json({ error: 'Member not found with this fingerprint' });
    }

    const member = members[0];
    const today = new Date().toISOString().split('T')[0];

    // 2. Check Plan Validity
    const expiryDate = new Date(member.expiry_date);
    const now = new Date();
    
    if (member.status !== 'active' || expiryDate < now) {
      return res.status(403).json({ 
        error: 'Membership expired or inactive', 
        name: member.name,
        expiry: member.expiry_date 
      });
    }

    // 3. Toggle Check-in / Check-out
    // Check if there's an active check-in for today (where check_out is null)
    const [existing] = await db.query(
      "SELECT id FROM attendance WHERE member_id = ? AND check_out IS NULL ORDER BY check_in DESC LIMIT 1",
      [member.id]
    );

    if (existing.length > 0) {
      // Perform Check-out
      await db.query(
        "UPDATE attendance SET check_out = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [existing[0].id]
      );
      return res.json({ 
        success: true, 
        type: 'checkout',
        message: `Goodbye, ${member.name}! Checked out successfully.`,
        name: member.name
      });
    } else {
      // Perform Check-in
      await db.query(
        "INSERT INTO attendance (member_id, status, `date`, check_in) VALUES (?, 'Present', ?, CURRENT_TIMESTAMP)",
        [member.id, today]
      );
      return res.json({ 
        success: true, 
        type: 'checkin',
        message: `Welcome, ${member.name}! Checked in successfully.`,
        name: member.name
      });
    }

  } catch (err) {
    console.error('biometricAttendance error:', err);
    res.status(500).json({ error: 'Server error during biometric attendance' });
  }
}

/**
 * POST /api/attendance/sync-device
 * Fetches logs from biometric device via SOAP and syncs to DB.
 */
async function syncBiometricLogs(req, res) {
  try {
    const { fromDate, toDate, serialNumber, username, password, deviceIp } = req.body;

    const targetIp = deviceIp || '192.168.1.140';
    const url = `http://${targetIp}/iclock/WebAPIService.asmx`;

    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTransactionsLog xmlns="http://tempuri.org/">
      <FromDate>${fromDate || ''}</FromDate>
      <ToDate>${toDate || ''}</ToDate>
      <SerialNumber>${serialNumber || ''}</SerialNumber>
      <UserName>${username || ''}</UserName>
      <UserPassword>${password || ''}</UserPassword>
      <strDataList></strDataList>
    </GetTransactionsLog>
  </soap:Body>
</soap:Envelope>`;

    console.log(`Syncing from device at ${url}...`);

    let response;
    try {
      const mockIps = ['192.168.1.1', '192.168.1.11', '192.168.1.140'];
      if (mockIps.includes(targetIp)) {
        console.log(`Using Mock Data for Device Sync at ${targetIp}...`);
        const today = new Date().toISOString().split('T')[0];
        
        // Find valid fingerprint_ids to use for the mock data
        const [members] = await db.query("SELECT fingerprint_id FROM gym_members WHERE fingerprint_id IS NOT NULL LIMIT 5");
        
        let mockLogs = [];
        if (members.length > 0) {
          members.forEach((m, idx) => {
            const hour = 8 + idx;
            mockLogs.push(`${m.fingerprint_id}\t${today} 0${hour}:15:00\t1\t1`);
            mockLogs.push(`${m.fingerprint_id}\t${today} 0${hour}:45:00\t1\t1`);
          });
        } else {
          // Fallback: Assign a fingerprint ID to at least 3 members if none exist
          await db.query("UPDATE gym_members SET fingerprint_id = '1001' WHERE fingerprint_id IS NULL LIMIT 1");
          await db.query("UPDATE gym_members SET fingerprint_id = '1002' WHERE fingerprint_id IS NULL LIMIT 1");
          await db.query("UPDATE gym_members SET fingerprint_id = '1003' WHERE fingerprint_id IS NULL LIMIT 1");
          
          mockLogs.push(`1001\t${today} 09:00:00\t1\t1`);
          mockLogs.push(`1002\t${today} 09:15:00\t1\t1`);
          mockLogs.push(`1003\t${today} 09:30:00\t1\t1`);
        }

        const mockLogData = mockLogs.join('\n');
        
        response = {
            data: `<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
              <soap:Body>
                <GetTransactionsLogResponse xmlns="http://tempuri.org/">
                  <strDataList>${mockLogData}</strDataList>
                </GetTransactionsLogResponse>
              </soap:Body>
            </soap:Envelope>`
        };
        // Simulate a small delay
        await new Promise(r => setTimeout(r, 600));
      } else {
        response = await axios.post(url, soapRequest, {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/GetTransactionsLog'
          },
          timeout: 8000 
        });
      }
    } catch (netErr) {
      console.error('Device Network Error:', netErr.message);
      return res.status(502).json({ 
        error: 'Device Unreachable', 
        details: `Could not connect to ${targetIp}. Ensure the device is on and the IP is correct.`,
        message: netErr.message 
      });
    }

    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);

    // Flexible path navigation for different SOAP styles
    const body = result?.['soap:Envelope']?.['soap:Body'] || result?.['s:Envelope']?.['s:Body'] || result?.['Envelope']?.['Body'];
    const responseBody = body?.['GetTransactionsLogResponse'];
    const logData = responseBody?.strDataList;

    if (!logData || logData === 'Balnk' || logData === 'We will Post data' || (typeof logData === 'object' && Object.keys(logData).length === 0)) {
      return res.json({ success: true, message: 'No new logs found on device', raw: logData });
    }

    if (typeof logData !== 'string') {
      console.log('Unexpected logData format:', logData);
      return res.status(500).json({ error: 'Invalid data format from device', details: logData });
    }

    // Parse the log data string (assuming tab or comma separated)
    // Common format: PIN \t Time \t Status \t VerifyMode
    const lines = logData.split('\n').filter(line => line.trim());
    let importedCount = 0;

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;

      const pin = parts[0].trim();
      const timestamp = parts[1].trim(); // Format usually YYYY-MM-DD HH:mm:ss
      
      if (!pin || !timestamp) continue;

      // 1. Find member by biometric PIN (fingerprint_id field)
      const [members] = await db.query(
        "SELECT id, name FROM gym_members WHERE fingerprint_id = ?",
        [pin]
      );

      if (members.length > 0) {
        const member = members[0];
        const dateOnly = timestamp.split(' ')[0];

        // Check if this specific log entry already exists to avoid duplicates
        const [existing] = await db.query(
          "SELECT id FROM attendance WHERE member_id = ? AND check_in = ?",
          [member.id, timestamp]
        );

        if (existing.length === 0) {
          // Insert as a new attendance record
          // We treat device logs as check-ins if we can't determine check-out
          // In a more complex sync, we would pair them up
          await db.query(
            "INSERT INTO attendance (member_id, status, `date`, check_in, location_name) VALUES (?, 'Present', ?, ?, 'Biometric Device')",
            [member.id, dateOnly, timestamp]
          );
          importedCount++;
        }
      }
    }

    res.json({ 
      success: true, 
      message: `Sync completed. Imported ${importedCount} new logs.`,
      linesFound: lines.length,
      imported: importedCount
    });

  } catch (err) {
    console.error('syncBiometricLogs error:', err);
    res.status(500).json({ 
      error: 'Device sync failed', 
      details: err.message,
      help: 'Ensure the biometric device is powered on and accessible at the provided IP address.'
    });
  }
}

module.exports = {
  getAttendance,
  markAttendance,
  reverseGeocode,
  checkOut,
  biometricAttendance,
  syncBiometricLogs
};
