import { GoogleGenAI } from "@google/genai";
import { Message } from "../../models/message.model.js";
import { Thread } from "../../models/thread.model.js";
import "../../models/user.model.js";
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
})

const SUMMARY_THRESHOLD = 10
const RECENT_MESSAGE_TO_KEEP = 3

export const summarizeConversation = async (
    threadId: string
): Promise<string | null> => {
    const thread = await Thread.findById(threadId);
    if(!thread || !thread.isAI) return null;

    const messages = await Message.find({
        threadId,
    }).sort({createAt: 1}).populate("sender", "username isAI");

    if(messages.length <= SUMMARY_THRESHOLD) {
        return thread.conversationSummary ?? null;
    }
    const currentSummaryCount = thread.summaryMessageCount ?? 0;

    const summaryEndIndex = messages.length - RECENT_MESSAGE_TO_KEEP;

    if(summaryEndIndex <= currentSummaryCount) {
        return thread.conversationSummary ?? null
    }
    const messagesToSummarize = messages.slice(
        currentSummaryCount,
        summaryEndIndex
    )
    if(!messagesToSummarize.length) {
        return thread.conversationSummary ?? null
    }


    const conversation = messagesToSummarize.map((message) => {
        const sender = message.sender as any
        const role = sender?.isAI ? "Assistant" : "User"
        return `${role}: ${message.textMessage}`
    }).join("\n")

    const prompt = `
    You maintain long-term memory for a travel AI assistant.

    Update the existing conversation summary using the new conversation messages.

    IMPORTANT:
    - Preserve important information from the existing summary.
    - Incorporate important information from the new messages.
    - Do not remove useful information unless it has clearly been changed.
    - If the user changes a preference, budget, destination, date, etc.,
    preserve the latest value.
    - Preserve important decisions and rejected options.
    - Preserve unresolved questions or tasks.
    - Do not invent information.
    - Keep the summary concise.

    Important travel information may include:
    - destination
    - origin
    - travel dates
    - number of travellers
    - budget
    - currency
    - interests
    - travel style
    - preferences
    - decisions
    - rejected options
    - constraints
    - unresolved requests

    EXISTING SUMMARY:
    ${thread.conversationSummary ?? "No previous summary"}

    NEW CONVERSATION:
    ${conversation}

    Return ONLY the updated summary.
    `;

    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        contents: prompt
    })
    const summary = response.text?.trim();
    if(!summary) {
        return thread.conversationSummary ?? null;
    }
    thread.conversationSummary = summary
    thread.summaryMessageCount = summaryEndIndex
    await thread.save()
    return summary
}