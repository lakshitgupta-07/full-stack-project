import { Message } from "../../models/message.model.js";
import type { AuthenticatedSocket } from "../../types/authenticated-socket.js";
import { getIO } from "../socket.js";

export const messageDelivered = async(
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
    if(message.status !== "read") {
        message.status = "delivered";
        await message.save()
    }
    getIO().to(message.sender.toString()).emit("message-delivered", {
        messageId: message._id,
        status: "delivered"
    });
    return message
}