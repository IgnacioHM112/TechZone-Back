const Producto = require('../models/productoModel');

const getProductos = async (req, res) => {
    try {
        const productos = await Producto.getAll();
        res.json(productos);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const crearProducto = async (req, res) => {
    try {
        const id = await Producto.create(req.body);
        res.status(201).json({ message: 'Creado', id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const actualizarProducto = async (req, res) => {
    try {
        await Producto.update(req.params.id, req.body);
        res.json({ message: 'Actualizado correctamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const eliminarProducto = async (req, res) => {
    try {
        await Producto.delete(req.params.id);
        res.json({ message: 'Eliminado correctamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const verHistorial = async (req, res) => {
    try {
        const historial = await Producto.getHistorialVentas();
        res.json(historial);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const verDetalleVenta = async (req, res) => {
    try {
        const detalles = await Producto.getDetalleOrden(req.params.id);
        res.json(detalles);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// EXPORTACIÓN ÚNICA (Asegúrate de borrar cualquier otro module.exports arriba)
module.exports = {
    getProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    verHistorial,
    verDetalleVenta
};