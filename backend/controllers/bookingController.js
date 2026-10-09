const db = require('../db');

// Get all service bookings (JOIN with vehicles and customers)
exports.getBookings = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT 
        b.*, 
        v.registration_no, 
        v.brand, 
        v.model, 
        c.customer_id, 
        c.name AS customer_name, 
        c.phone AS customer_phone
      FROM service_bookings b
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN customers c ON v.customer_id = c.customer_id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(v.registration_no) LIKE $${params.length} OR LOWER(c.name) LIKE $${params.length} OR LOWER(b.service_type) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY b.booking_id DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching service bookings:', err);
    res.status(500).json({ success: false, message: 'Server error fetching bookings', error: err.message });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT b.*, v.registration_no, v.brand, v.model, c.customer_id, c.name AS customer_name, c.phone AS customer_phone 
       FROM service_bookings b 
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id 
       JOIN customers c ON v.customer_id = c.customer_id 
       WHERE b.booking_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching booking by id:', err);
    res.status(500).json({ success: false, message: 'Server error fetching booking', error: err.message });
  }
};

// Create a new service booking
exports.createBooking = async (req, res) => {
  try {
    const { vehicle_id, booking_date, problem_description, service_type } = req.body;

    if (!vehicle_id || !booking_date || !service_type) {
      return res.status(400).json({ success: false, message: 'Vehicle, booking date, and service type are required.' });
    }

    // Verify vehicle exists
    const vehicleCheck = await db.query('SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1', [vehicle_id]);
    if (vehicleCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected vehicle does not exist.' });
    }

    const result = await db.query(
      `INSERT INTO service_bookings (vehicle_id, booking_date, problem_description, service_type, status)
       VALUES ($1, $2, $3, $4, 'Pending') RETURNING *`,
      [vehicle_id, booking_date, problem_description || null, service_type]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Service booking created successfully.' });
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ success: false, message: 'Server error creating booking', error: err.message });
  }
};

// Update booking details or status
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, booking_date, problem_description, service_type, status } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE service_bookings 
       SET vehicle_id = COALESCE($1, vehicle_id), 
           booking_date = COALESCE($2, booking_date), 
           problem_description = COALESCE($3, problem_description), 
           service_type = COALESCE($4, service_type), 
           status = COALESCE($5, status) 
       WHERE booking_id = $6 RETURNING *`,
      [vehicle_id || null, booking_date || null, problem_description || null, service_type || null, status || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Booking updated successfully.' });
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ success: false, message: 'Server error updating booking', error: err.message });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM service_bookings WHERE booking_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking deleted successfully.' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ success: false, message: 'Server error deleting booking', error: err.message });
  }
};
