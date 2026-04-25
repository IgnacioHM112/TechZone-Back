const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');
const auth = require('../middlewares/authMiddleware');

const verificarToken = auth.verificarToken || auth;

// Ayudante para evitar el TypeError
const safe = (fn, name) => {
    if (typeof fn !== 'function') {
        console.error(`🔴 ERROR: La función "${name}" no está definida en ordenController.js`);
        return (req, res) => res.status(500).json({ error: `Función ${name} no definida` });
    }
    return fn;
};

// RUTAS DE ÓRDENES
// La URL será: http://localhost:3000/api/ordenes
router.get('/', verificarToken, safe(ordenController.obtenerOrdenes, 'obtenerOrdenes'));
router.post('/', verificarToken, safe(ordenController.crearOrden, 'crearOrden'));
router.get('/:id', verificarToken, safe(ordenController.obtenerOrdenPorId, 'obtenerOrdenPorId'));

module.exports = router;