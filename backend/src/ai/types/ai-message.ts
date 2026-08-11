export type AIRole = "system" | "user" | "assistant"

export interface AIMessage {
    role: AIRole;
    content: string;
}

export interface TravelContext {
    destination?: string;
    origin?: string;
    startDate?: string;
    endDate?: string;
    travellers?: number;
    budget?: number;
    currency?: string;
    interests?: string[];
    travelStyle?: string;
}