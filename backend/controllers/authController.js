const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Customer Registration
exports.registerCustomer = async (req, res) => {
  const { name, phone, email, address, username, password } = req.body;

  if (!name || !phone || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, Phone, Username, and Password are required.'
    });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check if username already exists
    const userCheck = await client.query('SELECT user_id FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Username is already taken.' });
    }

    // Check if phone already exists in customers
    const phoneCheck = await client.query('SELECT customer_id FROM customers WHERE phone = $1', [phone]);
    let customerId;

    if (phoneCheck.rows.length > 0) {
      customerId = phoneCheck.rows[0].customer_id;
      // Ensure customer isn't already linked to another user account
      const linkedUser = await client.query('SELECT user_id FROM users WHERE customer_id = $1', [customerId]);
      if (linkedUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'A user account is already registered for this phone number.' });
      }
    } else {
      // Insert new Customer record
      const custResult = await client.query(
        `INSERT INTO customers (name, phone, email, address)
         VALUES ($1, $2, $3, $4)
         RETURNING customer_id`,
        [name, phone, email || null, address || null]
      );
      customerId = custResult.rows[0].customer_id;
    }

    // Hash Password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert User record
    const userResult = await client.query(
      `INSERT INTO users (username, email, password_hash, role, customer_id)
       VALUES ($1, $2, $3, 'customer', $4)
       RETURNING user_id, username, role, email, created_at`,
      [username, email || null, passwordHash, customerId]
    );

    await client.query('COMMIT');

    const newUser = userResult.rows[0];
    const tokenPayload = {
      userId: newUser.user_id,
      username: newUser.username,
      role: 'customer',
      customerId,
      customerName: name,
      email: newUser.email,
      phone
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to the Customer Portal.',
      token,
      user: tokenPayload
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, message: 'Failed to register user.', error: err.message });
  } finally {
    client.release();
  }
};

// Login (Customer or Service Center)
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    // Find user by username or email
    const result = await db.query(
      `SELECT u.user_id, u.username, u.password_hash, u.role, u.customer_id, u.email,
              c.name AS customer_name, c.phone AS customer_phone
       FROM users u
       LEFT JOIN customers c ON u.customer_id = c.customer_id
       WHERE u.username = $1 OR u.email = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    const user = result.rows[0];

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      role: user.role,
      customerId: user.customer_id,
      customerName: user.customer_name || 'Staff Member',
      email: user.email,
      phone: user.customer_phone || ''
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: `Welcome back, ${tokenPayload.customerName}!`,
      token,
      user: tokenPayload
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Login failed due to server error.', error: err.message });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.username, u.role, u.customer_id, u.email, u.created_at,
              c.name AS customer_name, c.phone AS customer_phone, c.address AS customer_address
       FROM users u
       LEFT JOIN customers c ON u.customer_id = c.customer_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        role: user.role,
        customerId: user.customer_id,
        customerName: user.customer_name || 'Service Staff',
        email: user.email,
        phone: user.customer_phone || '',
        address: user.customer_address || '',
        createdAt: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user info.', error: err.message });
  }
};
