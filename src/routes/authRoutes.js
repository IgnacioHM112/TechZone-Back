const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// RUTAS PÚBLICAS
router.post('/register', authController.register);
router.post('/login', authController.login);

// RUTA PROTEGIDA (Ejemplo de perfil)
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
