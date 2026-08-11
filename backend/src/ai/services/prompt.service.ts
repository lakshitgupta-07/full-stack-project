import { travelSystemPrompts } from "../prompts/travel.prompts.js";
import { AIMessage } from "../types/ai-message.js";
import type { TravelContext } from "../types/ai-message.js";

export const buildPrompt = (
    history: {
        senderIsAI: boolean;
        text: string
    }[],
    latestMessage?: string,
    travelContext?: TravelContext
): AIMessage[] => {
    const conversation = history.map(m => `${m.senderIsAI ? "Assistant" : "User"}: ${m.text}`).join("\n");
    const contextPrompt = travelContext ? `
    TRAVEL CONTEXT

    Destination: ${travelContext.destination ?? "Not specified"}
    Origin: ${travelContext.origin ?? "Not Specified"}
    Start Date: ${travelContext.startDate ?? "Not Specified"}
    End Date: ${travelContext.endDate ?? "Not Specified"}
    Travellers: ${travelContext.travellers ?? "Not Specified"}
    Budget: ${
        travelContext.budget !== undefined ? `${travelContext.budget} ${travelContext.currency ?? ""}` : "Not Specified"
    }
    Interests: ${
        travelContext.interests?.length ? travelContext.interests.join(", ") : "Not specified"
    }
    Travel Style: ${travelContext.travelStyle ?? "Not Specified"}
    ` : "";


    const userPrompt = latestMessage?.trim()
      ? `${contextPrompt}
      CONVERSATION HISTORY
      ${conversation}
      User: ${latestMessage.trim()}`
      : `${contextPrompt}
      CONVERSATION HISTORY
      ${conversation}`;
    return [
        {
            role: "system",
            content: travelSystemPrompts
        },
        {
            role: "user",
            content: userPrompt
        }
    ]
}
