import { Message } from "../../models/message.model.js";
import { Thread } from "../../models/thread.model.js";

export const restartConversation = async (
    threadId: string,
    userId: string
) => {
    const thread = await Thread.findOne({
        _id: threadId,
        isAI: true,
        participants: userId,
        status: "active"
    });
    if(!thread) {
        throw new Error("AI thread not found")
    }
    thread.conversationSummary = ""
    thread.summaryMessageCount = 0

    thread.travelContext = {
        destination: undefined,
        origin: undefined,
        startDate: undefined,
        endDate: undefined,
        travellers: undefined,
        budget: undefined,
        currency: undefined,
        interests: [],
        travelStyle: undefined,
    }
    thread.conversationStartedAt = new Date()
    await Message.findByIdAndDelete(threadId)
    await thread.save()
    return thread
}