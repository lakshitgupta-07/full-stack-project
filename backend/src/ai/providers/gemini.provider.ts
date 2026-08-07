import type { AIProvider } from "./ai.providers.js";
import { getClient } from "../../config/createClient.js";
import type { AIMessage } from "../types/ai-message.js";

export class GeminiProvider implements AIProvider {
  async generate(
    messages: AIMessage[]
  ): Promise<string> {
    const ai = getClient();
    const systemPrompt =
      messages.find((m) => m.role === "system")?.content ?? "";

    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `${systemPrompt}

${conversation}

ASSISTANT:`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
      contents: prompt,
    });

    return response.text ?? "";
  }
}
