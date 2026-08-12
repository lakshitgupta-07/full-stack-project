import { GoogleGenAI } from "@google/genai";
import { Thread } from "../../models/thread.model.js";
import type { TravelContext } from "../types/ai-message.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!
});

export const updateTravelContext = async (
    threadId: string,
    userMessage: string
): Promise<TravelContext | null> => {
    const thread = await Thread.findById(threadId);
    if(!thread || !thread.isAI) {
        return null
    }

    const prompt = `
    Extract travel information from the user's message.
    Return ONLY valid JSON.
    Available fields: 
    {
        "destination": string | null,
        "origin": string | null,
        "startDate": string | null,
        "endDate": string | null,
        "travellers": number | null,
        "budget": number | null,
        "currency": string | null,
        "interests": string[],
        "travelStyle": string | null
    }
    
    Rules:
     - Only extract information explicitly stated or clearly implied.
     - Do not invent information.
     - Use null when information unavailable.
     - interests refers to the persons choice of what to do and it must be an array.
     - If the user provides only a day and month, DO NOT invent a year.
     - When the year is not explicitly provided, return the date without a year using DD-MM format.
     - Only include a year when the user explicitly states one.
     - Never assume the current year or a previous year.
     - budget must be numeric.
     - Update the budget if trip changes
     - travellers filed refer to number of people travelling and must be numeric.
     - The user's latest message can correct, replace, or update previously known travel information.
     - If the user explicitly change a value, extract the new value.
     - Never preserve an old value when the user clearly provides a replacement.
     - If the user says "actually", "instead", "change", "update", "make it", "my new budget", etc., treat the new value as the replacement.
     - Do not invent missing values.

    User message: 
    ${userMessage}
    `;

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: prompt
    });

    const text = response.text?.trim();

    if(!text) return null;
    const cleanedText = text.replace(/^```json\s*/i, "").replace(/^```\*s/i, "").replace(/\s*```$/i, "").trim()

    try {
        const extracted = JSON.parse(cleanedText) as Partial<TravelContext>;
        const existing = thread.travelContext ?? {};

        const updated: TravelContext = {
            ...existing,

            ...(extracted.destination && {
                destination: extracted.destination,
            }),

            ...(extracted.origin && {
                origin: extracted.origin
            }),

            ...(extracted.startDate && {
                startDate: extracted.startDate
            }),

            ...(extracted.endDate && {
                endDate: extracted.endDate
            }),

            ...(extracted.travellers !== null && extracted.travellers !== undefined && {
                travellers: extracted.travellers
            }),

            ...(extracted.budget !== null && extracted.budget !== undefined && {
                budget: extracted.budget
            }),

            ...(extracted.currency !== null && extracted.currency !== undefined && {
                currency: extracted.currency
            }),

            ...(extracted.interests?.length && {
                interests: [
                    ...new Set([
                        ...(existing.interests ?? []),
                        ...extracted.interests
                    ]),
                ],
            }),

            ...(extracted.travelStyle && {
                travelStyle: extracted.travelStyle,
            }),
        };

        thread.travelContext = updated
        await thread.save();
        return updated
    } catch (error) {
        console.error("Travel context parsing failed", error);
        return null;
    }
}