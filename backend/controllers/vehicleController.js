const db = require('../db');

// Get all vehicles (JOIN with customers)
exports.getVehicles = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        v.*, 
        c.name AS customer_name, 
        c.phone AS customer_phone
      FROM vehicles v
      JOIN customers c ON v.customer_id = c.customer_id
    `;
    const params = [];

    if (search) {
      query += ` WHERE LOWER(v.registration_no) LIKE $1 OR LOWER(v.brand) LIKE $1 OR LOWER(v.model) LIKE $1 OR LOWER(c.name) LIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ` ORDER BY v.vehicle_id DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ success: false, message: 'Server error fetching vehicles', error: err.message });
  }
};

// Get vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT v.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email 
       FROM vehicles v 
       JOIN customers c ON v.customer_id = c.customer_id 
       WHERE v.vehicle_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching vehicle by id:', err);
    res.status(500).json({ success: false, message: 'Server error fetching vehicle', error: err.message });
  }
};

// Get vehicles for a specific customer
exports.getVehiclesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await db.query('SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY vehicle_id DESC', [customerId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching vehicles by customer:', err);
    res.status(500).json({ success: false, message: 'Server error fetching vehicles', error: err.message });
  }
};

// Add a new vehicle
exports.createVehicle = async (req, res) => {
  try {
    const { customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage } = req.body;

    if (!customer_id || !registration_no || !brand || !model) {
      return res.status(400).json({ success: false, message: 'Customer, Registration Number, Brand, and Model are required.' });
    }

    // Check duplicate registration_no
    const checkReg = await db.query('SELECT vehicle_id FROM vehicles WHERE LOWER(registration_no) = LOWER($1)', [registration_no]);
    if (checkReg.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A vehicle with this registration number already exists.' });
    }

    const result = await db.query(
      `INSERT INTO vehicles (customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage)
       VALUES ($1, UPPER($2), $3, $4, $5, $6, $7) RETURNING *`,
      [customer_id, registration_no, brand, model, manufacturing_year || null, fuel_type || 'Petrol', mileage || 0]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Vehicle registered successfully.' });
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ success: false, message: 'Server error registering vehicle', error: err.message });
  }
};

// Update an existing vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage } = req.body;

    if (!customer_id || !registration_no || !brand || !model) {
      return res.status(400).json({ success: false, message: 'Customer, Registration Number, Brand, and Model are required.' });
    }

    // Check duplicate registration_no for other vehicles
    const checkReg = await db.query('SELECT vehicle_id FROM vehicles WHERE LOWER(registration_no) = LOWER($1) AND vehicle_id != $2', [registration_no, id]);
    if (checkReg.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Another vehicle is already registered with this registration number.' });
    }

    const result = await db.query(
      `UPDATE vehicles 
       SET customer_id = $1, registration_no = UPPER($2), brand = $3, model = $4, manufacturing_year = $5, fuel_type = $6, mileage = $7 
       WHERE vehicle_id = $8 RETURNING *`,
      [customer_id, registration_no, brand, model, manufacturing_year || null, fuel_type || 'Petrol', mileage || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Vehicle updated successfully.' });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ success: false, message: 'Server error updating vehicle', error: err.message });
  }
};

// Delete a vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM vehicles WHERE vehicle_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, message: 'Vehicle deleted successfully.' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ success: false, message: 'Server error deleting vehicle', error: err.message });
  }
};
