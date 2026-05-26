require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const runSeeders = require('./database/seeders');

// Importar modelos
const User = require('./models/user');
const Role = require('./models/role');
const Category = require('./models/category');
const Product = require('./models/product');
const Cart = require('./models/cart');
const CartItem = require('./models/cartItem');
const Order = require('./models/order');
const OrderItem = require('./models/orderItem');

// Rutas
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const externalRoutes = require('./routes/externalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS más explícita para evitar bloqueos
app.use(cors({
    origin: '*', // En producción deberías restringirlo a tu dominio
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/external', externalRoutes);

// --- INTEGRACIÓN CON FRONTEND (Túnel Único Ngrok) ---
const proxy = require('express-http-proxy');

app.use('/', proxy('http://localhost:5173', {
    filter: (req) => !req.path.startsWith('/api'),
    proxyErrorHandler: (err, res, next) => {
        // Si el frontend no está iniciado, mostramos un mensaje de ayuda
        if (err.code === 'ECONNREFUSED') {
            return res.status(200).send(`
                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1>🚀 Backend de TechZone Listo</h1>
                    <p>El backend está funcionando correctamente. Para ver el frontend en esta URL, asegúrate de:</p>
                    <ol style="display: inline-block; text-align: left;">
                        <li>Ejecutar <code>npm run dev</code> en la carpeta de <strong>TechZone-Front</strong>.</li>
                        <li>Verificar que el front use el puerto 5173.</li>
                    </ol>
                    <p>Si quieres usar n8n o Make, usa esta misma URL de ngrok apuntando a <code>/api/...</code></p>
                </div>
            `);
        }
        next(err);
    }
}));

async function startServer() {
    console.log('⏳ Iniciando servidor...');
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');
        
        // Sincronizar tablas
        try {
            await sequelize.sync({ alter: true });
            console.log('✅ Tablas sincronizadas (alter: true).');
        } catch (syncErr) {
            console.warn('⚠️ Advertencia en sincronización (posible conflicto de FK):', syncErr.message);
            await sequelize.sync();
            console.log('✅ Tablas sincronizadas (normal).');
        }
        
        await runSeeders();
        console.log('✅ Semillas procesadas.');

        if (process.env.NODE_ENV !== 'test') {
            app.listen(PORT, () => {
                console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
            });
        }
    } catch (err) {
        console.error('❌ Error crítico al iniciar el servidor:', err);
    }
}

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

module.exports = { app, startServer };
