import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyCR9yeGKc7DtDKMvUFxi-5fZ1mketN450k");

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        console.log(`[SUCCESS] ${modelName}`);
    } catch (e) {
        console.error(`[FAILED] ${modelName}:`, e.message.substring(0, 100) + "...");
    }
}

async function main() {
    console.log("Testing API Key...");
    await testModel("gemini-1.5-flash");
    await testModel("gemini-1.5-flash-latest");
    await testModel("gemini-1.5-pro");
    await testModel("gemini-1.5-pro-latest");
    await testModel("gemini-pro");
    await testModel("gemini-pro-vision");
}

main();
