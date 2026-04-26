require('dotenv').config();
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const Product = require('../models/product');
const User = require('../models/user');
const { preference } = require('../config/mercadopago');
const sequelize = require('../config/database');
const { generateOrderPDF } = require('../utils/pdfGenerator');

const orderController = {
    createPreference: async (req, res) => {
        const t = await sequelize.transaction();
        try {
            const user_id = req.user.id;
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
                total += item.quantity * item.unit_price;
                return {
                    id: String(item.product.id),
                    title: item.product.name,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    currency_id: 'ARS'
                };
            });

            const newOrder = await Order.create({
                user_id,
                total,
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

            const response = await preference.create({
                body: {
                    items: mpItems,
                    back_urls: { success: finalSuccessUrl, failure: failureUrl, pending: failureUrl },
                    external_reference: String(newOrder.id),
                    auto_return: "approved" 
                }
            });

            await newOrder.update({ preference_id: response.id }, { transaction: t });

            await t.commit();
            res.json({ id: response.id, init_point: response.init_point, order_id: newOrder.id });

        } catch (error) {
            if (t) await t.rollback();
            res.status(500).json({ mensaje: "Error al crear preferencia", error: error.message });
        }
    },

    confirmPayment: async (req, res) => {
        const { order_id, payment_id } = req.body;
        const t = await sequelize.transaction();

        try {
            const order = await Order.findByPk(order_id, {
                include: [
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                    { model: User, as: 'user', attributes: ['name', 'email'] }
                ],
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!order) {
                await t.rollback();
                return res.status(404).json({ mensaje: "Orden no encontrada" });
            }

            if (order.status === 'completed') {
                await t.rollback();
                return res.json({ mensaje: "La orden ya fue procesada", order });
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
                payment_id: payment_id,
                pdf_data: pdfBuffer
            }, { transaction: t });

            // Vaciar carrito
            const cart = await Cart.findOne({ where: { user_id: order.user_id }, transaction: t });
            if (cart) {
                await CartItem.destroy({ where: { cart_id: cart.id }, transaction: t });
            }

            await t.commit();
            res.json({ mensaje: "Pago confirmado y resumen generado", order_id: order.id });

        } catch (error) {
            if (t) await t.rollback();
            res.status(500).json({ mensaje: "Error al confirmar pago", error: error.message });
        }
    },

    downloadPDF: async (req, res) => {
        try {
            const { id } = req.params;
            const order = await Order.findByPk(id);

            if (!order || !order.pdf_data) {
                return res.status(404).json({ mensaje: "PDF no encontrado para esta orden" });
            }

            // Verificación de autoría (solo el dueño o admin)
            if (order.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ mensaje: "No tienes permiso para descargar este comprobante" });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=comprobante_orden_${id}.pdf`);
            res.send(order.pdf_data);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al descargar el PDF", error: error.message });
        }
    },

    getOrderDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const order = await Order.findByPk(id, {
                attributes: ['id', 'total', 'status', 'payment_id', 'user_id', 'created_at'],
                include: [
                    { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
                    { model: User, as: 'user', attributes: ['name', 'email'] }
                ]
            });

            if (!order) return res.status(404).json({ mensaje: "Orden no encontrada" });

            // Verificación de autoría (solo el dueño o admin)
            if (order.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ mensaje: "No tienes permiso para ver esta orden" });
            }

            res.json(order);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener detalles", error: error.message });
        }
    }
};

module.exports = orderController;
