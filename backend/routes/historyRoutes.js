const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

router.get('/view', historyController.getServiceHistoryView);
router.get('/:registrationNumber', historyController.getVehicleServiceHistory);

module.exports = router;
