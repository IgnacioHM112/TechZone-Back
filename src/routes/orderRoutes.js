const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

// RUTA PÚBLICA (Mercado Pago Webhooks no llevan Bearer Token)
router.post('/webhook', orderController.handleWebhook);

// RUTAS PROTEGIDAS
router.use(verifyToken);

router.post('/create-preference', orderController.createPreference);
router.post('/confirm', orderController.confirmPayment);
router.get('/:id', orderController.getOrderDetails);
router.get('/:id/download', orderController.downloadPDF);

module.exports = router;
