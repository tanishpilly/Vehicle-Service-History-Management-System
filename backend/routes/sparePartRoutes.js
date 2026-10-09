const express = require('express');
const router = express.Router();
const sparePartController = require('../controllers/sparePartController');

router.get('/', sparePartController.getSpareParts);
router.get('/low-stock', sparePartController.getLowStockParts);
router.post('/', sparePartController.createSparePart);
router.put('/:id', sparePartController.updateSparePart);

module.exports = router;
