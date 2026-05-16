const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');

// Aplicamos el middleware de API Key a todas las rutas de este archivo
router.use(apiKeyMiddleware);

// Endpoint de solo lectura para automatizaciones externas (Make, etc.)
router.get('/stock-check', externalController.getStockCheck);

module.exports = router;
