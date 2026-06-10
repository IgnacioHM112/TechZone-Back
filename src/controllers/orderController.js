require('dotenv').config();
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const Product = require('../models/product');
const User = require('../models/user');
const { preference } = require('../config/mercadopago');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const sequelize = require('../config/database');
const { generateOrderPDF } = require('../utils/pdfGenerator');

// Inicializar cliente de MP para consultas directas (usado en webhook)
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

/**
 * Función auxiliar para completar una orden (Stock, PDF)
 * Se puede llamar desde el confirm manual o desde el webhook automático
 */
const processOrderCompletion = async (order_id, payment_id, transactionHost = null) => {
    const t = transactionHost || await sequelize.transaction();
    try {
        const order = await Order.findByPk(order_id, {
            include: [
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                { model: User, as: 'user', attributes: ['name', 'email'] }
            ],
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!order) throw new Error("Orden no encontrada");
        
        // Si ya está completada, devolvemos la orden directamente (ya tiene PDF y stock descontado)
        if (order.status === 'completed') {
            if (!transactionHost) await t.rollback();
            return order;
        }

        // Descontar Stock
        for (const item of order.items) {
            const product = await Product.findByPk(item.product_id, { transaction: t, lock: t.LOCK.UPDATE });
            if (!product || product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para: ${product ? product.name : 'Producto ID ' + item.product_id}`);
            }
            await product.update({ stock: product.stock - item.quantity }, { transaction: t });
        }

        // Generar PDF (Binario)
        const pdfBuffer = await generateOrderPDF(order);

        // Actualizar orden con estado y binario del PDF
        await order.update({ 
            status: 'completed',
            payment_id: String(payment_id),
            pdf_data: pdfBuffer
        }, { transaction: t });

        // Vaciar carrito
        const cart = await Cart.findOne({ where: { user_id: order.user_id }, transaction: t });
        if (cart) {
            await CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
        }

        if (!transactionHost) await t.commit();

        console.log(`✅ Orden #${order_id} procesada con éxito (Pago: ${payment_id})`);
        
        // Recargar la orden para asegurar que tenemos los datos finales post-commit y asociaciones frescas
        return await Order.findByPk(order_id, {
            include: [
                { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                { model: User, as: 'user', attributes: ['name', 'email'] }
            ]
        });

    } catch (error) {
        if (!transactionHost && t) await t.rollback();
        console.error(`❌ Error en processOrderCompletion para Orden #${order_id}:`, error.message);
        throw error;
    }
};

const orderController = {
    createPreference: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const user_id = req.user.id;
            
            const user = await User.findByPk(user_id);
            if (!user) {
                await t.rollback();
                return res.status(404).json({ mensaje: "Usuario no encontrado" });
            }

            const cart = await Cart.findOne({
                where: { user_id },
                include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
            });

            if (!cart || !cart.items || cart.items.length === 0) {
                await t.rollback();
                return res.status(400).json({ mensaje: "El carrito está vacío" });
            }

            let total = 0;
            const mpItems = cart.items.map(item => {
                const unitPrice = parseFloat(item.unit_price);
                total += Number(item.quantity) * unitPrice;
                return {
                    id: String(item.product.id),
                    title: item.product.name,
                    quantity: Number(item.quantity),
                    unit_price: unitPrice,
                    currency_id: 'ARS'
                };
            });

            const newOrder = await Order.create({
                user_id,
                total: parseFloat(total.toFixed(2)),
                status: 'pending'
            }, { transaction: t });

            const orderItemsData = cart.items.map(item => ({
                order_id: newOrder.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.unit_price
            }));
            await OrderItem.bulkCreate(orderItemsData, { transaction: t });

            const successUrl = process.env.MP_SUCCESS_URL?.trim();
            const failureUrl = process.env.MP_FAILURE_URL?.trim();

            if (!successUrl || !failureUrl) {
                throw new Error("URLs de retorno no configuradas en el .env");
            }

            const finalSuccessUrl = successUrl.includes('?') 
                ? `${successUrl}&order_id=${newOrder.id}` 
                : `${successUrl}?order_id=${newOrder.id}`;

            const nameParts = user.name.trim().split(' ');
            const firstName = nameParts[0] || 'Usuario';
            const lastName = nameParts.slice(1).join(' ') || 'TechZone';

            const response = await preference.create({
                body: {
                    items: mpItems,
                    back_urls: { 
                        success: finalSuccessUrl, 
                        failure: failureUrl, 
                        pending: failureUrl 
                    },
                    external_reference: String(newOrder.id),
                    notification_url: process.env.WEBHOOK_URL, // IMPORTANTE: URL pública para el Webhook
                    auto_return: "approved",
                    payer: {
                        name: firstName,
                        surname: lastName,
                        email: user.email
                    }
                }
            });

            await newOrder.update({ preference_id: response.id }, { transaction: t });
            await t.commit();
            
            console.log(`✅ Preferencia creada: ${response.id} | Order: ${newOrder.id}`);
            res.json({ id: response.id, init_point: response.init_point, order_id: newOrder.id });

        } catch (error) {
            if (t) await t.rollback();
            console.error('❌ Error createPreference:', error);
            res.status(500).json({ mensaje: "Error al crear preferencia", error: error.message });
        }
    },

    // Confirmación manual (desde el frontend al volver de MP)
    confirmPayment: async (req, res) => {
        try {
            const { order_id, payment_id } = req.body;
            if (!order_id || !payment_id) {
                return res.status(400).json({ mensaje: "Faltan datos de orden o pago" });
            }

            const order = await processOrderCompletion(order_id, payment_id);
            
            // Mapear respuesta según requerimiento exacto del usuario
            const response = {
                id: order.id,
                createdAt: order.created_at,
                total_amount: parseFloat(order.total),
                OrderItems: order.items.map(item => ({
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    Product: {
                        name: item.product ? item.product.name : 'Producto no encontrado'
                    }
                }))
            };

            res.json(response);
        } catch (error) {
            console.error('❌ Error en confirmPayment:', error.message);
            res.status(500).json({ mensaje: "Error al confirmar pago", error: error.message });
        }
    },

    // Webhook automático de Mercado Pago (Public)
    handleWebhook: async (req, res) => {
        try {
            const { type, data } = req.body;
            console.log(`📩 Webhook recibido: Tipo=${type}, ID=${data?.id}`);

            if (type === 'payment' && data?.id) {
                // Consultar estado del pago a MP
                const mpPayment = await payment.get({ id: data.id });
                
                if (mpPayment.status === 'approved') {
                    const order_id = mpPayment.external_reference;
                    console.log(`💰 Pago aprobado por MP para Orden #${order_id}. Iniciando procesamiento automático...`);
                    
                    if (order_id) {
                        await processOrderCompletion(order_id, data.id);
                    }
                } else {
                    console.log(`ℹ️ Pago ${data.id} tiene estado: ${mpPayment.status}. No se procesa.`);
                }
            }

            // MP espera un 200 o 201 para confirmar recepción del webhook
            res.sendStatus(200);
        } catch (error) {
            console.error('❌ Error en handleWebhook:', error.message);
            res.sendStatus(200); 
        }
    },

    downloadPDF: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Buscamos la orden con sus relaciones por si necesitamos regenerar el PDF
            const order = await Order.findByPk(id, {
                include: [
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                    { model: User, as: 'user', attributes: ['name', 'email'] }
                ]
            });

            if (!order) {
                return res.status(404).json({ mensaje: "Orden no encontrada" });
            }

            if (order.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ mensaje: "No tienes permiso para descargar este comprobante" });
            }

            let pdfBuffer = order.pdf_data;

            // Lógica de Sincronización: Si la orden está completada pero el PDF no está en el blob
            // (puede pasar si la descarga se pide milisegundos después de la confirmación),
            // lo generamos al vuelo.
            if (!pdfBuffer && order.status === 'completed') {
                console.log(`⚠️ PDF no encontrado en DB para orden #${id} (completada). Generando al vuelo para evitar error de sincronización...`);
                pdfBuffer = await generateOrderPDF(order);
                // Opcional: Guardar en DB para futuras descargas rápidas
                await order.update({ pdf_data: pdfBuffer });
            }

            if (!pdfBuffer) {
                return res.status(404).json({ mensaje: "El comprobante aún no está disponible para esta orden" });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=comprobante_orden_${id}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('❌ Error en downloadPDF:', error.message);
            res.status(500).json({ mensaje: "Error al descargar el PDF", error: error.message });
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const user_id = req.user.id;
            const orders = await Order.findAll({
                where: { user_id },
                attributes: ['id', 'total', 'status', 'created_at'],
                include: [
                    {
                        model: OrderItem,
                        as: 'items',
                        attributes: ['quantity', 'price'],
                        include: [
                            {
                                model: Product,
                                as: 'product',
                                attributes: ['name']
                            }
                        ]
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            const formattedOrders = orders.map(order => ({
                id: order.id,
                total: parseFloat(order.total),
                status: order.status,
                date: order.created_at,
                items: order.items.map(item => ({
                    name: item.product ? item.product.name : 'Producto no disponible',
                    quantity: item.quantity,
                    price: parseFloat(item.price)
                }))
            }));

            res.json(formattedOrders);
        } catch (error) {
            console.error('❌ Error en getUserOrders:', error.message);
            res.status(500).json({ mensaje: "Error al obtener el historial de órdenes", error: error.message });
        }
    },

    getOrderDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const order = await Order.findByPk(id, {
                attributes: ['id', 'total', 'status', 'payment_id', 'user_id', 'created_at'],
                include: [
                    { 
                        model: OrderItem, 
                        as: 'items', 
                        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'image_url'] }] 
                    },
                    { model: User, as: 'user', attributes: ['name', 'email'] }
                ]
            });

            if (!order) return res.status(404).json({ mensaje: "Orden no encontrada" });

            if (order.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ mensaje: "No tienes permiso para ver esta orden" });
            }

            const responseData = order.toJSON();
            responseData.total = parseFloat(order.total);
            responseData.items = responseData.items.map(item => ({
                ...item,
                subtotal: parseFloat(item.price) * item.quantity
            }));

            res.json(responseData);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener detalles", error: error.message });
        }
    }
};

module.exports = orderController;
