const Usuario = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');

const registrar = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // 1. Encriptamos la contraseña (Hashing)
        // El 10 es el "costo" de procesamiento, un estándar seguro.
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // 2. Guardamos en la base de datos
        const nuevoId = await Usuario.create({
            nombre,
            email,
            password: passwordEncriptada
        });

        res.status(201).json({ message: 'Usuario registrado con éxito', id: nuevoId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
};

module.exports = { registrar };

const jwt = require('jsonwebtoken'); // Importante agregar esto arriba

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscamos si el usuario existe
        const usuario = await Usuario.findByEmail(email);
        if (!usuario) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        // 2. Comparamos la contraseña ingresada con la encriptada en BD
        const esValida = await bcrypt.compare(password, usuario.password);
        if (!esValida) {
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        // 3. Si todo está ok, generamos el Token (JWT)
        // Guardamos el ID y el ROL dentro del token
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            'clave_secreta_techzone', // En el futuro esto irá al .env
            { expiresIn: '2h' } // El token vence en 2 horas
        );

        res.json({ message: 'Login exitoso', token });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = { registrar, login }; // Exportamos ambas