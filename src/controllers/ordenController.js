const db = require('../config/db');

// Obtener todas las órdenes
const obtenerOrdenes = async (req, res) => {
    try {
        // Ajustá 'ordenes' al nombre real de tu tabla en MySQL
        const [rows] = await db.query('SELECT * FROM ordenes'); 
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener órdenes", error: error.message });
    }
};

// Crear una nueva orden
const crearOrden = async (req, res) => {
    try {
        const { total, productos } = req.body;
        // Aquí iría tu lógica de INSERT
        res.status(201).json({ mensaje: "Orden creada con éxito (Simulado)" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al crear orden", error: error.message });
    }
};

// Obtener orden por ID
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