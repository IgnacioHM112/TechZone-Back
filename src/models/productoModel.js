const db = require('../config/db');

const Producto = {
    // --- CRUD DE PRODUCTOS ---
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM productos');
        return rows;
    },
    create: async (nuevo) => {
        const query = 'INSERT INTO productos (nombre, marca, descripcion, precio, stock, imagen_url, categoria_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [nuevo.nombre, nuevo.marca, nuevo.descripcion, nuevo.precio, nuevo.stock, nuevo.imagen_url, nuevo.categoria_id]);
        return result.insertId;
    },
    update: async (id, datos) => {
        const query = 'UPDATE productos SET nombre=?, marca=?, descripcion=?, precio=?, stock=?, imagen_url=?, categoria_id=? WHERE id=?';
        await db.query(query, [datos.nombre, datos.marca, datos.descripcion, datos.precio, datos.stock, datos.imagen_url, datos.categoria_id, id]);
        return true;
    },
    delete: async (id) => {
        await db.query('DELETE FROM productos WHERE id = ?', [id]);
        return true;
    },

    // --- PANEL DE ADMIN: ÓRDENES Y MÉTRICAS (HU-15) ---
    getHistorialVentas: async () => {
        const query = `
            SELECT o.id AS orden_id, u.nombre AS cliente, o.total, o.fecha, o.estado 
            FROM ordenes o 
            JOIN usuarios u ON o.usuario_id = u.id 
            ORDER BY o.fecha DESC`;
        const [rows] = await db.query(query);
        return rows;
    },
    getDetalleOrden: async (ordenId) => {
        const query = `
            SELECT d.producto_id, p.nombre, d.cantidad, d.precio_unitario, (d.cantidad * d.precio_unitario) AS subtotal
            FROM detalle_orden d
            JOIN productos p ON d.producto_id = p.id
            WHERE d.orden_id = ?`;
        const [rows] = await db.query(query, [ordenId]);
        return rows;
    },
    getMetricas: async () => {
        // Consulta para ventas totales y productos con poco stock (menos de 5 unidades)
        const [ventas] = await db.query('SELECT SUM(total) as totalVentas, COUNT(*) as totalOrdenes FROM ordenes WHERE estado = "pagada"');
        const [stockBajo] = await db.query('SELECT nombre, stock FROM productos WHERE stock < 5');
        return { resumen: ventas[0], alertasStock: stockBajo };
    }
};

module.exports = Producto;