const express = require('express');
const router = express.Router();
const serviceRecordController = require('../controllers/serviceRecordController');

router.get('/', serviceRecordController.getServiceRecords);
router.get('/:id', serviceRecordController.getServiceRecordById);
router.post('/', serviceRecordController.createServiceRecord);

module.exports = router;
