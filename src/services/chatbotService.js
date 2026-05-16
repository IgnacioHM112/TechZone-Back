const https = require('https');
const Product = require('../models/product');
const Category = require('../models/category');
const { Op } = require('sequelize');

const SYSTEM_INSTRUCTION = `
Eres el asistente de atención al cliente de TechZone, experto en hardware.
Tu rol es ayudar a los usuarios de manera concisa, amable y profesional.

REGLAS DE FORMATO (OBLIGATORIAS):
1. Usa un saludo formal al inicio (ej: "Estimado/a cliente", "Buen día").
2. Usa puntos de lista (bullets) para enumerar productos, pasos o características.
3. No escribas párrafos de más de 3 líneas. Divide la información si es necesario para mantener la brevedad.
4. Despídete cordialmente invitando al usuario a seguir consultando.

DIRECTRICES DE CONTENIDO:
1. Solo recomiendas productos presentes en el "CATÁLOGO REAL" proporcionado más abajo.
2. Si un usuario pregunta por un producto o categoría que NO está en el catálogo, informa educadamente y ofrece una alternativa similar si existe.
3. Siempre menciona el PRECIO y la DISPONIBILIDAD (Stock) cuando hables de un producto específico.
4. Si el stock es 0, indica que no hay disponibilidad inmediata.
5. Cuando un usuario mencione un presupuesto, sugiere opciones del catálogo que no lo superen.
6. Si la información es insuficiente, utiliza la lista de productos para guiar al usuario.
7. Sé amable, conciso y orientado a la venta. No inventes especificaciones ni precios.

CATÁLOGO REAL (Contexto actual relevante):
{{CATALOG_CONTEXT}}

Responde siempre en español.
`;

let chatHistory = [];

/**
 * Busca productos relevantes en la base de datos basándose en el mensaje del usuario.
 * Mejora: Busca por nombre, descripción y también por nombre de categoría.
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

        // 1. Buscar categorías que coincidan con las palabras clave
        const matchingCategories = await Category.findAll({
            where: {
                [Op.or]: keywords.map(kw => ({
                    name: { [Op.like]: `%${kw}%` }
                }))
            },
            attributes: ['id']
        });
        const categoryIds = matchingCategories.map(c => c.id);

        // 2. Buscar productos por nombre, descripción o categoría
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
            limit: 15 // Aumentamos el límite para dar más contexto
        });

        return products;
    } catch (error) {
        console.error('Error buscando productos para chatbot:', error);
        return [];
    }
};

const chatWithBot = async (userMessage, history = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Obtener productos relevantes de la DB
            const relevantProducts = await getRelevantProducts(userMessage);
            
            let catalogContext = "";
            if (relevantProducts.length > 0) {
                catalogContext = relevantProducts.map(p => 
                    `- ${p.name} | Cat: ${p.category?.name || 'Gral'} | Precio: $${p.price} | Stock: ${p.stock} | Desc: ${p.description}`
                ).join('\n');
            } else {
                catalogContext = "No hay productos exactos en el catálogo para esta búsqueda. Informar al usuario que puede consultar por otros componentes.";
            }

            // 2. Personalizar la instrucción del sistema
            const currentSystemInstruction = SYSTEM_INSTRUCTION.replace('{{CATALOG_CONTEXT}}', catalogContext);

            // 3. Manejar historial (Si se pasa history usamos ese, si no usamos el global)
            let currentHistory = history;
            if (currentHistory === null) {
                chatHistory.push({
                    role: 'user',
                    content: userMessage,
                });
                currentHistory = chatHistory;
            } else {
                currentHistory = [...history, { role: 'user', content: userMessage }];
            }

            const messages = [
                {
                    role: 'system',
                    content: currentSystemInstruction,
                },
                ...currentHistory,
            ];

            const postData = JSON.stringify({
                model: 'llama-3.3-70b-versatile',
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
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Length': Buffer.byteLength(postData),
                },
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode === 200 || res.statusCode === 201) {
                            const assistantMessage = parsed.choices?.[0]?.message?.content || '';
                            
                            // Si usamos el historial global, lo actualizamos
                            if (history === null) {
                                chatHistory.push({ role: 'assistant', content: assistantMessage });
                                if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
                            }
                            
                            resolve({ success: true, message: assistantMessage });
                        } else {
                            console.error('Error de API Groq:', parsed);
                            resolve({ success: false, message: 'Error de IA.', error: parsed.error?.message });
                        }
                    } catch (e) {
                        resolve({ success: false, message: 'Error de procesamiento.', error: e.message });
                    }
                });
            });

            req.on('error', (e) => {
                resolve({ success: false, message: 'Error de conexión.', error: e.message });
            });

            req.write(postData);
            req.end();
        } catch (error) {
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