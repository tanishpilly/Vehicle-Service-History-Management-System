const db = require('../db');
const path = require('path');
const fs = require('fs');

// Create New Service Appointment with optional Vehicle Pickup & Insurance Documents
exports.createAppointment = async (req, res) => {
  const customerId = req.user.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  const {
    vehicle_id,
    service_type,
    booking_date,
    preferred_time_slot,
    problem_description,
    odometer_reading,
    pickup_required,
    flat_building,
    street,
    area,
    city,
    state,
    pincode,
    instructions
  } = req.body;

  if (!vehicle_id || !service_type || !booking_date) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle, Service Type, and Preferred Date are required.'
    });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify vehicle belongs to customer
    const vehResult = await client.query(
      `SELECT v.vehicle_id, v.registration_no, v.brand, v.model, c.name AS customer_name, c.phone AS customer_phone
       FROM vehicles v
       JOIN customers c ON v.customer_id = c.customer_id
       WHERE v.vehicle_id = $1 AND v.customer_id = $2`,
      [vehicle_id, customerId]
    );

    if (vehResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Unauthorized: Vehicle does not belong to your account.' });
    }

    const vehicle = vehResult.rows[0];
    const isPickupRequired = pickup_required === true || pickup_required === 'true';

    // 2. Insert into service_bookings
    const bookingRes = await client.query(
      `INSERT INTO service_bookings (
        vehicle_id, booking_date, problem_description, service_type, status,
        preferred_time_slot, odometer_reading, pickup_required
       ) VALUES ($1, $2, $3, $4, 'Pending', $5, $6, $7)
       RETURNING *`,
      [
        vehicle_id,
        booking_date,
        problem_description || 'General Service',
        service_type,
        preferred_time_slot || 'Morning (9:00 AM - 12:00 PM)',
        odometer_reading ? parseInt(odometer_reading, 10) : null,
        isPickupRequired
      ]
    );

    const booking = bookingRes.rows[0];
    const bookingId = booking.booking_id;

    // Update vehicle mileage if odometer_reading supplied
    if (odometer_reading && parseInt(odometer_reading, 10) > 0) {
      await client.query(
        `UPDATE vehicles SET mileage = GREATEST(mileage, $1) WHERE vehicle_id = $2`,
        [parseInt(odometer_reading, 10), vehicle_id]
      );
    }

    // 3. Insert Pickup Request details if pickup requested
    let pickupDetails = null;
    if (isPickupRequired) {
      const fullAddressParts = [flat_building, street, area, city, state, pincode].filter(Boolean);
      const fullAddress = fullAddressParts.join(', ') || 'Address Provided on Call';

      const pickupRes = await client.query(
        `INSERT INTO pickup_requests (
          booking_id, flat_building, street, area, city, state, pincode, full_address, instructions, pickup_status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Requested')
         RETURNING *`,
        [
          bookingId,
          flat_building || '',
          street || '',
          area || '',
          city || 'Hyderabad',
          state || 'Telangana',
          pincode || '',
          fullAddress,
          instructions || ''
        ]
      );
      pickupDetails = pickupRes.rows[0];

      // 4. Create Service Center In-App Notification
      await client.query(
        `INSERT INTO notifications (recipient_role, title, message, booking_id)
         VALUES ('service_center', $1, $2, $3)`,
        [
          '🔔 New Vehicle Pickup Request',
          `Customer ${vehicle.customer_name} requested vehicle pickup for ${vehicle.registration_no} (${vehicle.brand} ${vehicle.model}). Address: ${fullAddress}`,
          bookingId
        ]
      );
    }

    // 5. Store Uploaded Insurance Documents
    const savedDocs = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const docRes = await client.query(
          `INSERT INTO insurance_documents (
            booking_id, customer_id, original_filename, stored_filename, file_path, file_size, mime_type
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING document_id, original_filename, file_size, mime_type, uploaded_at`,
          [
            bookingId,
            customerId,
            file.originalname,
            file.filename,
            file.path,
            file.size,
            file.mimetype
          ]
        );
        savedDocs.push(docRes.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Service Appointment Requested Successfully!',
      booking: {
        booking_id: bookingId,
        booking_code: `#BK${String(bookingId).padStart(4, '0')}`,
        vehicle_reg: vehicle.registration_no,
        vehicle_model: `${vehicle.brand} ${vehicle.model}`,
        service_type,
        booking_date,
        preferred_time_slot: booking.preferred_time_slot,
        pickup_required: isPickupRequired,
        pickup_status: pickupDetails ? pickupDetails.pickup_status : 'N/A',
        pickup_address: pickupDetails ? pickupDetails.full_address : null,
        insurance_documents_count: savedDocs.length,
        insurance_documents: savedDocs
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating appointment:', err);
    res.status(500).json({ success: false, message: 'Error booking appointment.', error: err.message });
  } finally {
    client.release();
  }
};

