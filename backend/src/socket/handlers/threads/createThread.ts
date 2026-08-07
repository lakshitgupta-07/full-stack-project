import { Thread } from "../../../models/thread.model.js";
import { User } from "../../../models/user.model.js";
import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { getIO } from "../../socket.js";

export const createThread = async(
    socket: AuthenticatedSocket,
    payload: {
        receiverId: string
    }
) => {
    if(payload.receiverId === socket.user._id.toString()) {
        throw new Error("You cannot create a thread with yourself")
    }

    const receiver = await User.findById(payload.receiverId)
    if(!receiver) {
        throw new Error("Contact not found")
    }
    const existingThread = await Thread.findOne({
        participants: {
            $all: [socket.user._id, payload.receiverId]
        }
    })
    if(existingThread) {
        return existingThread
    }
    const thread = await Thread.create({
        participants: [
            socket.user._id,
            payload.receiverId
        ],
        createdBy: socket.user._id,
        status: receiver.isAI ? "active" : "pending",
        isAI: receiver.isAI,
        assistantType: receiver.isAI ? "travel" : undefined,
    });
    const populatedThread = await Thread.findById(thread._id)
    .populate("participants", "username avatar")
    .populate("createdBy", "username avatar")
    if (!receiver.isAI) {
        getIO().to(payload.receiverId).emit("thread-request", populatedThread)
    }
    return populatedThread
}
