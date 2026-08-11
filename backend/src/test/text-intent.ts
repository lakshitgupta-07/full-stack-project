import "dotenv/config"
import { parsedIntent } from "../ai/services/intent.service.js"

const messages = [
    "Where should I go in October?",
    "Plan a 7 day trip to Japan",
    "Bali or Thailand for a honeymoon?",
    "Find hotels in Goa",
    "What are the best attractions in Paris?",
    "What's the weather in Dubai?",
    "Do I need a visa for Japan?",
    "What should I pack for Iceland?",
    "Actually change my budget to ₹50000",
    "Forget my destination",
]

for (const message of messages) {
    const result = await parsedIntent(message)
    console.log("\nUser: ", message)
    console.log("\nAI: ", result)
}