const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Comentamos esto para que puedas trabajar sin depender del login de Ramiro
// const auth = require('../middlewares/authMiddleware');
// const verificarToken = auth.verificarToken || auth;

const safe = (fn, name) => {
    if (typeof fn !== 'function') return (req, res) => res.status(500).json({ error: `Función ${name} no definida` });
    return fn;
};

// Todas las rutas quedan públicas temporalmente para tu desarrollo
router.get('/', safe(productoController.obtenerProductos, 'obtenerProductos'));
router.get('/:id', safe(productoController.obtenerProductoPorId, 'obtenerProductoPorId'));
router.get('/admin/metricas', safe(productoController.obtenerMetricas, 'obtenerMetricas'));
router.post('/', safe(productoController.crearProducto, 'crearProducto'));
router.put('/:id', safe(productoController.actualizarProducto, 'actualizarProducto'));
router.delete('/:id', safe(productoController.eliminarProducto, 'eliminarProducto'));

module.exports = router;