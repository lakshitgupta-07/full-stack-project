import { AIMessage } from "../types/ai-message.js";

export interface AIProvider {
    generate (messages: AIMessage[]): Promise<string>;
    generateStream (messages: AIMessage[], onChunk: (chunk: string) => void): Promise<string>
}