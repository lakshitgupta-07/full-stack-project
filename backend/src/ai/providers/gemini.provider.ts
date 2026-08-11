import type { AIProvider } from "./ai.providers.js";
import { getClient } from "../../config/createClient.js";
import type { AIMessage } from "../types/ai-message.js";

export class GeminiProvider implements AIProvider {
  async generate(messages: AIMessage[]): Promise<string> {
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

  async generateStream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    async function emitSlowly(text: string, onChunk: (chunk: string) => void) {
      const words = text.split(/(\s+)/);
      for (const word of words) {
        onChunk(word);
      }
      await sleep(35);
    }
    let fullText = "";
    const ai = getClient();
    const systemPrompt = messages.find((m) => m.role === "system")?.content ?? "";
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");
    const prompt = `${systemPrompt} ${conversation} ASSISTANT:`;
    const stream = await ai.models.generateContentStream({
      model: process.env.GEMINI_MODEL!,
      contents: prompt,
    });
    for await (const chunk of stream) {
      const text = chunk.text ?? "";
      if (!text) continue;
      fullText += text;
      // onChunk(text)
      await emitSlowly(text, onChunk);
    }
    return fullText;
  }
}
