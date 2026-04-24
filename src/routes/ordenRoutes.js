const express = require('express');
const router = express.Router();
// Importamos la función usando llaves para que coincida con el controlador
const { crearOrden } = require('../controllers/ordenController');
const verificarToken = require('../middlewares/authMiddleware');

// Definimos la ruta POST protegida por el token
router.post('/', verificarToken, crearOrden);

module.exports = router;