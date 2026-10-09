const db = require('../db');

// Get Customer Profile
exports.getProfile = async (req, res) => {
  const customerId = req.user.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  try {
    const result = await db.query(
      `SELECT customer_id, name, phone, email, address
       FROM customers WHERE customer_id = $1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer record not found.' });
    }

    res.json({ success: true, customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving profile.', error: err.message });
  }
};

// Update Customer Profile
exports.updateProfile = async (req, res) => {
  const customerId = req.user.customerId;
  const { name, phone, email, address } = req.body;

  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  try {
    const result = await db.query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address)
       WHERE customer_id = $5
       RETURNING customer_id, name, phone, email, address`,
      [name, phone, email, address, customerId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      customer: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating profile.', error: err.message });
  }
};

// Get My Vehicles
exports.getMyVehicles = async (req, res) => {
  const customerId = req.user.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  try {
    const result = await db.query(
      `SELECT v.*,
              (SELECT COUNT(*) FROM service_bookings sb WHERE sb.vehicle_id = v.vehicle_id) AS total_bookings,
              (SELECT COUNT(*) FROM service_records sr 
               JOIN service_bookings sb ON sr.booking_id = sb.booking_id 
               WHERE sb.vehicle_id = v.vehicle_id) AS total_services
       FROM vehicles v
       WHERE v.customer_id = $1
       ORDER BY v.vehicle_id DESC`,
      [customerId]
    );

    res.json({ success: true, count: result.rows.length, vehicles: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching vehicles.', error: err.message });
  }
};

// Add New Vehicle for Customer
exports.addMyVehicle = async (req, res) => {
  const customerId = req.user.customerId;
  const { registration_no, brand, model, manufacturing_year, fuel_type, mileage } = req.body;

  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  if (!registration_no || !brand || !model) {
    return res.status(400).json({ success: false, message: 'Registration number, Brand, and Model are required.' });
  }

  try {
    const formattedReg = registration_no.toUpperCase().trim();
    const result = await db.query(
      `INSERT INTO vehicles (customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerId, formattedReg, brand, model, manufacturing_year || 2024, fuel_type || 'Petrol', mileage || 0]
    );

    res.status(201).json({
      success: true,
      message: `Vehicle '${formattedReg}' registered successfully!`,
      vehicle: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Vehicle registration number already exists in database.' });
    }
    res.status(500).json({ success: false, message: 'Error registering vehicle.', error: err.message });
  }
};

// Book a Service for Customer's Vehicle
exports.createBooking = async (req, res) => {
  const customerId = req.user.customerId;
  const { vehicle_id, booking_date, service_type, problem_description } = req.body;

  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  if (!vehicle_id || !booking_date || !service_type) {
    return res.status(400).json({ success: false, message: 'Vehicle, booking date, and service type are required.' });
  }

  try {
    // Verify vehicle belongs to customer
    const vehCheck = await db.query(
      'SELECT vehicle_id, registration_no, brand, model FROM vehicles WHERE vehicle_id = $1 AND customer_id = $2',
      [vehicle_id, customerId]
    );

    if (vehCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Vehicle does not belong to your account.' });
    }

    const result = await db.query(
      `INSERT INTO service_bookings (vehicle_id, booking_date, problem_description, service_type, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING *`,
      [vehicle_id, booking_date, problem_description || 'General Checkup', service_type]
    );

    res.status(201).json({
      success: true,
      message: 'Service booking submitted successfully! Tracking status set to Pending.',
      booking: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating booking.', error: err.message });
  }
};

// Track My Bookings & Live Service Status
exports.getMyBookings = async (req, res) => {
  const customerId = req.user.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  try {
    const result = await db.query(
      `SELECT sb.*,
              v.registration_no, v.brand, v.model,
              sr.service_id, sr.service_date, sr.description AS service_notes,
              sr.labour_cost, sr.parts_cost, sr.total_cost,
              m.name AS mechanic_name, m.specialization AS mechanic_specialization,
              inv.invoice_id, inv.grand_total AS invoice_total
       FROM service_bookings sb
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       LEFT JOIN service_records sr ON sb.booking_id = sr.booking_id
       LEFT JOIN mechanics m ON sr.mechanic_id = m.mechanic_id
       LEFT JOIN invoices inv ON sr.service_id = inv.service_id
       WHERE v.customer_id = $1
       ORDER BY sb.booking_date DESC, sb.booking_id DESC`,
      [customerId]
    );

    res.json({ success: true, count: result.rows.length, bookings: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving bookings.', error: err.message });
  }
};

// Get My Vehicle Service History with full details
exports.getMyServiceHistory = async (req, res) => {
  const customerId = req.user.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  try {
    const result = await db.query(
      `SELECT sr.service_id, sr.service_date, sr.odometer_reading, sr.description,
              sr.labour_cost, sr.parts_cost, sr.total_cost,
              sb.booking_id, sb.service_type, sb.problem_description,
              v.registration_no, v.brand, v.model, v.vehicle_id,
              m.name AS mechanic_name, m.specialization AS mechanic_specialization,
              inv.invoice_id, inv.gst, inv.grand_total, inv.invoice_date,
              COALESCE(
                json_agg(
                  json_build_object(
                    'part_id', sp.part_id,
                    'part_name', sp.part_name,
                    'quantity', pu.quantity,
                    'price', sp.price,
                    'total', (sp.price * pu.quantity)
                  )
                ) FILTER (WHERE sp.part_id IS NOT NULL), '[]'
              ) AS parts_used
       FROM service_records sr
       JOIN service_bookings sb ON sr.booking_id = sb.booking_id
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       LEFT JOIN mechanics m ON sr.mechanic_id = m.mechanic_id
       LEFT JOIN invoices inv ON sr.service_id = inv.service_id
       LEFT JOIN parts_used pu ON sr.service_id = pu.service_id
       LEFT JOIN spare_parts sp ON pu.part_id = sp.part_id
       WHERE v.customer_id = $1
       GROUP BY sr.service_id, sb.booking_id, v.vehicle_id, m.mechanic_id, inv.invoice_id
       ORDER BY sr.service_date DESC`,
      [customerId]
    );

    res.json({ success: true, count: result.rows.length, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving service history.', error: err.message });
  }
};

// Get My Invoices
exports.getMyInvoices = async (req, res) => {
  const customerId = req.user.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  try {
    const result = await db.query(
      `SELECT inv.invoice_id, inv.invoice_date, inv.gst, inv.grand_total,
              sr.service_id, sr.service_date, sr.labour_cost, sr.parts_cost, sr.total_cost, sr.description,
              sb.service_type,
              v.registration_no, v.brand, v.model,
              c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address,
              m.name AS mechanic_name
       FROM invoices inv
       JOIN service_records sr ON inv.service_id = sr.service_id
       JOIN service_bookings sb ON sr.booking_id = sb.booking_id
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       JOIN customers c ON v.customer_id = c.customer_id
       LEFT JOIN mechanics m ON sr.mechanic_id = m.mechanic_id
       WHERE c.customer_id = $1
       ORDER BY inv.invoice_date DESC, inv.invoice_id DESC`,
      [customerId]
    );

    res.json({ success: true, count: result.rows.length, invoices: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving invoices.', error: err.message });
  }
};
