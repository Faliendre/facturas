import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Service to handle document analysis with robust fallback mechanisms.
 * It will try multiple Gemini API keys sequentially if any error occurs.
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

// Dynamically collect up to 5 Gemini keys from env
const getGeminiKeys = () => {
    const keys = [];
    const env = import.meta.env;
    if (env.VITE_GEMINI_API_KEY) keys.push(env.VITE_GEMINI_API_KEY);
    if (env.VITE_GEMINI_API_KEY_2) keys.push(env.VITE_GEMINI_API_KEY_2);
    if (env.VITE_GEMINI_API_KEY_3) keys.push(env.VITE_GEMINI_API_KEY_3);
    if (env.VITE_GEMINI_API_KEY_4) keys.push(env.VITE_GEMINI_API_KEY_4);
    if (env.VITE_GEMINI_API_KEY_5) keys.push(env.VITE_GEMINI_API_KEY_5);
    return keys.filter(key => key && key.trim() !== ""); // Ensure no empty strings
};

export const analyzeDocumentWithFallback = async (base64Data, mimeType) => {
    const geminiKeys = getGeminiKeys();
    let lastError = null;

    console.log(`Sistema de IA: Detectadas ${geminiKeys.length} llaves configuradas.`);

    // Iterate through all keys
    for (let i = 0; i < geminiKeys.length; i++) {
        const keyLabel = `Llave #${i + 1}`;
        try {
            console.log(`[IA] Intentando con ${keyLabel}...`);
            const genAI = new GoogleGenerativeAI(geminiKeys[i]);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

            const imagePart = {

                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            const result = await model.generateContent([PROMPT, imagePart]);
            const responseText = result.response.text();
            
            console.log(`[IA] Éxito con ${keyLabel}.`);
            return parseAIResponse(responseText);

        } catch (error) {
            console.error(`[IA] Errror con ${keyLabel}:`, error.message || error);
            lastError = error;
            
            // If it's the last key, we don't log "jumping to next"
            if (i < geminiKeys.length - 1) {
                console.warn(`[IA] ${keyLabel} falló. Saltando automáticamente a la siguiente...`);
            }
        }
    }

    // If we reach here, ALL keys failed
    throw new Error(
        `Se agotaron todos los intentos (${geminiKeys.length} llaves). ` + 
        `Último error: ${lastError?.message || lastError || "Desconocido"}`
    );
};

const parseAIResponse = (responseText) => {
    try {
        const cleanText = responseText.trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("El modelo no devolvió un JSON válido.");
        }

        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("[IA] Error parseando respuesta JSON:", e);
        throw new Error("No se pudo interpretar la respuesta de la IA como datos válidos.");
    }
};
