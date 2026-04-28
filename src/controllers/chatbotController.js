const { GoogleGenerativeAI } = require("@google/generative-ai");

const chatbotController = {
    chat: async (req, res) => {
        console.log("=== Nueva solicitud al Chatbot ===");
        try {
            const { message } = req.body;
            console.log("Mensaje recibido:", message);

            if (!message) {
                return res.status(400).json({ error: "El mensaje es obligatorio." });
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("Configuración de API incompleta.");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ 
                model: "gemini-flash-latest",
                systemInstruction: "Eres un experto en hardware de la tienda TechZone. Asesora al cliente de forma profesional y amable. Si el usuario te pregunta algo inapropiado, responde que solo puedes hablar de hardware.",
            });

            const result = await model.generateContent(message);
            const response = await result.response;
            
            // Verificamos si la respuesta fue bloqueada o está vacía
            const candidates = response.candidates;
            if (candidates && candidates.length > 0 && candidates[0].finishReason === 'SAFETY') {
                return res.json({ response: "Lo siento, como experto de TechZone no puedo responder a esa consulta por políticas de seguridad. ¿En qué otra cosa sobre hardware puedo ayudarte?" });
            }

            const text = response.text();
            res.json({ response: text });
        } catch (error) {
            console.error("DETALLE DEL ERROR:", error);
            
            // Si el error es específicamente por seguridad de Google
            if (error.message && error.message.includes("SAFETY")) {
                return res.json({ response: "Lo siento, no puedo responder a eso. ¿Tienes alguna duda sobre componentes de PC?" });
            }

            res.status(500).json({ 
                error: "Ocurrió un error inesperado.",
                details: error.message 
            });
        } finally {
            console.log("=== Fin de la solicitud ===");
        }
    }
};

module.exports = chatbotController;
