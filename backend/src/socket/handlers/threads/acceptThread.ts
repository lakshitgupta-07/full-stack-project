import { Thread } from "../../../models/thread.model.js";
import { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { getIO } from "../../socket.js";

export const acceptThread = async (
    socket: AuthenticatedSocket,
    payload: {
        threadId: string
    }
) => {
    const thread = await Thread.findById(payload.threadId)
    if (!thread) {
        throw new Error("Chat history not available")
    }
    const isParticipant = thread.participants.some(
        (id) => id.toString() === socket.user._id.toString()
    )
    if (!isParticipant) {
        throw new Error("Unauthorized")
    }
    if (thread.status === "active") {
        throw new Error("Request already accepted")
    }

    thread.status = "active"
    await thread.save()
    const populatedThread = await Thread.findById(thread._id)
        .populate("participants", "username avatar")
        .populate("createdBy", "username avatar")

    thread.participants.forEach((id) => {
        getIO().to(id.toString()).emit("thread-accepted", populatedThread)
    })
    return populatedThread
}