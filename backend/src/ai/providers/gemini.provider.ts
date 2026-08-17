import type { AIProvider } from "./ai.providers.js";
import { getClient } from "../../config/createClient.js";
import type { AIMessage } from "../types/ai-message.js";
import { retry } from "../../utils/apiRetry.js";
import type { AIGenerationResult } from "../types/aiUsage.js";
import { getMcpClient } from "../services/mcp/client.js";
import { getGeminiMcpTools } from "../services/mcp/gemini-mcp.adapter.js";

export class GeminiProvider implements AIProvider {
  /**
   * Non-streaming Gemini generation with MCP tool support.
   */
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

    /**
     * Get MCP client.
     */
    const mcpClient = await getMcpClient();

    /**
     * Discover MCP tools and convert them
     * into Gemini function declarations.
     */
    const mcpTools = await getGeminiMcpTools(mcpClient);

    /**
     * First Gemini request.
     */
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

    /**
     * Keep Gemini's ORIGINAL model parts.
     *
     * This is important for Gemini 3 because
     * functionCall parts can contain a thoughtSignature.
     */
    const modelParts =
      response.candidates?.[0]?.content?.parts ?? [];

    /**
     * Find the function call, if Gemini requested one.
     */
    const functionCallPart = modelParts.find(
      (part) => part.functionCall,
    );

    const functionCall = functionCallPart?.functionCall;

    /**
     * Gemini did not request a tool.
     *
     * Existing behavior continues normally.
     */
    if (!functionCall?.name) {
      return response.text ?? "";
    }

    /**
     * Gemini requested an MCP tool.
     */
    const toolName = functionCall.name;

    const toolArgs = functionCall.args ?? {};

    /**
     * Execute the MCP tool.
     */
    const toolResult = await mcpClient.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    /**
     * Send the MCP result back to Gemini.
     *
     * IMPORTANT:
     *
     * We use the ORIGINAL modelParts instead
     * of reconstructing the functionCall.
     *
     * This preserves thoughtSignature.
     */
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

  /**
   * Streaming Gemini generation with MCP tool support.
   */
  async generateStream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
  ): Promise<AIGenerationResult> {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    /**
     * Emits the final response slowly to preserve
     * the existing frontend streaming behavior.
     */
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

    /**
     * Get MCP client.
     */
    const mcpClient = await getMcpClient();

    /**
     * Discover MCP tools.
     */
    const mcpTools = await getGeminiMcpTools(mcpClient);

    /**
     * First Gemini streaming request.
     */
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

    /**
     * Store Gemini's ORIGINAL model parts.
     *
     * We must preserve these parts because
     * Gemini 3 function calls can contain
     * thoughtSignature.
     */
    const modelParts: any[] = [];

    /**
     * Store the original functionCall part.
     */
    let functionCallPart: any | undefined;

    /**
     * Consume Gemini stream.
     */
    for await (const chunk of stream) {
      /**
       * Capture token usage.
       */
      if (chunk.usageMetadata) {
        inputToken =
          chunk.usageMetadata.promptTokenCount ?? inputToken;

        outputToken =
          chunk.usageMetadata.candidatesTokenCount ?? outputToken;

        totalToken =
          chunk.usageMetadata.totalTokenCount ?? totalToken;
      }

      /**
       * Capture all original Gemini parts.
       */
      for (const candidate of chunk.candidates ?? []) {
        for (const part of candidate.content?.parts ?? []) {
          modelParts.push(part);

          if (part.functionCall) {
            functionCallPart = part;
          }
        }
      }

      /**
       * Capture normal text.
       */
      const text = chunk.text ?? "";

      if (text) {
        fullText += text;
      }
    }

    /**
     * Extract function call from the ORIGINAL part.
     */
    const functionCall = functionCallPart?.functionCall;

    /**
     * Gemini did not request an MCP tool.
     *
     * Preserve existing streaming behavior.
     */
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

    /**
     * Gemini requested an MCP tool.
     */
    const toolName = functionCall.name;

    const toolArgs = functionCall.args ?? {};

    /**
     * Execute MCP tool.
     */
    const toolResult = await mcpClient.callTool({
      name: toolName,
      arguments: toolArgs,
    });

    /**
     * Send the MCP result back to Gemini.
     *
     * IMPORTANT:
     *
     * We DO NOT recreate the functionCall here.
     *
     * modelParts contains Gemini's original
     * functionCall + thoughtSignature.
     */
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
             * Original Gemini model response.
             *
             * Preserves thoughtSignature.
             */
            {
              role: "model",
              parts: modelParts,
            },

            /**
             * MCP result.
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

    /**
     * Final Gemini answer.
     */
    const finalText = finalResponse.text ?? "";

    /**
     * Stream the final answer to the frontend.
     */
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