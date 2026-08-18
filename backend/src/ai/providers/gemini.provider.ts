import type { AIProvider } from "./ai.providers.js";
import { getClient } from "../../config/createClient.js";
import type { AIMessage } from "../types/ai-message.js";
import { retry } from "../../utils/apiRetry.js";
import type { AIGenerationResult } from "../types/aiUsage.js";
import { getMcpClient } from "../services/mcp/client.js";
import { getGeminiMcpTools } from "../services/mcp/gemini-mcp.adapter.js";

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

    const mcpClient = await getMcpClient();


    const mcpTools = await getGeminiMcpTools(mcpClient);

    const response = await retry(
      () =>
        ai.models.generateContent({
          model:
            process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

          contents: prompt,

          config: {
            tools: [
              {
                functionDeclarations: mcpTools,
              },
            ],
          },
        }),
      {
        retries: 2,
        delay: 1000,
      },
    );


    const modelParts =
      response.candidates?.[0]?.content?.parts ?? [];


    const functionCallPart = modelParts.find(
      (part) => part.functionCall,
    );

    const functionCall = functionCallPart?.functionCall;

    if (!functionCall?.name) {
      return response.text ?? "";
    }

    const toolName = functionCall.name;

    const toolArgs = functionCall.args ?? {};

    const toolResult = await mcpClient.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    const finalResponse = await retry(
      () =>
        ai.models.generateContent({
          model:
            process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

          contents: [
            /**
             * Original user prompt.
             */
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },

            /**
             * Gemini's ORIGINAL response.
             *
             * Contains functionCall + thoughtSignature.
             */
            {
              role: "model",
              parts: modelParts,
            },

            /**
             * MCP tool result.
             */
            {
              role: "user",
              parts: [
                {
                  functionResponse: {
                    name: toolName,
                    response: toolResult,
                  },
                },
              ],
            },
          ],
        }),
      {
        retries: 2,
        delay: 1000,
      },
    );

    return finalResponse.text ?? "";
  }

  async generateStream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<AIGenerationResult> {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    async function emitSlowly(
      text: string,
      onChunk: (chunk: string) => void,
    ) {
      const words = text.split(/(\s+)/);

      for (const word of words) {
        onChunk(word);
      }

      await sleep(35);
    }

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

    const mcpClient = await getMcpClient();


    const mcpTools = await getGeminiMcpTools(mcpClient);

    const stream = await retry(
      () =>
        ai.models.generateContentStream({
          model:
            process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

          contents: prompt,

          config: {
            tools: [
              {
                functionDeclarations: mcpTools,
              },
            ],
          },
        }),
      {
        retries: 2,
        delay: 1000,
      },
    );

    let fullText = "";

    let inputToken = 0;
    let outputToken = 0;
    let totalToken = 0;


    const modelParts: any[] = [];


    let functionCallPart: any | undefined;


    for await (const chunk of stream) {

      if (chunk.usageMetadata) {
        inputToken =
          chunk.usageMetadata.promptTokenCount ?? inputToken;

        outputToken =
          chunk.usageMetadata.candidatesTokenCount ?? outputToken;

        totalToken =
          chunk.usageMetadata.totalTokenCount ?? totalToken;
      }

      for (const candidate of chunk.candidates ?? []) {
        for (const part of candidate.content?.parts ?? []) {
          modelParts.push(part);

          if (part.functionCall) {
            functionCallPart = part;
          }
        }
      }

      const text = chunk.text ?? "";

      if (text) {
        fullText += text;
      }
    }


    const functionCall = functionCallPart?.functionCall;


    if (!functionCall?.name) {
      await emitSlowly(fullText, onChunk);

      return {
        text: fullText,

        usage: {
          inputToken,
          outputToken,
          totalToken,
        },
      };
    }

   
    const toolName = functionCall.name;

    const toolArgs = functionCall.args ?? {};

    const toolResult = await mcpClient.callTool({
      name: toolName,
      arguments: toolArgs,
    });


    const finalResponse = await retry(
      () =>
        ai.models.generateContent({
          model:
            process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",

          contents: [
      
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },

            {
              role: "model",
              parts: modelParts,
            },

    
            {
              role: "user",
              parts: [
                {
                  functionResponse: {
                    name: toolName,
                    response: toolResult,
                  },
                },
              ],
            },
          ],
        }),
      {
        retries: 2,
        delay: 1000,
      },
    );


    const finalText = finalResponse.text ?? "";

    await emitSlowly(finalText, onChunk);

    return {
      text: finalText,

      usage: {
        inputToken:
          finalResponse.usageMetadata?.promptTokenCount ??
          inputToken,

        outputToken:
          finalResponse.usageMetadata?.candidatesTokenCount ??
          outputToken,

        totalToken:
          finalResponse.usageMetadata?.totalTokenCount ??
          totalToken,
      },
    };
  }
}