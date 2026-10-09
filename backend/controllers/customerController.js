const db = require('../db');

// Get all customers (with search & vehicle count)
exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        c.*, 
        COUNT(v.vehicle_id)::int AS vehicle_count
      FROM customers c
      LEFT JOIN vehicles v ON c.customer_id = v.customer_id
    `;
    const params = [];

    if (search) {
      query += ` WHERE LOWER(c.name) LIKE $1 OR c.phone LIKE $1 OR LOWER(c.email) LIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ` GROUP BY c.customer_id ORDER BY c.customer_id DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ success: false, message: 'Server error fetching customers', error: err.message });
  }
};

// Get single customer by ID with their vehicles
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerRes = await db.query('SELECT * FROM customers WHERE customer_id = $1', [id]);

    if (customerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customer = customerRes.rows[0];

    const vehiclesRes = await db.query('SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY vehicle_id DESC', [id]);
    customer.vehicles = vehiclesRes.rows;

    res.json({ success: true, data: customer });
  } catch (err) {
    console.error('Error fetching customer by id:', err);
    res.status(500).json({ success: false, message: 'Server error fetching customer details', error: err.message });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required fields.' });
    }

    // Check duplicate phone
    const checkPhone = await db.query('SELECT customer_id FROM customers WHERE phone = $1', [phone]);
    if (checkPhone.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A customer with this phone number already exists.' });
    }

    const result = await db.query(
      `INSERT INTO customers (name, phone, email, address) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone, email || null, address || null]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Customer created successfully.' });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ success: false, message: 'Server error creating customer', error: err.message });
  }
};

// Update an existing customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required fields.' });
    }

    // Check duplicate phone for other customers
    const checkPhone = await db.query('SELECT customer_id FROM customers WHERE phone = $1 AND customer_id != $2', [phone, id]);
    if (checkPhone.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Another customer is already registered with this phone number.' });
    }

    const result = await db.query(
      `UPDATE customers SET name = $1, phone = $2, email = $3, address = $4 WHERE customer_id = $5 RETURNING *`,
      [name, phone, email || null, address || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Customer updated successfully.' });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ success: false, message: 'Server error updating customer', error: err.message });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM customers WHERE customer_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ success: false, message: 'Server error deleting customer', error: err.message });
  }
};
