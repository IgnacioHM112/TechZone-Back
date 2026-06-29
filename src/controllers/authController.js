const User = require('../models/user');
const Role = require('../models/role');
const Order = require('../models/order');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sendResetPasswordEmail } = require('../services/emailService');

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

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email'],
            include: [
                { model: Role, as: 'role', attributes: ['name'] },
                { 
                    model: Order, 
                    as: 'orders', 
                    attributes: ['id', 'total', 'status', 'created_at'],
                    separate: true,
                    order: [['created_at', 'DESC']]
                }
            ]
        });

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role ? user.role.name : 'sin rol',
            orders: user.orders.map(order => ({
                id: order.id,
                total: parseFloat(order.total),
                status: order.status,
                date: order.created_at
            }))
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('❌ Error al obtener lista de usuarios:', error);
        res.status(500).json({ mensaje: "Error al obtener usuarios", error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Evitar que el admin se borre a sí mismo (opcional pero recomendado)
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ mensaje: "No puedes eliminar tu propia cuenta de administrador" });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        await user.destroy();
        console.log(`🗑️ Usuario eliminado por admin: (ID: ${id})`);
        res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        res.status(500).json({ mensaje: "Error al eliminar usuario", error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ mensaje: "El correo electrónico es requerido" });
        }

        const user = await User.findOne({ where: { email } });
        
        // Mensaje genérico de éxito por seguridad, pero en desarrollo podemos dar más detalles
        const genericSuccessMessage = "Si el correo electrónico ingresado está registrado en nuestro sistema, recibirás un mensaje con las instrucciones para restablecer tu contraseña.";

        if (!user) {
            console.warn(`⚠️ Intento de recuperación fallido: Email no registrado: ${email}`);
            // Retornamos 200 con mensaje genérico por seguridad (para evitar enumeración de usuarios en prod)
            return res.status(200).json({ mensaje: genericSuccessMessage });
        }

        // Generar token único y seguro
        const token = crypto.randomBytes(20).toString('hex');
        
        // Configurar expiración a 1 hora a partir de ahora
        const expirationDate = new Date(Date.now() + 3600000);

        // Guardar token y expiración en el usuario
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expirationDate;
        await user.save();

        // Intentar obtener el origen de la petición (por ejemplo, https://xxxx.ngrok-free.dev o http://localhost:5173)
        let frontendUrl = req.headers.origin;
        if (!frontendUrl && req.headers.referer) {
            try {
                const url = new URL(req.headers.referer);
                frontendUrl = `${url.protocol}//${url.host}`;
            } catch (e) {
                // Silencioso
            }
        }

        // Enviar correo
        const emailResult = await sendResetPasswordEmail(user.email, user.name, token, frontendUrl);

        console.log(`✅ Solicitud de recuperación procesada para ${email}`);

        // Si se simuló el envío, devolvemos el enlace/token en la respuesta HTTP para facilitar el desarrollo local del front
        if (emailResult.simulated) {
            return res.status(200).json({
                mensaje: genericSuccessMessage + " (Simulación de desarrollo activa)",
                dev_info: {
                    simulated: true,
                    resetUrl: emailResult.resetUrl,
                    token: emailResult.token
                }
            });
        }

        res.status(200).json({ mensaje: genericSuccessMessage });

    } catch (error) {
        console.error('❌ Error crítico en forgotPassword:', error);
        res.status(500).json({ mensaje: "Error al procesar la solicitud de recuperación", error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return res.status(400).json({ mensaje: "Todos los campos son requeridos (token, password, confirmPassword)" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ mensaje: "Las contraseñas no coinciden" });
        }

        // Buscar al usuario con el token y validar que no haya expirado
        const user = await User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            console.warn(`⚠️ Intento de restablecimiento fallido: Token inválido o expirado: ${token}`);
            return res.status(400).json({ mensaje: "El enlace de recuperación es inválido o ha expirado" });
        }

        // Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Actualizar contraseña y limpiar campos de recuperación
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        console.log(`✅ Contraseña restablecida con éxito para el usuario ID: ${user.id}`);
        res.status(200).json({ mensaje: "Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña." });

    } catch (error) {
        console.error('❌ Error crítico en resetPassword:', error);
        res.status(500).json({ mensaje: "Error al restablecer la contraseña", error: error.message });
    }
};

module.exports = { register, login, getProfile, getAllUsers, deleteUser, forgotPassword, resetPassword };