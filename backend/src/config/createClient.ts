import { GoogleGenAI } from "@google/genai";
export function getClient() {
    const key = process.env.GEMINI_API_KEY;
    if(!key) {
        throw new Error("Gemini key not loaded")
    }
    return new GoogleGenAI({
        apiKey: key,
    })
 }
