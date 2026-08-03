import { Message } from "../../../models/message.model.js";
import { Thread } from "../../../models/thread.model.js";
import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";

export const getMessageThread = async(
    socket: AuthenticatedSocket,
    payload: {
        threadId: string
    }
) => {
    if(!payload.threadId) {
        throw new Error("No thread exist")
    }
    const thread = await Thread.findById(payload.threadId)
    if(!thread) {
        throw new Error("Thread not found");
    }
    const isParticipant = thread.participants.some((id) => id.toString() === socket.user._id.toString())
    if(!isParticipant) {
        throw new Error("Unauthorized")
    }
    const message = await Message.find({threadId: payload.threadId}).populate("sender", "username avatar").populate("receiver", "username avatar").sort({createdAt: 1})
    return message
}