const db = require('../db');

// Main Feature: Get complete service history using PostgreSQL Stored Function
// Calls `SELECT * FROM get_vehicle_service_history($1)`
exports.getVehicleServiceHistory = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    const cleanReg = registrationNumber.trim();

    // 1. Check if vehicle exists
    const vehicleRes = await db.query(
      `SELECT v.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email 
       FROM vehicles v 
       JOIN customers c ON v.customer_id = c.customer_id 
       WHERE LOWER(v.registration_no) = LOWER($1)`,
      [cleanReg]
    );

    if (vehicleRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No vehicle registered with registration number '${cleanReg}'.`
      });
    }

    const vehicleInfo = vehicleRes.rows[0];

    // 2. Execute PostgreSQL Stored Function: get_vehicle_service_history(reg_no)
    const functionRes = await db.query(
      `SELECT * FROM get_vehicle_service_history($1)`,
      [cleanReg]
    );

    // 3. Query all full service records for this vehicle with parts and invoices
    const fullRecordsRes = await db.query(
      `SELECT 
        s.service_id, s.service_date, s.odometer_reading, s.description, s.labour_cost, s.parts_cost, s.total_cost,
        m.name AS mechanic_name,
        b.service_type, b.booking_date,
        i.invoice_id, i.gst, i.grand_total
       FROM service_records s
       JOIN mechanics m ON s.mechanic_id = m.mechanic_id
       JOIN service_bookings b ON s.booking_id = b.booking_id
       JOIN vehicles v ON b.vehicle_id = v.vehicle_id
       LEFT JOIN invoices i ON s.service_id = i.service_id
       WHERE LOWER(v.registration_no) = LOWER($1)
       ORDER BY s.service_date DESC, s.service_id DESC`,
      [cleanReg]
    );

    const serviceHistoryList = [];

    for (const fullRec of fullRecordsRes.rows) {
      const partsRes = await db.query(
        `SELECT pu.quantity, sp.part_name, sp.price, (pu.quantity * sp.price) AS total_price
         FROM parts_used pu
         JOIN spare_parts sp ON pu.part_id = sp.part_id
         WHERE pu.service_id = $1`,
        [fullRec.service_id]
      );

      serviceHistoryList.push({
        customer_name: vehicleInfo.customer_name,
        registration_no: vehicleInfo.registration_no,
        vehicle_brand: vehicleInfo.brand,
        vehicle_model: vehicleInfo.model,
        service_type: fullRec.service_type,
        service_date: fullRec.service_date,
        mechanic_name: fullRec.mechanic_name,
        description: fullRec.description,
        total_cost: fullRec.total_cost,
        parts_used: partsRes.rows,
        invoice: fullRec.invoice_id ? {
          invoice_id: fullRec.invoice_id,
          gst: fullRec.gst,
          grand_total: fullRec.grand_total
        } : null
      });
    }

    res.json({
      success: true,
      vehicle: vehicleInfo,
      stored_function_rows: functionRes.rows.length,
      total_services: serviceHistoryList.length,
      history: serviceHistoryList
    });

  } catch (err) {
    console.error('Error fetching vehicle service history via stored function:', err);
    res.status(500).json({
      success: false,
      message: 'Server error executing get_vehicle_service_history stored function',
      error: err.message
    });
  }
};

// Query service_history_view directly
exports.getServiceHistoryView = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM service_history_view ORDER BY service_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error querying service_history_view:', err);
    res.status(500).json({ success: false, message: 'Server error querying view', error: err.message });
  }
};
