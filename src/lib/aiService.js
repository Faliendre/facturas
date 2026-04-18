import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service to handle document analysis with fallback mechanisms.
 * It tries multiple Gemini API keys and can be extended to other providers like OpenAI.
 */

const PROMPT = `Analiza este documento (puede ser factura comercial, recibo o voucher/extracto bancario) y extrae los datos en formato JSON puro.
No incluyas markdown, no incluyas bloque \`\`\`json. Solo devuelve el objeto JSON.
Estructura Requerida:
{
  "fecha": "YYYY-MM-DD",
  "monto": "numero",
  "concepto": "descripcion",
  "tipo": "Factura" o "Extracto bancario"
}
Reglas:
- Si la fecha está en formato DD/MM/YY o DD/MM/YYYY conviértela a YYYY-MM-DD (asume 20xx para el año si tiene 2 dígitos).
- El monto debe ser un string estrictamente numérico con decimales separados por "." (sin comas ni asteriscos). Extrae solo la cifra, no signos como Bs. Ejemplo: de "****500.00" o "1,000.00" obtén "500.00" o "1000.00". Ignora el saldo, busca el "MONTO" retirado o total pagado.
- Si parece un ticket de cajero automático (ATM), retiro, o estado de cuenta de un Banco (ej. Banco Fie, Comunidad), el "tipo" debe ser "Extracto bancario" y en "concepto" pon "Retiro -" seguido del nombre del banco. Si es una compra normal en tienda, pon "Factura" en "tipo".`;

// Get all possible Gemini keys from environment variables
const getGeminiKeys = () => {
    const keys = [];
    if (import.meta.env.VITE_GEMINI_API_KEY) keys.push(import.meta.env.VITE_GEMINI_API_KEY);
    if (import.meta.env.VITE_GEMINI_API_KEY_2) keys.push(import.meta.env.VITE_GEMINI_API_KEY_2);
    if (import.meta.env.VITE_GEMINI_API_KEY_3) keys.push(import.meta.env.VITE_GEMINI_API_KEY_3);
    return keys;
};

const getOpenAIKey = () => import.meta.env.VITE_OPENAI_API_KEY;

export const analyzeDocumentWithFallback = async (base64Data, mimeType) => {
    const geminiKeys = getGeminiKeys();
    const openAIKey = getOpenAIKey();
    
    let lastError = null;

    // 1. Try Gemini Keys
    for (let i = 0; i < geminiKeys.length; i++) {
        try {
            console.log(`Intentando con Gemini Key #${i + 1}...`);
            const genAI = new GoogleGenerativeAI(geminiKeys[i]);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            const result = await model.generateContent([PROMPT, imagePart]);
            const responseText = result.response.text();
            return parseAIResponse(responseText);
        } catch (error) {
            console.warn(`Error con Gemini Key #${i + 1}:`, error.message);
            lastError = error;
            // Solo continuamos si es un error de cuota o límite
            if (!isRetryableError(error)) {
                throw error;
            }
        }
    }

    // 2. Try OpenAI Fallback if available
    if (openAIKey) {
        try {
            console.log("Intentando con OpenAI (GPT-4o-mini)...");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAIKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: PROMPT },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Data}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 500
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            
            const responseText = data.choices[0].message.content;
            return parseAIResponse(responseText);
        } catch (error) {
            console.error("Error con OpenAI:", error.message);
            lastError = error;
        }
    }

    throw new Error(lastError ? `No se pudo procesar con ningún modelo: ${lastError.message}` : "No hay llaves de API disponibles.");
};

const parseAIResponse = (responseText) => {
    const cleanText = responseText.trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error("El modelo no devolvió un JSON válido.");
    }

    return JSON.parse(jsonMatch[0]);
};

const isRetryableError = (error) => {
    if (!error || !error.message) return false;
    const msg = error.message.toLowerCase();
    // 429 = Too Many Requests (Quota), 503 = Service Unavailable, etc.
    return (
        msg.includes('quota') || 
        msg.includes('limit') || 
        msg.includes('429') || 
        msg.includes('503') || 
        msg.includes('overloaded') ||
        msg.includes('exhausted') ||
        msg.includes('billing') // Sometimes quota errors mention billing details for free tier
    );
};
