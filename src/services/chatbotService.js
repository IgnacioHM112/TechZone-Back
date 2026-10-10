const https = require('https');
const Product = require('../models/product');
const Category = require('../models/category');
const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const { Op } = require('sequelize');

const SYSTEM_INSTRUCTION = `
Eres el asistente de TechZone, experto en hardware PC. Responde de forma directa, concisa y profesional.

REGLAS DE FORMATO:
1. **Sin líneas en blanco innecesarias**. Una línea entre secciones máximo.
2. **Listas compactas**: Usa \`-\` para items, sin línea extra entre items.
3. **Negritas** solo para: nombres de productos, precios, stock.
4. **Emojis** solo al inicio/final (máx 1).
5. **Máx 3-4 líneas** por respuesta salvo lista de productos.

CONTEXTO USUARIO: {{USER_CONTEXT}}
CATÁLOGO: {{CATALOG_CONTEXT}}

Sé breve. Si no hay stock, dilo. Si no existe, sugiere alternativas.
`;

let chatHistory = [];

/**
 * Busca productos relevantes en la base de datos basándose en el mensaje del usuario.
 */
const getRelevantProducts = async (message) => {
    try {
        const cleanMessage = message.toLowerCase().replace(/[?¿!¡.,]/g, '');
        const keywords = cleanMessage.split(' ').filter(word => word.length >= 2);

        if (keywords.length === 0) {
            return await Product.findAll({
                limit: 5,
                where: { active: true, stock: { [Op.gt]: 0 } },
                include: [{ model: Category, as: 'category', attributes: ['name'] }]
            });
        }

        const matchingCategories = await Category.findAll({
            where: {
                [Op.or]: keywords.map(kw => ({
                    name: { [Op.like]: `%${kw}%` }
                }))
            },
            attributes: ['id']
        });
        const categoryIds = matchingCategories.map(c => c.id);

        const products = await Product.findAll({
            where: {
                active: true,
                [Op.or]: [
                    ...keywords.map(kw => ({ name: { [Op.like]: `%${kw}%` } })),
                    ...keywords.map(kw => ({ description: { [Op.like]: `%${kw}%` } })),
                    { category_id: { [Op.in]: categoryIds } }
                ]
            },
            include: [{ model: Category, as: 'category', attributes: ['name'] }],
            limit: 15
        });

        return products;
    } catch (error) {
        console.error('Error buscando productos para chatbot:', error);
        return [];
    }
};

/**
 * Obtiene el contexto personal del usuario (Carrito y Compras).
 */
const getUserContext = async (user) => {
    if (!user) {
        return "El usuario NO ha iniciado sesión. Si pregunta por sus compras o carrito, invítalo amablemente a iniciar sesión o registrarse.";
    }

    try {
        let context = `Usuario: ${user.name} (Email: ${user.email})\n`;

        // 1. Obtener Carrito
        const cart = await Cart.findOne({
            where: { user_id: user.id },
            include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
        });

        if (cart && cart.items && cart.items.length > 0) {
            context += "CARRITO ACTUAL (Productos seleccionados):\n";
            cart.items.forEach(item => {
                context += `- ${item.product.name} (Cantidad: ${item.quantity}, Precio unitario: $${item.unit_price})\n`;
            });
            context += "Nota: Informa al usuario sobre estos artículos si pregunta por su carrito de forma objetiva.\n";
        } else {
            context += "CARRITO ACTUAL: El carrito se encuentra vacío actualmente.\n";
        }

        // 2. Obtener Órdenes pasadas
        const orders = await Order.findAll({
            where: { user_id: user.id },
            limit: 3,
            order: [['created_at', 'DESC']],
            include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
        });

        if (orders && orders.length > 0) {
            context += "HISTORIAL DE COMPRAS (Últimos registros):\n";
            orders.forEach(order => {
                const date = new Date(order.created_at).toLocaleDateString();
                context += `- Orden #${order.id} | Fecha: ${date} | Total: $${order.total} | Estado: ${order.status}\n`;
                order.items.forEach(item => {
                    context += `  * ${item.product?.name || 'Producto'} (Cant: ${item.quantity})\n`;
                });
            });
        } else {
            context += "HISTORIAL DE COMPRAS: No se registran compras previas en el sistema.\n";
        }

        return context;
    } catch (error) {
        console.error('Error obteniendo contexto de usuario:', error);
        return "Error al recuperar datos del usuario.";
    }
};

