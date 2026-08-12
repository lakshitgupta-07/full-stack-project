import { AIMessage } from "../types/ai-message.js";
import { AIGenerationResult } from "../types/aiUsage.js";

export interface AIProvider {
    generate (messages: AIMessage[]): Promise<string>;
    generateStream (messages: AIMessage[], onChunk: (chunk: string) => void): Promise<AIGenerationResult>
}