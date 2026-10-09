const express = require('express');
const router = express.Router();
const customerPortalController = require('../controllers/customerPortalController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All routes here require logged-in user with role='customer'
router.use(verifyToken, requireRole('customer'));

router.get('/profile', customerPortalController.getProfile);
router.put('/profile', customerPortalController.updateProfile);

router.get('/vehicles', customerPortalController.getMyVehicles);
router.post('/vehicles', customerPortalController.addMyVehicle);

router.get('/bookings', customerPortalController.getMyBookings);
router.post('/bookings', customerPortalController.createBooking);

router.get('/history', customerPortalController.getMyServiceHistory);
router.get('/invoices', customerPortalController.getMyInvoices);

module.exports = router;
