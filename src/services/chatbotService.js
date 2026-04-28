const https = require('https');

const SYSTEM_INSTRUCTION = `
Eres TechZone Bot, el asistente virtual experto en hardware de la tienda TechZone.
Tu rol es ayudar a los usuarios a encontrar productos de hardware (componentes de PC) que se ajusten a sus necesidades y presupuesto.

DIRECTRICES:
1. Solo recomiendas productos de hardware: procesadores, motherboards, tarjetas de video, memoria RAM, almacenamiento (SSD/HDD), fuentes de alimentación, gabinetes, coolers, monitores, periféricos, etc.
2. Cuando un usuario mencione un presupuesto, respetalo y sugerí opciones dentro de ese rango.
3. Preguntá detalles si la información es insuficiente (por ejemplo: "¿Qué uso le vas a dar?", "¿Tenés componentes?").
4. No inventés productos que no existan en el catálogo de TechZone.
5. Si no sabés la disponibilidad de un producto específico, indicá que consulten en la tienda.
6. Sé friendly, conciso y orientado a la venta.

INFORMACIÓN DE LA TIENDA:
- TechZone es una tienda especializada en hardware para PCs y gaming.
- Ofrecemos productos de las mejores marcas: Intel, AMD, NVIDIA, ASUS, MSI, Gigabyte, Corsair, Kingston, Western Digital, Samsung, etc.
- Todos nuestros productos tienen garantía oficial.

Responde siempre en español y de manera profesional.
`;

let chatHistory = [];

const chatWithBot = async (userMessage) => {
    return new Promise((resolve, reject) => {
        try {
            // Agregar mensaje del usuario al historial
            chatHistory.push({
                role: 'user',
                content: userMessage,
            });

            // Construir mensajes para la API
            const messages = [
                {
                    role: 'system',
                    content: SYSTEM_INSTRUCTION,
                },
                ...chatHistory,
            ];

            const postData = JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2048,
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

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        
                        if (res.statusCode === 200 || res.statusCode === 201) {
                            const assistantMessage = parsed.choices?.[0]?.message?.content || '';
                            
                            // Agregar respuesta del asistente al historial
                            chatHistory.push({
                                role: 'assistant',
                                content: assistantMessage,
                            });

                            // Limitar historial a los últimos 20 mensajes
                            if (chatHistory.length > 20) {
                                chatHistory = chatHistory.slice(-20);
                            }

                            resolve({
                                success: true,
                                message: assistantMessage,
                            });
                        } else {
                            console.error('Error de API Groq:', parsed);
                            resolve({
                                success: false,
                                message: 'Error al comunicarse con el servicio de IA.',
                                error: parsed.error?.message || `HTTP ${res.statusCode}`,
                            });
                        }
                    } catch (e) {
                        console.error('Error parseando respuesta:', e);
                        resolve({
                            success: false,
                            message: 'Error al procesar la respuesta del servicio.',
                            error: e.message,
                        });
                    }
                });
            });

            req.on('error', (e) => {
                console.error('Error en request:', e);
                resolve({
                    success: false,
                    message: 'Error de conexión con el servicio de IA.',
                    error: e.message,
                });
            });

            req.write(postData);
            req.end();
        } catch (error) {
            console.error('Error en chatbot:', error);
            resolve({
                success: false,
                message: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intentá de nuevo.',
                error: error.message,
            });
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