// Customer Fetches Their Own Appointments
exports.getMyAppointments = async (req, res) => {
  const customerId = req.user.customerId;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'No associated customer record found.' });
  }

  try {
    const result = await db.query(
      `SELECT sb.booking_id, sb.booking_date, sb.service_type, sb.problem_description,
              sb.status AS service_status, sb.preferred_time_slot, sb.odometer_reading, sb.pickup_required,
              v.vehicle_id, v.registration_no, v.brand, v.model, v.fuel_type,
              pr.pickup_id, pr.flat_building, pr.street, pr.area, pr.city, pr.state, pr.pincode,
              pr.full_address AS pickup_address, pr.instructions AS pickup_instructions, pr.pickup_status,
              COALESCE(
                json_agg(
                  json_build_object(
                    'document_id', doc.document_id,
                    'original_filename', doc.original_filename,
                    'file_size', doc.file_size,
                    'mime_type', doc.mime_type,
                    'uploaded_at', doc.uploaded_at
                  )
                ) FILTER (WHERE doc.document_id IS NOT NULL), '[]'
              ) AS insurance_documents
       FROM service_bookings sb
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       LEFT JOIN pickup_requests pr ON sb.booking_id = pr.booking_id
       LEFT JOIN insurance_documents doc ON sb.booking_id = doc.booking_id
       WHERE v.customer_id = $1
       GROUP BY sb.booking_id, v.vehicle_id, pr.pickup_id
       ORDER BY sb.booking_date DESC, sb.booking_id DESC`,
      [customerId]
    );

    res.json({ success: true, count: result.rows.length, appointments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving appointments.', error: err.message });
  }
};

// Get Single Appointment Details
exports.getAppointmentById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT sb.*,
              v.registration_no, v.brand, v.model, v.fuel_type, v.manufacturing_year, v.mileage,
              c.customer_id, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.address AS customer_address,
              pr.pickup_id, pr.flat_building, pr.street, pr.area, pr.city, pr.state, pr.pincode,
              pr.full_address AS pickup_address, pr.instructions AS pickup_instructions, pr.pickup_status,
              COALESCE(
                json_agg(
                  json_build_object(
                    'document_id', doc.document_id,
                    'original_filename', doc.original_filename,
                    'file_size', doc.file_size,
                    'mime_type', doc.mime_type,
                    'uploaded_at', doc.uploaded_at
                  )
                ) FILTER (WHERE doc.document_id IS NOT NULL), '[]'
              ) AS insurance_documents
       FROM service_bookings sb
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       JOIN customers c ON v.customer_id = c.customer_id
       LEFT JOIN pickup_requests pr ON sb.booking_id = pr.booking_id
       LEFT JOIN insurance_documents doc ON sb.booking_id = doc.booking_id
       WHERE sb.booking_id = $1
       GROUP BY sb.booking_id, v.vehicle_id, c.customer_id, pr.pickup_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const appt = result.rows[0];

    // Security check: If customer, ensure appointment belongs to them
    if (req.user.role === 'customer' && appt.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Access Denied: Appointment does not belong to you.' });
    }

    res.json({ success: true, appointment: appt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving appointment.', error: err.message });
  }
};

// Service Center Updates Pickup Status
exports.updatePickupStatus = async (req, res) => {
  const { id } = req.params;
  const { pickup_status } = req.body;

  const validStatuses = ['Requested', 'Accepted', 'Pickup Scheduled', 'Picked Up', 'Rejected'];
  if (!validStatuses.includes(pickup_status)) {
    return res.status(400).json({ success: false, message: `Invalid pickup status. Allowed: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await db.query(
      `UPDATE pickup_requests
       SET pickup_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $2
       RETURNING *`,
      [pickup_status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No pickup request found for this booking.' });
    }

    // Auto-update main booking status to 'In Progress' if vehicle picked up
    if (pickup_status === 'Picked Up') {
      await db.query(
        `UPDATE service_bookings SET status = 'In Progress' WHERE booking_id = $1 AND status = 'Pending'`,
        [id]
      );
    }

    res.json({
      success: true,
      message: `Pickup status updated to '${pickup_status}'!`,
      pickup: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating pickup status.', error: err.message });
  }
};

// Service Center Updates Main Booking Status
exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid service status. Allowed: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await db.query(
      `UPDATE service_bookings
       SET status = $1
       WHERE booking_id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    res.json({
      success: true,
      message: `Service status updated to '${status}'!`,
      booking: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating booking status.', error: err.message });
  }
};

// Service Center Fetches All Pickup Requests
exports.getPickupRequests = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pr.*,
              sb.booking_date, sb.service_type, sb.problem_description, sb.status AS service_status, sb.preferred_time_slot,
              v.registration_no, v.brand, v.model, v.vehicle_id,
              c.customer_id, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
              COALESCE(
                json_agg(
                  json_build_object(
                    'document_id', doc.document_id,
                    'original_filename', doc.original_filename,
                    'file_size', doc.file_size,
                    'mime_type', doc.mime_type
                  )
                ) FILTER (WHERE doc.document_id IS NOT NULL), '[]'
              ) AS insurance_documents
       FROM pickup_requests pr
       JOIN service_bookings sb ON pr.booking_id = sb.booking_id
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       JOIN customers c ON v.customer_id = c.customer_id
       LEFT JOIN insurance_documents doc ON sb.booking_id = doc.booking_id
       GROUP BY pr.pickup_id, sb.booking_id, v.vehicle_id, c.customer_id
       ORDER BY pr.created_at DESC`
    );

    res.json({ success: true, count: result.rows.length, pickup_requests: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching pickup requests.', error: err.message });
  }
};

// View/Download Insurance Document File (Secured)
exports.getInsuranceDocument = async (req, res) => {
  const { id, documentId } = req.params;

  try {
    const result = await db.query(
      `SELECT doc.*, sb.vehicle_id, v.customer_id
       FROM insurance_documents doc
       JOIN service_bookings sb ON doc.booking_id = sb.booking_id
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       WHERE doc.booking_id = $1 AND doc.document_id = $2`,
      [id, documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insurance document not found.' });
    }

    const doc = result.rows[0];

    // Security Check: Authorized user role ('service_center') OR the owning customer
    if (req.user.role === 'customer' && doc.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to document.' });
    }

    const filePath = doc.file_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file missing on server disk.' });
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${doc.original_filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error accessing document.', error: err.message });
  }
};

// Delete Insurance Document
exports.deleteInsuranceDocument = async (req, res) => {
  const { id, documentId } = req.params;

  try {
    const result = await db.query(
      `SELECT doc.*, v.customer_id
       FROM insurance_documents doc
       JOIN service_bookings sb ON doc.booking_id = sb.booking_id
       JOIN vehicles v ON sb.vehicle_id = v.vehicle_id
       WHERE doc.booking_id = $1 AND doc.document_id = $2`,
      [id, documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = result.rows[0];

    if (req.user.role === 'customer' && doc.customer_id !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete document.' });
    }

    // Delete DB record
    await db.query('DELETE FROM insurance_documents WHERE document_id = $1', [documentId]);

    // Delete file from disk
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    res.json({ success: true, message: 'Insurance document removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting document.', error: err.message });
  }
};

// In-App Notifications Controller
exports.getNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications
       WHERE recipient_role = 'service_center'
       ORDER BY created_at DESC LIMIT 50`
    );
    const unreadCount = result.rows.filter(n => !n.is_read).length;

    res.json({ success: true, count: result.rows.length, unread_count: unreadCount, notifications: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching notifications.', error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE notification_id = $1', [id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error marking notification read.', error: err.message });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = TRUE WHERE recipient_role = 'service_center'");
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error clearing notifications.', error: err.message });
  }
};
