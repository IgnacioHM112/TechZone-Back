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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/', (req, res) => {
    res.json({ mensaje: "API TechZone-Back corriendo con Pagos y Stock" });
});

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');
        
        // Sincronizar tablas - Usamos alter: true con precaución
        try {
            await sequelize.sync({ alter: true });
            console.log('✅ Tablas sincronizadas.');
        } catch (syncErr) {
            console.warn('⚠️ Advertencia en sincronización (posible conflicto de FK):', syncErr.message);
            // Si alter falla, intentamos sync normal para no bloquear el inicio
            await sequelize.sync();
        }
        
        await runSeeders();

        if (process.env.NODE_ENV !== 'test') {
            app.listen(PORT, () => {
                console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
            });
        }
    } catch (err) {
        console.error('❌ Error crítico al iniciar el servidor:', err);
    }
}

startServer();

module.exports = app;
