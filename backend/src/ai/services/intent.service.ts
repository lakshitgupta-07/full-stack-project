import { GoogleGenAI } from "@google/genai";
import type { ParsedIntent } from "../types/intent.js";

const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
    })

export const parsedIntent = async (
    userMessage: string
): Promise<ParsedIntent> => {
    
    const prompt = `
    You are the intent classifier for a travel AI assistant.
    Classify the user's message into exactly ONE of these intents: 

    - "destination_recommendation"
    - "general_travel"
    - "itinerary_generation"
    - "destination_comparison"
    - "hotel_recommendation"
    - "attraction_recommendation"
    - "travel_question"
    - "weather_query"
    - "visa_information"
    - "packing_recommendation"
    - "update_trip_context"
    - "clear_trip_context"
    - "general_travel"
    - "unknown"

    Return ONLY valid JSON.

    Format: 
    {
        "intent": "one_of_the_allowed_intents",
        "confidence": 0.0
    }
    Rules:
    - confidence must be between 0 and 1.
    - Classify based on what the user is trying to accomplish.
    - If the user is changing previously stored trip information, use
      "update_trip_context".
    - If the user explicitly wants previously stored information removed,
      use "clear_trip_context".
    - If the user asks about weather, use "weather_query".
    - If the user asks about visas, passports, entry requirements, or
      travel documents, use "visa_information".
    - If the user asks to create a trip plan or day-by-day plan,
      use "itinerary_generation".
    - If the user compares destinations, use "destination_comparison".
    - Do not invent an intent.
    - If the request does not clearly fit any category, use "unknown".

    User message:
    ${userMessage}
    `;

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: prompt
    })

    const text = response.text?.trim()

    if(!text) {
        return {
            intent: "unknown",
            confidence: 0,
        };
    }

    try {
        const parsed = JSON.parse(text) as ParsedIntent
        return parsed
    } catch(error) {
        console.error("Intent parsing failed", error)
        return {
            intent: "unknown",
            confidence: 0,
        };
    }
}