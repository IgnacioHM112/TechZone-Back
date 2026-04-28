const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Ahora responderá tanto en /api/chatbot como en /api/chatbot/chat para mayor compatibilidad
router.post('/', chatbotController.chat);
router.post('/chat', chatbotController.chat);

module.exports = router;
