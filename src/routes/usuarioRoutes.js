const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para el registro: POST /api/usuarios/registro
router.post('/registro', authController.registrar);
router.post('/login', authController.login);

module.exports = router;