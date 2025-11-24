import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

export const generateSubtitles = async (
  apiKey: string,
  modelId: string,
  base64Audio: string,
  mimeType: string,
  inputLang: string,
  outputLang: string,
  format: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });

  // Map "gemini 3" requests to the valid preview model if needed, though passed modelId should be correct from constants
  const modelName = modelId; 

  const prompt = `
    Input Language: ${inputLang}
    Target Output Language: ${outputLang}
    Desired Format: ${format.toUpperCase()}
    
    Task: Transcribe the attached audio file into ${outputLang} subtitles in ${format.toUpperCase()} format. 
    Follow the system instructions strictly regarding tone, explicit vocabulary, and sound effects.
    Ensure timestamps are in hh:mm:ss.SSS format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6, // Slightly creative for "lively" descriptions
        safetySettings: [
            // CRITICAL: We must disable safety blockers to allow the explicit content requested by the user.
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      },
    });

    return response.text || "Error: No text generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
