const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// RUTAS PÚBLICAS
router.get('/', productController.getAll);
router.get('/:id', productController.getOne);

// RUTAS PROTEGIDAS (Solo Admin)
// upload.single('image') espera un campo llamado 'image' en el FormData
router.post('/', verifyToken, isAdmin, upload.single('image'), productController.create);
router.put('/:id', verifyToken, isAdmin, upload.single('image'), productController.update);
router.delete('/:id', verifyToken, isAdmin, productController.delete);

module.exports = router;
