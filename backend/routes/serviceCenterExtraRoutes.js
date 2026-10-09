const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Service Center Pickup Requests List
router.get('/pickup-requests', verifyToken, requireRole('service_center'), appointmentController.getPickupRequests);

// Service Center Notifications
router.get('/notifications', verifyToken, requireRole('service_center'), appointmentController.getNotifications);
router.put('/notifications/:id/read', verifyToken, requireRole('service_center'), appointmentController.markNotificationRead);
router.put('/notifications/read-all', verifyToken, requireRole('service_center'), appointmentController.markAllNotificationsRead);

module.exports = router;
