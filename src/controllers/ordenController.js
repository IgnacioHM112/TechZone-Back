const db = require('../config/db');
const client = require('../config/mercadopago');
const { Preference } = require('mercadopago');

const crearOrden = async (req, res) => {
    try {
        const { productos } = req.body;
        const usuario_id = req.usuario.id;

        // 1. Calculamos el total
        const total = productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

        // 2. Insertamos la cabecera de la orden
        const [ordenResult] = await db.execute(
            'INSERT INTO ordenes (usuario_id, total, estado) VALUES (?, ?, ?)',
            [usuario_id, total, 'pendiente']
        );
        const ordenId = ordenResult.insertId;

        // 3. Insertamos el detalle (cada producto)
        const detallePromesas = productos.map(p => {
            return db.execute(
                'INSERT INTO detalle_orden (orden_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [ordenId, p.id, p.cantidad, p.precio]
            );
        });
        await Promise.all(detallePromesas);

        // 4. Configurar la Preferencia de Mercado Pago
        const preference = new Preference(client);
        
        const body = {
            items: productos.map(p => ({
                id: p.id.toString(),
                title: "Compra TechZone",
                quantity: Number(p.cantidad),
                unit_price: Number(p.precio),
                currency_id: 'ARS'
            })),
            back_urls: {
                success: "https://www.google.com", // Usamos una URL real para probar
                failure: "https://www.google.com",
                pending: "https://www.google.com"
            },
            // Quitamos auto_return momentáneamente para testear
            external_reference: ordenId.toString(),
        };

        // 5. Crear la preferencia y obtener el link
        const response = await preference.create({ body });

        // 6. Respuesta final al cliente (Postman/Frontend)
        res.status(201).json({
            message: 'Orden creada y link de pago generado',
            ordenId: ordenId,
            init_point: response.init_point 
        });

    } catch (error) {
        console.error("Error detallado:", error);
        res.status(500).json({ message: 'Error al procesar el pago' });
    }
};

module.exports = { crearOrden };