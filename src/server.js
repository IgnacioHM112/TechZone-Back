require('dotenv').config();

const express = require('express');
const cors = require('cors'); // 1. Agregamos CORS para que tus compañeros puedan conectarse
const db = require('./config/db'); 
const productoRoutes = require('./routes/productoRoutes'); // 2. Importamos las rutas nuevas
const usuarioRoutes = require('./routes/usuarioRoutes');
const app = express();
const PORT = process.env.PORT || 3000;
const ordenRoutes = require('./routes/ordenRoutes');

// --- MIDDLEWARES (Funciones de paso) ---
app.use(cors()); // Permite peticiones desde otros dominios (el frontend de Nico/Ramiro)
app.use(express.json()); // Permite que el servidor entienda cuando le enviamos datos en formato JSON

// --- RUTAS ---
// Aquí le decimos: "Toda ruta que empiece con /api/productos, usá el archivo productoRoutes"
app.use('/api/productos', productoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/ordenes', ordenRoutes);

// --- PRUEBA DE CONEXIÓN (Lo que ya tenías) ---
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