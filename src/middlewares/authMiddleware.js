const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: "Acceso denegado. No hay token." });
    }

    try {
        // Usamos la clave del .env o una fija para pruebas
        const secret = process.env.JWT_SECRET || '123456789';
        const decoded = jwt.verify(token, secret);
        req.usuario = decoded;
        next();
    } catch (error) {
        // Este es el error 403 que estás viendo ahora
        return res.status(403).json({ mensaje: "Token inválido o expirado." });
    }
};

module.exports = { verificarToken };