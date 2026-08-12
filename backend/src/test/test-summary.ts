import "dotenv/config"

import connectDB from "../db/index.js"
import { summarizeConversation } from "../ai/services/conversation-summary.service.js"
import "../models/user.model.js"

const THREAD_ID = "6a7aca1500cb7f504cd240be"

await connectDB()
console.log("Starting summarize")

try {
    const summary = await summarizeConversation(THREAD_ID)
    console.log(summary)
} catch (error) {
    console.error(error)
}

