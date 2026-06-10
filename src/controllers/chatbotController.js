const { chatWithBot, resetChat } = require('../services/chatbotService');

const handleChatMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo "message" es requerido y debe ser un string no vacío.',
            });
        }

        const result = await chatWithBot(message, null, req.user);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({
            success: true,
            reply: result.message,
        });
    } catch (error) {
        console.error('Error en chatController:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

const handleResetChat = async (req, res) => {
    try {
        const result = resetChat();
        res.json(result);
    } catch (error) {
        console.error('Error en resetChatController:', error);
        res.status(500).json({
            success: false,
            message: 'Error al resetear el chat',
        });
    }
};

const handleEmailReply = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El campo "message" es requerido.',
            });
        }

        // Pasamos un array vacío si no hay historial para que sea "stateless"
        // y no use el historial global del chat de la web
        const result = await chatWithBot(message, history || [], req.user);

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.json({
            success: true,
            reply: result.message,
        });
    } catch (error) {
        console.error('Error en handleEmailReply:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
};

module.exports = {
    handleChatMessage,
    handleResetChat,
    handleEmailReply,
};