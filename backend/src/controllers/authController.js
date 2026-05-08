const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

// register a new user
async function register(req, res) {
  const { username, email, mobile, password } = req.body;
  if (!email || !password || !mobile) {
    return res.status(400).json({ message: 'email, mobile and password are required' });
  }

  try {
    const [existing] = await pool.query(
      `SELECT email, mobile FROM users WHERE email = ? OR mobile = ?`,
      [email, mobile]
    );

    if (existing.length > 0) {
      const emailExists = existing.some((u) => u.email === email);
      const mobileExists = existing.some((u) => u.mobile === mobile);

      let message = 'A user with this email or mobile already exists';
      if (emailExists && mobileExists) {
        message = 'Email and mobile number already exist';
      } else if (emailExists) {
        message = 'Email already exists';
      } else if (mobileExists) {
        message = 'Mobile number already exists';
      }
      return res.status(400).json({ message });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const [result] = await pool.query(
      `INSERT INTO users (user_id, email, password_hash, role, username, mobile)
         VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, email, hashed, 'user', username || null, mobile || null]
    );

    const user = {
      id: result.insertId,
      user_id: userId,
      email,
      role: 'user',
      username: username || null,
      mobile: mobile || null
    };
    return res.status(201).json({ user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const duplicateKey = /for key '(.*?)'/.exec(err.message)?.[1] || '';
      let message = 'Email or mobile already exists';
      if (duplicateKey.includes('email')) {
        message = 'Email already exists';
      } else if (duplicateKey.includes('mobile')) {
        message = 'Mobile number already exists';
      }
      return res.status(400).json({ message });
    }

    logger.error('register error: %O', err);
    return res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

// login existing user
async function login(req, res) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    // provide clearer message for missing fields
    return res.status(400).json({ message: 'identifier and password are required' });
  }

  try {
    logger.info('login attempt for identifier: %s', identifier);
    // allow email, username or mobile to be used as identifier
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ? OR mobile = ?',
      [identifier, identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact the administrator.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // strip password_hash before sending user back
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    logger.error('login error: %O', err);
    res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
}

// Google login
async function googleLogin(req, res) {
  const { name, email, googleId, picture } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required from Google' });
  }

  try {
    // Check if user exists
    let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (rows.length === 0) {
      // Create user if not exists
      const userId = uuidv4();
      const [result] = await pool.query(
        `INSERT INTO users (user_id, email, username, role, google_id, picture)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, name || email.split('@')[0], 'user', googleId, picture]
      );
      
      const [newRows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newRows[0];
    } else {
      user = rows[0];
      // Update google ID and picture if not present
      if (!user.google_id || !user.picture) {
        await pool.query(
          'UPDATE users SET google_id = ?, picture = ? WHERE id = ?',
          [googleId, picture, user.id]
        );
      }
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact the administrator.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });

  } catch (err) {
    logger.error('googleLogin error: %O', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// set or change password
async function setPassword(req, res) {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ message: 'User ID and new password are required' });
  }

  try {
    // 1. Fetch current user to get password_hash
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // 2. Verify old password if it exists (not null)
    if (user.password_hash) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Old password is required to change password' });
      }
      const match = await bcrypt.compare(oldPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({ message: 'Incorrect old password' });
      }
    }

    // 3. Hash and update
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashed, userId]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    logger.error('setPassword error: %O', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { register, login, googleLogin, setPassword };