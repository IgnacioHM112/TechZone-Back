const express = require('express');
const router = express.Router();
const { handleChatMessage, handleResetChat } = require('../controllers/chatbotController');

router.post('/', handleChatMessage);
router.post('/reset', handleResetChat);

module.exports = router;