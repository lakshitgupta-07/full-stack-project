import { travelSystemPrompts } from "../prompts/travel.prompts.js";
import { AIMessage } from "../types/ai-message.js";

export const buildPrompt = (
    history: {
        senderIsAI: boolean;
        text: string
    }[],
    latestMessage?: string
): AIMessage[] => {
    const conversation = history.map(m => `${m.senderIsAI ? "Assistant" : "User"}: ${m.text}`).join("\n");
    const userPrompt = latestMessage?.trim()
      ? `${conversation}\nUser: ${latestMessage.trim()}`
      : conversation;
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
