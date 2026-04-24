const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        // SI NO TENÉS EL RETURN, NO SE FRENA.
        return res.status(403).json({ message: 'Acceso denegado' }); 
    }

    try {
        const cifrado = jwt.verify(token, 'clave_secreta_techzone');
        req.usuario = cifrado;
        next(); 
    } catch (error) {
        // ACÁ TAMBIÉN VA EL RETURN
        return res.status(401).json({ message: 'Token no válido' });
    }
};

module.exports = verificarToken;