import { AIProvider } from "../providers/ai.providers.js";

export class AIDispatcher {
    constructor(
        private provider: AIProvider
    ) {}

    async ask(messages: any[]) {
        return this.provider.generateStream(messages, (chunk) => {console.log(chunk)});
    }
}