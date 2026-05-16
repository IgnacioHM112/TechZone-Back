const express = require('express');
const router = express.Router();
const { handleChatMessage, handleResetChat, handleEmailReply } = require('../controllers/chatbotController');

router.post('/', handleChatMessage);
router.post('/reset', handleResetChat);
router.post('/email', handleEmailReply);

module.exports = router;