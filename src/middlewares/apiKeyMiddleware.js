require('dotenv').config();

const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
        return res.status(401).json({
            success: false,
            mensaje: "Acceso denegado: API Key inválida o ausente."
        });
    }
    
    next();
};

module.exports = apiKeyMiddleware;
