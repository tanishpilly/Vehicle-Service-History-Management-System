const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/', vehicleController.getVehicles);
router.get('/customer/:customerId', vehicleController.getVehiclesByCustomer);
router.get('/:id', vehicleController.getVehicleById);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
