const express = require('express');
const router = express.Router();
const { handleChatMessage, handleResetChat, handleEmailReply } = require('../controllers/chatbotController');
const { resolveUser } = require('../middlewares/authMiddleware');

router.post('/', resolveUser, handleChatMessage);
router.post('/reset', handleResetChat);
router.post('/email', resolveUser, handleEmailReply);

module.exports = router;