const generateLocalResponse = (userMessage, relevantProducts, userContext) => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('hola') || msg.includes('buenas') || msg.includes('saludo')) {
        return `¡Hola! 👋 Soy tu asistente TechZone.\n- **Productos** y precios (GPU, CPU, RAM, SSD...)\n- **Stock** y disponibilidad\n- **Tu carrito** / **historial** (si estás logueado)\n- **Recomendaciones** por presupuesto/uso\n¿En qué te ayudo?`;
    }
    
    if (msg.includes('gracias')) {
        return `¡De nada! 😊 ¿Algo más en lo que ayudarte?`;
    }
    
    if (msg.includes('carrito') || msg.includes('cart')) {
        if (userContext.includes('CARRITO ACTUAL: El carrito se encuentra vacío')) {
            return `Tu carrito está **vacío** 🛒\nAgrega productos desde el catálogo o dime tu presupuesto y te recomiendo.`;
        }
        return `Tu **carrito**:\n${userContext.split('CARRITO ACTUAL')[1]?.split('HISTORIAL')[0] || 'Productos en tu carrito'}\n¿Necesitas algo más?`;
    }
    
    if (msg.includes('compra') || msg.includes('pedido') || msg.includes('orden') || msg.includes('historial')) {
        if (userContext.includes('No se registran compras previas')) {
            return `No tienes **compras previas** 📦\nTu primer pedido aparecerá aquí.`;
        }
        return `Tu **historial**:\n${userContext.split('HISTORIAL DE COMPRAS')[1] || 'Sin compras recientes'}\n¿Buscas algún comprobante?`;
    }
    
    if (relevantProducts.length > 0) {
        let response = `Productos encontrados:\n`;
        relevantProducts.slice(0, 4).forEach(p => {
            const stock = p.stock > 0 ? `✅ ${p.stock} uds` : `❌ Sin stock`;
            response += `- **${p.name}** - **$${p.price}** | ${stock}\n`;
        });
        return response + `\n¿Detalles de alguno?`;
    }
    
    return `No encontré **"${userMessage}"** 🔍\nCategorías: Procesadores, GPU, RAM, SSD/HDD, Motherboards, Fuentes, Gabinetes, Refrigeración, Periféricos.\nEjemplos:\n- "GPU gaming 1080p < $500k"\n- "32GB DDR5"\n- "Motherboard Ryzen 7 7800X3D"\n¿Qué buscas?`;
};

const chatWithBot = async (userMessage, history = null, user = null) => {
    return new Promise(async (resolve) => {
        try {
            const relevantProducts = await getRelevantProducts(userMessage);
            const userContext = await getUserContext(user);

            let catalogContext = "";
            if (relevantProducts.length > 0) {
                catalogContext = relevantProducts.map(p => 
                    `- ${p.name} | Cat: ${p.category?.name || 'Gral'} | Precio: $${p.price} | Stock: ${p.stock} | Desc: ${p.description}`
                ).join('\n');
            } else {
                catalogContext = "No hay productos exactos en el catálogo para esta búsqueda. Informar al usuario que puede consultar por otros componentes.";
            }

            const groqKey = process.env.GROQ_API_KEY;
            const hasValidGroqKey = groqKey && groqKey.length > 20 && groqKey.startsWith('gsk_');
            
            if (hasValidGroqKey) {
                let currentSystemInstruction = SYSTEM_INSTRUCTION
                    .replace('{{CATALOG_CONTEXT}}', catalogContext)
                    .replace('{{USER_CONTEXT}}', userContext);

                let currentHistory = history;
                if (currentHistory === null) {
                    chatHistory.push({ role: 'user', content: userMessage });
                    currentHistory = chatHistory;
                } else {
                    currentHistory = [...history, { role: 'user', content: userMessage }];
                }

                const messages = [
                    { role: 'system', content: currentSystemInstruction },
                    ...currentHistory,
                ];

                const postData = JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: messages,
                    temperature: 0.6,
                    max_tokens: 1024,
                    top_p: 0.9,
                });

                const options = {
                    hostname: 'api.groq.com',
                    path: '/openai/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Length': Buffer.byteLength(postData),
                    },
                    timeout: 10000,
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            if (res.statusCode === 200 || res.statusCode === 201) {
                                const assistantMessage = parsed.choices?.[0]?.message?.content || '';
                                if (history === null) {
                                    chatHistory.push({ role: 'assistant', content: assistantMessage });
                                    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
                                }
                                resolve({ success: true, message: assistantMessage });
                            } else {
                                console.warn('Groq API error, using fallback:', parsed.error?.message);
                                const fallbackResponse = generateLocalResponse(userMessage, relevantProducts, userContext);
                                resolve({ success: true, message: fallbackResponse });
                            }
                        } catch (e) {
                            console.warn('Groq parse error, using fallback');
                            const fallbackResponse = generateLocalResponse(userMessage, relevantProducts, userContext);
                            resolve({ success: true, message: fallbackResponse });
                        }
                    });
                });

                req.on('error', (e) => {
                    console.warn('Groq connection error, using fallback:', e.message);
                    const fallbackResponse = generateLocalResponse(userMessage, relevantProducts, userContext);
                    resolve({ success: true, message: fallbackResponse });
                });

                req.write(postData);
                req.end();
            } else {
                const fallbackResponse = generateLocalResponse(userMessage, relevantProducts, userContext);
                resolve({ success: true, message: fallbackResponse });
            }
        } catch (error) {
            console.error('Error en chatWithBot:', error);
            resolve({ success: false, message: 'Error inesperado.', error: error.message });
        }
    });
};

const resetChat = () => {
    chatHistory = [];
    return { success: true, message: 'Chat reseteado' };
};

module.exports = {
    chatWithBot,
    resetChat,
};