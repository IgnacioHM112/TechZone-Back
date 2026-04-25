require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const productoRoutes = require('./routes/productoRoutes');
const ordenRoutes = require('./routes/ordenRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- RUTAS ---
// Solo tus rutas de productos y órdenes
app.use('/api/productos', productoRoutes);
app.use('/api/ordenes', ordenRoutes);

// --- PRUEBA DE CONEXIÓN ---
async function testConnection() {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        console.log('✅ Conexión a MySQL exitosa (TechStore DB)');
    } catch (err) {
        console.error('❌ Error conectando a la base de datos:', err);
    }
}

testConnection();

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});