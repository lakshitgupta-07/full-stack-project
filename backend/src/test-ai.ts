import dotenv from "dotenv"
dotenv.config()

console.log(process.env.GEMINI_API_KEY)
import { dispatcher } from "./ai/index.js";

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

// import dotenv from "dotenv"
// dotenv.config()
// import { GoogleGenAI } from "@google/genai"

// console.log(process.env.GEMINI_API_KEY)

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// })

// const res = await ai.models.generateContent({
//     model: "gemini-3.1-flash-lite",
//     contents: "Say hello"
// })

// console.log(res.text)