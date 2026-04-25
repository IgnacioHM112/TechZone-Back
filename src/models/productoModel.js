const db = require('../config/db');

const Producto = {
    // --- OBTENER TODOS LOS PRODUCTOS ---
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM productos');
        return rows;
    },

    // --- CREAR PRODUCTO (Incluye los 7 campos de tu DB) ---
    create: async (nuevo) => {
        const query = `
            INSERT INTO productos 
            (nombre, marca, descripcion, precio, stock, imagen_url, categoria_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            nuevo.nombre, 
            nuevo.marca, 
            nuevo.descripcion, 
            nuevo.precio, 
            nuevo.stock, 
            nuevo.imagen_url, 
            nuevo.categoria_id
        ];

        const [result] = await db.query(query, params);
        return result.insertId;
    },

    // --- ACTUALIZAR PRODUCTO ---
    update: async (id, datos) => {
        const query = `
            UPDATE productos 
            SET nombre=?, marca=?, descripcion=?, precio=?, stock=?, imagen_url=?, categoria_id=? 
            WHERE id=?`;
        
        const params = [
            datos.nombre, 
            datos.marca, 
            datos.descripcion, 
            datos.precio, 
            datos.stock, 
            datos.imagen_url, 
            datos.categoria_id, 
            id
        ];

        await db.query(query, params);
        return true;
    },

    // --- ELIMINAR PRODUCTO ---
    delete: async (id) => {
        await db.query('DELETE FROM productos WHERE id = ?', [id]);
        return true;
    },

    // --- CONSULTAS DE GESTIÓN (Para cuando Ramiro termine Usuarios) ---
    getHistorialVentas: async () => {
        const query = `
            SELECT o.id AS orden_id, u.nombre AS cliente, o.total, o.fecha 
            FROM ordenes o 
            JOIN usuarios u ON o.usuario_id = u.id 
            ORDER BY o.fecha DESC`;
        const [rows] = await db.query(query);
        return rows;
    },

    getDetalleOrden: async (ordenId) => {
        const query = `
            SELECT d.producto_id, p.nombre, d.cantidad, d.precio_unitario
            FROM detalle_ordenes d
            JOIN productos p ON d.producto_id = p.id
            WHERE d.orden_id = ?`;
        const [rows] = await db.query(query, [ordenId]);
        return rows;
    }
};

module.exports = Producto;