const db = require('../config/db');

const obtenerOrdenes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ordenes');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener órdenes", error: error.message });
    }
};

const crearOrden = async (req, res) => {
    try {
        const { usuario_id, total } = req.body; // El usuario_id lo mandamos manual por ahora
        const [result] = await db.query(
            'INSERT INTO ordenes (usuario_id, total) VALUES (?, ?)',
            [usuario_id, total]
        );
        res.status(201).json({ mensaje: "Orden registrada con éxito", orden_id: result.insertId });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al registrar la orden", error: error.message });
    }
};

const obtenerOrdenPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM ordenes WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ mensaje: "Orden no encontrada" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener la orden", error: error.message });
    }
};

module.exports = {
    obtenerOrdenes,
    crearOrden,
    obtenerOrdenPorId
};