import { Message } from "../../../models/message.model.js";
import { getIO } from "../../socket.js";
import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { Thread } from "../../../models/thread.model.js";

export const sendMessage = async (
  socket: AuthenticatedSocket,
  payload: {
    threadId: string;
    textMessage?: string;
    
    image?: {
      url: string,
      publicId: string
    }
  },
) => {
  const hasText = payload.textMessage && payload.textMessage.trim().length > 0;
  const hasImage = payload.image && payload.image.url
  if (!hasText && !hasImage) {
    throw new Error("Message cannot be empty");
  }
  const thread = await Thread.findOne({
    _id: payload.threadId,
    status: "active"
  });
  if (!thread) {
    throw new Error("No active thread found");
  }
  const receiver = thread.participants.find(
    (id) => id.toString() !== socket.user._id.toString(),
  );
  if (!receiver) {
    throw new Error("Receiver not found");
  }

  const message = await Message.create({
    threadId: thread._id,
    sender: socket.user._id,
    receiver: receiver,
    textMessage: payload.textMessage ?? "",
    image: payload.image ?? {
      url: "",
      publicId: ""
    }
  });
  thread.lastMessage = message._id
  thread.lastMessageAt = new Date();
  await thread.save()

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username avatar")
    .populate("receiver", "username avatar")
  getIO().to(receiver.toString()).emit("new-message", populatedMessage);
  // getIO().to(socket.user._id.toString()).emit("new-message", populatedMessage);
  return populatedMessage;
};
