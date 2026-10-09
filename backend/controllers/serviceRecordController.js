const db = require('../db');

// Get all service records (with mechanic, vehicle, booking, customer info)
exports.getServiceRecords = async (req, res) => {
  try {
    const query = `
      SELECT 
        s.*, 
        m.name AS mechanic_name, 
        b.booking_date, 
        b.service_type, 
        b.status AS booking_status,
        v.vehicle_id,
        v.registration_no, 
        v.brand, 
        v.model, 
        c.customer_id,
        c.name AS customer_name,
        i.invoice_id,
        i.grand_total
      FROM service_records s
      JOIN mechanics m ON s.mechanic_id = m.mechanic_id
      JOIN service_bookings b ON s.booking_id = b.booking_id
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN customers c ON v.customer_id = c.customer_id
      LEFT JOIN invoices i ON s.service_id = i.service_id
      ORDER BY s.service_id DESC
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching service records:', err);
    res.status(500).json({ success: false, message: 'Server error fetching service records', error: err.message });
  }
};

// Get single service record details with parts used
exports.getServiceRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const recordRes = await db.query(
      `SELECT 
        s.*, 
        m.name AS mechanic_name, m.specialization AS mechanic_specialization,
        b.booking_date, b.service_type, b.problem_description,
        v.vehicle_id, v.registration_no, v.brand, v.model, v.fuel_type,
        c.customer_id, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
        i.invoice_id, i.invoice_date, i.gst, i.grand_total
       FROM service_records s
       JOIN mechanics m ON s.mechanic_id = m.mechanic_id
       JOIN service_bookings b ON s.booking_id = b.booking_id
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       JOIN customers c ON v.customer_id = c.customer_id
       LEFT JOIN invoices i ON s.service_id = i.service_id
       WHERE s.service_id = $1`,
      [id]
    );

    if (recordRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service record not found' });
    }

    const record = recordRes.rows[0];

    // Fetch parts used in this service record
    const partsRes = await db.query(
      `SELECT pu.part_id, pu.quantity, sp.part_name, sp.price, (pu.quantity * sp.price) AS total_price
       FROM parts_used pu
       JOIN spare_parts sp ON pu.part_id = sp.part_id
       WHERE pu.service_id = $1`,
      [id]
    );
    record.parts_used = partsRes.rows;

    res.json({ success: true, data: record });
  } catch (err) {
    console.error('Error fetching service record by id:', err);
    res.status(500).json({ success: false, message: 'Server error fetching service record', error: err.message });
  }
};

// Create a service record within a PostgreSQL Transaction
// Handles service_records creation, parts_used insertion (trigger auto-deducts stock),
// booking status completion, and invoice generation atomically!
exports.createServiceRecord = async (req, res) => {
  const client = await db.getClient();
  try {
    const {
      booking_id,
      mechanic_id,
      service_date,
      odometer_reading,
      description,
      labour_cost = 0,
      parts_used = [] // Array of { part_id, quantity }
    } = req.body;

    if (!booking_id || !mechanic_id || !service_date) {
      return res.status(400).json({ success: false, message: 'Booking, mechanic, and service date are required.' });
    }

    // Verify booking exists and isn't already completed
    const bookingCheck = await client.query('SELECT status, vehicle_id FROM service_bookings WHERE booking_id = $1', [booking_id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });
    }
    if (bookingCheck.rows[0].status === 'Completed') {
      return res.status(400).json({ success: false, message: 'This service booking has already been marked as Completed.' });
    }

    // Verify mechanic exists
    const mechanicCheck = await client.query('SELECT mechanic_id FROM mechanics WHERE mechanic_id = $1', [mechanic_id]);
    if (mechanicCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid mechanic ID.' });
    }

    // BEGIN POSTGRESQL TRANSACTION
    await client.query('BEGIN');

    // 1. Insert initial Service Record
    const initialLabour = parseFloat(labour_cost) || 0;
    const insertRecordRes = await client.query(
      `INSERT INTO service_records (booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $6) RETURNING *`,
      [booking_id, mechanic_id, service_date, odometer_reading || null, description || '', initialLabour]
    );

    const serviceId = insertRecordRes.rows[0].service_id;
    let calculatedPartsCost = 0;

    // 2. Insert Parts Used (Triggers PostgreSQL update_spare_part_stock())
    if (Array.isArray(parts_used) && parts_used.length > 0) {
      for (const item of parts_used) {
        const { part_id, quantity } = item;
        const qty = parseInt(quantity, 10);

        if (!part_id || isNaN(qty) || qty <= 0) {
          throw new Error('Invalid part ID or quantity provided.');
        }

        // Get part price
        const partRes = await client.query('SELECT price, stock_quantity, part_name FROM spare_parts WHERE part_id = $1', [part_id]);
        if (partRes.rows.length === 0) {
          throw new Error(`Spare part ID ${part_id} does not exist.`);
        }

        const partPrice = parseFloat(partRes.rows[0].price);
        calculatedPartsCost += partPrice * qty;

        // Inserting into parts_used fires PostgreSQL trigger `trg_update_spare_part_stock`
        // If stock is insufficient, trigger raises EXCEPTION and transaction will abort!
        await client.query(
          `INSERT INTO parts_used (service_id, part_id, quantity) VALUES ($1, $2, $3)`,
          [serviceId, part_id, qty]
        );
      }
    }

    // 3. Update Service Record totals
    const finalLabour = initialLabour;
    const finalTotal = finalLabour + calculatedPartsCost;

    await client.query(
      `UPDATE service_records SET parts_cost = $1, total_cost = $2 WHERE service_id = $3`,
      [calculatedPartsCost, finalTotal, serviceId]
    );

    // 4. Update vehicle odometer reading if provided
    if (odometer_reading) {
      const vehicleId = bookingCheck.rows[0].vehicle_id;
      await client.query(
        `UPDATE vehicles SET mileage = GREATEST(mileage, $1) WHERE vehicle_id = $2`,
        [odometer_reading, vehicleId]
      );
    }

    // 5. Update Service Booking status to 'Completed'
    await client.query(
      `UPDATE service_bookings SET status = 'Completed' WHERE booking_id = $1`,
      [booking_id]
    );

    // 6. Generate Invoice record with GST (18%)
    const gstAmount = parseFloat((finalTotal * 0.18).toFixed(2));
    const grandTotalAmount = parseFloat((finalTotal + gstAmount).toFixed(2));

    const invoiceRes = await client.query(
      `INSERT INTO invoices (service_id, invoice_date, gst, grand_total)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [serviceId, service_date, gstAmount, grandTotalAmount]
    );

    // COMMIT POSTGRESQL TRANSACTION
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Service record created, stock deducted via trigger, booking completed, and invoice generated.',
      data: {
        service_id: serviceId,
        booking_id,
        labour_cost: finalLabour,
        parts_cost: calculatedPartsCost,
        total_cost: finalTotal,
        invoice: invoiceRes.rows[0]
      }
    });

  } catch (err) {
    // ROLLBACK ON FAILURE
    await client.query('ROLLBACK');
    console.error('Transaction failed during service record creation:', err.message);

    res.status(400).json({
      success: false,
      message: err.message.includes('Insufficient stock') ? err.message : `Failed to record service: ${err.message}`,
      error: err.message
    });
  } finally {
    client.release();
  }
};
