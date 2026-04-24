const db = require('../config/db');

const Usuario = {
    // Función para guardar un usuario nuevo
    create: async (datos) => {
        const query = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
        // El rol por defecto es 'cliente' si no se envía
        const values = [datos.nombre, datos.email, datos.password, datos.rol || 'cliente'];
        const [result] = await db.query(query, values);
        return result.insertId;
    },

    // Función para buscar un usuario por email (servirá para el Login después)
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        return rows[0];
    }
};

module.exports = Usuario;