const User = require('../models/user');
const Role = require('../models/role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, roleName } = req.body;

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            console.warn(`⚠️ Intento de registro fallido: Contraseñas no coinciden para ${email}`);
            return res.status(400).json({ mensaje: "Las contraseñas no coinciden" });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.warn(`⚠️ Intento de registro fallido: Email ya registrado: ${email}`);
            return res.status(400).json({ mensaje: "El email ya está registrado" });
        }

        // Obtener el rol
        const targetRole = roleName || 'usuario';
        const role = await Role.findOne({ where: { name: targetRole } });
        if (!role) {
            console.error(`❌ Error en registro: Rol '${targetRole}' no encontrado en la base de datos`);
            return res.status(400).json({ mensaje: "Rol no válido" });
        }

        // Hashear password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear usuario
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            rol_id: role.id
        });

        console.log(`✅ Usuario registrado con éxito: ${email} (ID: ${newUser.id})`);
        res.status(201).json({ 
            mensaje: "Usuario registrado con éxito",
            userId: newUser.id 
        });

    } catch (error) {
        console.error('❌ Error crítico en registro:', error);
        res.status(500).json({ mensaje: "Error en el registro", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario con su rol
        const user = await User.findOne({ 
            where: { email },
            include: [{ model: Role, as: 'role' }]
        });

        if (!user) {
            console.warn(`⚠️ Intento de login fallido: Usuario no encontrado: ${email}`);
            return res.status(401).json({ mensaje: "Credenciales inválidas" });
        }

        // Verificar password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.warn(`⚠️ Intento de login fallido: Contraseña incorrecta para: ${email}`);
            return res.status(401).json({ mensaje: "Credenciales inválidas" });
        }

        // Generar Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role.name },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '8h' }
        );

        console.log(`✅ Login exitoso: ${email} (${user.role.name})`);
        res.json({
            mensaje: "Login exitoso",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name
            }
        });

    } catch (error) {
        console.error('❌ Error crítico en login:', error);
        res.status(500).json({ mensaje: "Error en el login", error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email'],
            include: [{ model: Role, as: 'role', attributes: ['name'] }]
        });
        res.json(user);
    } catch (error) {
        console.error('❌ Error al obtener perfil:', error);
        res.status(500).json({ mensaje: "Error al obtener perfil", error: error.message });
    }
};

module.exports = { register, login, getProfile };
