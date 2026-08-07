import { Message } from "../../../models/message.model.js";
import { getIO } from "../../socket.js";
import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { Thread } from "../../../models/thread.model.js";
import { User } from "../../../models/user.model.js";
// import aiChatService from "../../../ai/services/ai-chat.service.js";

export const sendMessage = async (
  socket: AuthenticatedSocket,
  payload: {
    threadId: string;
    textMessage?: string;

    image?: {
      url: string;
      publicId: string;
    };
    video?: {
      url: string;
      publicId: string;
    };
    audio?: {
      url: string;
      publicId: string;
    };
  },
) => {
  const hasText = payload.textMessage && payload.textMessage.trim().length > 0;
  const hasImage = payload.image && payload.image.url;
  const hasVideo = payload.video && payload.video.url;
  const hasAudio = payload.audio && payload.audio.url;
  if (!hasText && !hasImage && !hasVideo && !hasAudio) {
    throw new Error("Message cannot be empty");
  }
  const thread = await Thread.findOne({
    _id: payload.threadId,
    status: "active",
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
  const receiverUser = await User.findById(receiver).select("isAI");
  const isAIThread = thread.isAI || Boolean(receiverUser?.isAI);

  // Repair threads made before AI fields were added to the standard thread flow.
  if (isAIThread && !thread.isAI) {
    thread.isAI = true;
    thread.assistantType = "travel";
  }

  const message = await Message.create({
    threadId: thread._id,
    sender: socket.user._id,
    receiver: receiver,
    textMessage: payload.textMessage ?? "",
    image: payload.image ?? {
      url: "",
      publicId: "",
    },
    video: payload.video ?? {
      url: "",
      publicId: "",
    },
    audio: payload.audio ?? {
      url: "",
      publicId: "",
    },
  });
  thread.lastMessage = message._id;
  thread.lastMessageAt = new Date();
  await thread.save();

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username avatar")
    .populate("receiver", "username avatar");

  if (thread.isGroup) {
    thread.participants.forEach((participantId) => {
      if (participantId.toString() !== socket.user._id.toString()) {
        getIO()
          .to(participantId.toString())
          .emit("new-message", populatedMessage);
      }
    });
  } else {
    getIO().to(receiver.toString()).emit("new-message", populatedMessage);
  }
  if (isAIThread) {
    getIO().to(socket.user._id.toString()).emit("user-typing", {
      threadId: thread._id,
      username: "Travel AI",
    });

    // A model response can take much longer than a Socket.IO acknowledgement.
    // Keep the send acknowledgement independent, then deliver the AI message when ready.
    void (async () => {
      try {
        const aiChatService = await import("../../../ai/services/ai-chat.service.js");
        const aiMessage = await aiChatService.reply(thread._id.toString());
        if (aiMessage) {
          getIO().to(socket.user._id.toString()).emit("new-message", aiMessage);
        }
      } catch (error) {
        console.error("Travel AI reply failed", error);
        getIO().to(socket.user._id.toString()).emit("ai-chat-error", {
          threadId: thread._id,
          message: "Travel AI could not generate a reply. Please try again.",
        });
      } finally {
        getIO().to(socket.user._id.toString()).emit("user-stop-typing", {
          threadId: thread._id,
        });
      }
    })();
  }
  return populatedMessage;
};
