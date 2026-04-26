const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// RUTAS PÚBLICAS
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getOne);

// RUTAS PROTEGIDAS (Solo Admin)
router.post('/', verifyToken, isAdmin, categoryController.create);
router.put('/:id', verifyToken, isAdmin, categoryController.update);
router.delete('/:id', verifyToken, isAdmin, categoryController.delete);

module.exports = router;
