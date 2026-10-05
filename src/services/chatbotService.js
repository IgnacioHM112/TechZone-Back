const https = require('https');
const Product = require('../models/product');
const Category = require('../models/category');
const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const { Op } = require('sequelize');

const SYSTEM_INSTRUCTION = `
Eres el asistente de atención al cliente de TechZone, experto en hardware y componentes de PC.
Tu rol es ayudar a los usuarios de manera profesional, amigable y visualmente clara.

REGLAS DE FORMATO (MANDATORIAS):
1. **Markdown estricto**: Usa negritas para nombres de productos, precios y títulos.
2. **Espaciado**: Deja una línea en blanco entre párrafos y secciones para que el texto sea fácil de leer.
3. **Listas**: Usa puntos de lista (\`-\` o \`*\`) para enumerar productos, características o pasos.
4. **Emojis**: Usa emojis de forma sutil para mejorar la experiencia (ej: 💻, 🚀, 💰, ✅).
5. **Saludo y Despedida**: Comienza con un saludo cordial y termina con una invitación a seguir consultando.

DIRECTRICES DE CONTENIDO:
1. Solo proporcionas información de productos presentes en el **CATÁLOGO REAL** proporcionado abajo.
2. Siempre menciona el **PRECIO** y la **DISPONIBILIDAD** (Stock) de forma objetiva.
3. Si el stock es 0, informa que no hay disponibilidad actual.
4. Si un producto no está en el catálogo, informa al usuario con amabilidad y menciona opciones con características similares.
5. Tu función es ser un asistente informativo y experto. No realices transacciones ni fuerces la venta; tu objetivo es brindar datos precisos para que el usuario tome su propia decisión.
6. Sé conciso y profesional. No inventes datos técnicos ni precios.

CONTEXTO PERSONAL DEL USUARIO:
{{USER_CONTEXT}}

CATÁLOGO REAL (Contexto actual):
{{CATALOG_CONTEXT}}

Responde siempre en español y asegúrate de que el formato sea impecable.
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
        return `¡Hola! 👋 Bienvenido a **TechZone**. Soy tu asistente virtual especializado en hardware y componentes PC.\n\n¿En qué puedo ayudarte hoy? Puedes consultarme sobre:\n- **Productos** y precios (procesadores, GPU, RAM, almacenamiento, etc.)\n- **Stock** y disponibilidad\n- **Tu carrito** o **historial de compras** (si tienes sesión iniciada)\n- **Recomendaciones** según tu presupuesto o necesidades\n\n¡Estoy aquí para ayudarte! 💻`;
    }
    
    if (msg.includes('gracias')) {
        return `¡De nada! 😊 Me alegra poder ayudarte. Si tienes alguna otra duda sobre componentes, precios, o necesitas asistencia con tu carrito o pedidos, no dudes en consultarme.\n\n¡Que tengas un excelente día! 🚀`;
    }
    
    if (msg.includes('carrito') || msg.includes('cart')) {
        if (userContext.includes('CARRITO ACTUAL: El carrito se encuentra vacío')) {
            return `Tu carrito está **vacío** en este momento. 🛒\n\nPuedes agregar productos desde el catálogo. Si necesitas recomendaciones sobre qué comprar según tu presupuesto o uso (gaming, trabajo, edición), solo dímelo y te ayudo. 💡`;
        }
        return `Aquí tienes el resumen de tu **carrito actual**:\n\n${userContext.split('CARRITO ACTUAL')[1]?.split('HISTORIAL')[0] || 'Productos en tu carrito'}\n\n¿Quieres que te ayude con algo específico sobre estos productos?`;
    }
    
    if (msg.includes('compra') || msg.includes('pedido') || msg.includes('orden') || msg.includes('historial')) {
        if (userContext.includes('No se registran compras previas')) {
            return `No tienes **compras previas** registradas en el sistema. 📦\n\nCuando realices tu primer pedido, aparecerá aquí con todo el detalle. ¡Anímate a armar tu PC ideal! 💪`;
        }
        return `Aquí tienes tu **historial de compras**:\n\n${userContext.split('HISTORIAL DE COMPRAS')[1] || 'Sin compras recientes'}\n\n¿Necesitas el comprobante de alguna orden o tienes dudas sobre el estado de envío?`;
    }
    
    if (relevantProducts.length > 0) {
        let response = `Encontré estos productos que coinciden con tu búsqueda:\n\n`;
        relevantProducts.slice(0, 5).forEach(p => {
            const stockStatus = p.stock > 0 ? `✅ **Stock: ${p.stock} unidades**` : `❌ **Sin stock**`;
            response += `- **${p.name}** (${p.category?.name || 'General'})\n  Precio: **$${p.price}** | ${stockStatus}\n  ${p.description?.substring(0, 100)}...\n\n`;
        });
        response += `¿Te interesa alguno en particular? Puedo darte más detalles o ayudarte a comparar. 🔍`;
        return response;
    }
    
    return `No encontré productos exactos para **"${userMessage}"** en el catálogo actual. 🔍\n\n**Categorías disponibles**: Procesadores, GPU, RAM, Almacenamiento (SSD/HDD), Motherboards, Fuentes de poder, Gabinetes, Refrigeración, Periféricos, Accesorios.\n\n¿Podrías ser más específico? Por ejemplo:\n- *"Busco una GPU para gaming 1080p bajo $500.000"*
- *"Necesito 32GB RAM DDR5"*
- *"Qué motherboard recomiendan para Ryzen 7 7800X3D"*

¡Estoy aquí para ayudarte a encontrar lo que necesitas! 💻`;
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