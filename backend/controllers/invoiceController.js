const db = require('../db');

// Get all invoices with service, vehicle, customer breakdown
exports.getInvoices = async (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        s.service_date,
        s.labour_cost,
        s.parts_cost,
        s.total_cost AS subtotal,
        b.service_type,
        v.registration_no,
        v.brand,
        v.model,
        c.name AS customer_name,
        c.phone AS customer_phone
      FROM invoices i
      JOIN service_records s ON i.service_id = s.service_id
      JOIN service_bookings b ON s.booking_id = b.booking_id
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN customers c ON v.customer_id = c.customer_id
      ORDER BY i.invoice_id DESC
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ success: false, message: 'Server error fetching invoices', error: err.message });
  }
};

// Get itemized invoice details by invoice ID or service ID
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceRes = await db.query(
      `SELECT 
        i.*,
        s.service_id, s.service_date, s.odometer_reading, s.description AS service_description,
        s.labour_cost, s.parts_cost, s.total_cost AS subtotal,
        b.service_type, b.booking_date,
        v.vehicle_id, v.registration_no, v.brand, v.model, v.fuel_type,
        c.customer_id, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address,
        m.name AS mechanic_name
       FROM invoices i
       JOIN service_records s ON i.service_id = s.service_id
       JOIN mechanics m ON s.mechanic_id = m.mechanic_id
       JOIN service_bookings b ON s.booking_id = b.booking_id
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       JOIN customers c ON v.customer_id = c.customer_id
       WHERE i.invoice_id = $1 OR i.service_id = $1`,
      [id]
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = invoiceRes.rows[0];

    // Get itemized parts used
    const partsRes = await db.query(
      `SELECT pu.quantity, sp.part_name, sp.price, (pu.quantity * sp.price) AS line_total
       FROM parts_used pu
       JOIN spare_parts sp ON pu.part_id = sp.part_id
       WHERE pu.service_id = $1`,
      [invoice.service_id]
    );

    invoice.items = partsRes.rows;

    res.json({ success: true, data: invoice });
  } catch (err) {
    console.error('Error fetching invoice by id:', err);
    res.status(500).json({ success: false, message: 'Server error fetching invoice', error: err.message });
  }
};
