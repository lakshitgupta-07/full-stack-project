import dotenv from "dotenv"
dotenv.config()

console.log(process.env.GEMINI_API_KEY)
import { dispatcher } from "../ai/index.js";

const response = await dispatcher.ask([
    {
        role: "system",
        content: "You are a travel assistant."
    },
    {
        role: "user",
        content: "Plan a 5 day Goa trip."
    }
]);

console.log(response);