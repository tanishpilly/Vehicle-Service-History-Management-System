const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Customer Appointments
router.post(
  '/',
  verifyToken,
  requireRole('customer'),
  upload.array('insurance_docs', 5),
  appointmentController.createAppointment
);

router.get('/my-appointments', verifyToken, requireRole('customer'), appointmentController.getMyAppointments);

// Shared Appointment Detail & Document Access (Auth protected)
router.get('/:id', verifyToken, appointmentController.getAppointmentById);
router.get('/:id/insurance/:documentId', verifyToken, appointmentController.getInsuranceDocument);
router.delete('/:id/insurance/:documentId', verifyToken, appointmentController.deleteInsuranceDocument);

// Service Center Operations
router.put('/:id/status', verifyToken, requireRole('service_center'), appointmentController.updateBookingStatus);
router.put('/:id/pickup-status', verifyToken, requireRole('service_center'), appointmentController.updatePickupStatus);

module.exports = router;
