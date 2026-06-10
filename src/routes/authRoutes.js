const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// RUTAS PÚBLICAS
router.post('/register', authController.register);
router.post('/login', authController.login);

// RUTA PROTEGIDA (Perfil propio)
router.get('/profile', verifyToken, authController.getProfile);

// RUTAS DE ADMINISTRADOR
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);
router.delete('/users/:id', verifyToken, isAdmin, authController.deleteUser);

module.exports = router;
