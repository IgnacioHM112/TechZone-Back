const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const Product = require('../models/product');

const cartController = {
    // Obtener el carrito del usuario logueado
    getCart: async (req, res) => {
        try {
            const [cart] = await Cart.findOrCreate({
                where: { user_id: req.user.id },
                include: [{
                    model: CartItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product' }]
                }]
            });
            res.json(cart);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener el carrito", error: error.message });
        }
    },

    // Agregar producto al carrito
    addItem: async (req, res) => {
        try {
            const { product_id, quantity } = req.body;
            const requestedQuantity = parseInt(quantity);
            const user_id = req.user.id;

            if (requestedQuantity <= 0) {
                return res.status(400).json({ mensaje: "La cantidad debe ser mayor a 0" });
            }

            // 1. Verificar que el producto exista y tenga stock
            const product = await Product.findByPk(product_id);
            if (!product) return res.status(404).json({ mensaje: "Producto no encontrado" });

            // 2. Obtener o crear el carrito
            const [cart] = await Cart.findOrCreate({ where: { user_id } });

            // 3. Verificar si el producto ya está en el carrito para sumar cantidades
            let item = await CartItem.findOne({
                where: { cart_id: cart.id, product_id }
            });

            const currentQuantityInCart = item ? item.quantity : 0;
            const totalRequested = currentQuantityInCart + requestedQuantity;

            // 4. VALIDACIÓN DE STOCK ROBUSTA
            if (product.stock < totalRequested) {
                return res.status(400).json({ 
                    mensaje: `Stock insuficiente. Disponible: ${product.stock}, En tu carrito: ${currentQuantityInCart}`,
                    stockDisponible: product.stock,
                    enCarrito: currentQuantityInCart
                });
            }

            if (item) {
                item.quantity = totalRequested;
                await item.save();
            } else {
                item = await CartItem.create({
                    cart_id: cart.id,
                    product_id,
                    quantity: requestedQuantity,
                    unit_price: product.price
                });
            }

            res.status(201).json({ mensaje: "Carrito actualizado con éxito", item });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al añadir item", error: error.message });
        }
    },

    // Eliminar o disminuir cantidad de un item
    removeItem: async (req, res) => {
        try {
            const { item_id } = req.params;
            // Manejar caso donde el body viene vacío para evitar el error de desestructuración
            const { quantity } = req.body || {}; 
            
            const cart = await Cart.findOne({ where: { user_id: req.user.id } });
            if (!cart) return res.status(404).json({ mensaje: "Carrito no encontrado" });

            const item = await CartItem.findOne({ 
                where: { id: item_id, cart_id: cart.id } 
            });

            if (!item) return res.status(404).json({ mensaje: "Item no encontrado en tu carrito" });

            const decreaseQty = quantity ? parseInt(quantity) : null;

            if (decreaseQty && decreaseQty < item.quantity) {
                // Disminuir cantidad
                item.quantity -= decreaseQty;
                await item.save();
                res.json({ mensaje: "Cantidad disminuida con éxito", item });
            } else {
                // Eliminar el item por completo si no hay quantity o es >= a la actual
                await item.destroy();
                res.json({ mensaje: "Producto eliminado del carrito con éxito" });
            }
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar item", error: error.message });
        }
    },

    // Vaciar el carrito
    clearCart: async (req, res) => {
        try {
            const cart = await Cart.findOne({ where: { user_id: req.user.id } });
            if (!cart) return res.status(404).json({ mensaje: "Carrito no encontrado" });

            await CartItem.destroy({ where: { cart_id: cart.id } });

            res.json({ mensaje: "Carrito vaciado con éxito" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al vaciar el carrito", error: error.message });
        }
    }
};

module.exports = cartController;
