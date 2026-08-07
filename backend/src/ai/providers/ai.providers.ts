export interface AIProvider {
    generate (
        messages: {
            role: "system" | "user" | "assistant";
            content: string;
        }[]
    ): Promise<string>;
}