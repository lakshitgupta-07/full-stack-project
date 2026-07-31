import { Message } from "../../models/message.model.js";
import type { AuthenticatedSocket } from "../../types/authenticated-socket.js";
import { getIO } from "../socket.js";

export const markSeen = async(
    socket: AuthenticatedSocket,
    payload: {
        messageId: string
    }
) => {
    const message = await Message.findById(payload.messageId)
    if(!message) {
        throw new Error("Message not found")
    }
    if(message.receiver.toString() !== socket.user._id.toString()) {
        throw new Error("Unauthorized")
    }

    message.seen = true;
    message.status = "read"

    await message.save();

    getIO().to(message.sender.toString()).emit("message-seen", {
        messageId: message._id,
        seen: true,
        status: "read"
    });
    return message
}