export type TravelIntent = 
 | "destination_recommendation"
 | "itinerary_generation"
 | "destination_comparison"
 | "hotel_recommendation"
 | "attraction_recommendation"
 | "travel_question"
 | "weather_query"
 | "visa_information"
 | "packing_recommendation"
 | "update_trip_context"
 | "clear_trip_context"
 | "general_travel"
 | "prompt_injection"
 | "unknown"

export interface ParsedIntent {
    intent: TravelIntent;
    confidence: number;
}