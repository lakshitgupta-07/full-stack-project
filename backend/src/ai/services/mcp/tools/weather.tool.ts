import * as z from "zod/v4"
import { getWeather } from "../../../../services/weather.service.js"

export const weatherTool = {
    name: "get_weather",
    description: 
        "Get the current weather for a given location." +
        "Use this tool when the user asks about current weather, " +
        "temperature, wind, or current weather condition",
    inputSchema: z.object({
        location: z.string().min(1).describe("The city or location to get weather for")
    }),

    handler: async({location}: {location: string}) => {
        try {
            const weather = await getWeather(location)
            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(weather),
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: error instanceof Error ? error.message : "Unable to retrieve weather"
                    },
                ],
            }
            isError: true
        }
    }
}