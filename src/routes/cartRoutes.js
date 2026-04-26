const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Todas las rutas de carrito requieren estar logueado
router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/add', cartController.addItem);
router.delete('/item/:item_id', cartController.removeItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;
