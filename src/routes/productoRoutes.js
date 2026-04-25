const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Función de seguridad para principiantes (evita que el servidor se caiga si falta una función)
const safe = (fn, name) => {
    if (typeof fn !== 'function') {
        return (req, res) => res.status(500).json({ error: `La función "${name}" no existe en el controlador.` });
    }
    return fn;
};

// --- RUTAS DEL CRUD COMPLETO ---

// LEER TODO
router.get('/', safe(productoController.getProductos, 'getProductos'));

// CREAR
router.post('/', safe(productoController.crearProducto, 'crearProducto'));

// ACTUALIZAR / EDITAR
router.put('/:id', safe(productoController.actualizarProducto, 'actualizarProducto'));

// ELIMINAR
router.delete('/:id', safe(productoController.eliminarProducto, 'eliminarProducto'));

// --- RUTAS DE GESTIÓN EXTRA ---
router.get('/historial', safe(productoController.verHistorial, 'verHistorial'));
router.get('/historial/:id', safe(productoController.verDetalleVenta, 'verDetalleVenta'));

module.exports = router;