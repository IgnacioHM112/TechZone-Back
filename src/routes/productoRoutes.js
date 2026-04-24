const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const auth = require('../middlewares/authMiddleware'); 

// Si Ramiro exportó como objeto usa auth.verificarToken, si no usa auth directamente
const verificarToken = auth.verificarToken || auth;

// Rutas Públicas/Clientes
router.get('/', productoController.getProductos);

// Rutas de Admin (Protegidas)
router.post('/', verificarToken, productoController.crearProducto);
router.put('/:id', verificarToken, productoController.actualizarProducto);
router.delete('/:id', verificarToken, productoController.eliminarProducto);
router.get('/admin/historial', verificarToken, productoController.verHistorial);
router.get('/admin/orden/:id', verificarToken, productoController.verDetalleVenta);

module.exports = router;