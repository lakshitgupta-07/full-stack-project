import { GeminiProvider } from "./providers/gemini.provider.js";
import { AIDispatcher } from "./services/dispatcher.service.js";

const provider = new GeminiProvider();
export const dispatcher = new AIDispatcher(provider)