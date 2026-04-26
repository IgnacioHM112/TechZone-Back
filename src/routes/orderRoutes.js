const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/create-preference', orderController.createPreference);
router.post('/confirm', orderController.confirmPayment);
router.get('/:id', orderController.getOrderDetails);
router.get('/:id/download', orderController.downloadPDF); // Nueva ruta para descarga

module.exports = router;
