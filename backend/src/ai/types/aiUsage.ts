export interface AIUsageData {
    inputToken: number;
    outputToken: number;
    totalToken: number;
}

export interface AIGenerationResult {
    text: string;
    usage: AIUsageData;
}