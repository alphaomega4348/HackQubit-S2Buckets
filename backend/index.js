require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Please set GEMINI_API_KEY in .env');
    process.exit(1);
  }

  // Initialize client
  const ai = new GoogleGenAI({ apiKey });

  try {
    const modelName = 'gemini-2.5-flash';  // or another valid model 
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { text: "Write me a short poem about spring." }
          ]
        }
      ]
    });

    console.log('Response:', response.text);
  } catch (err) {
    console.error('API call failed:', err);
  }
}

main();
