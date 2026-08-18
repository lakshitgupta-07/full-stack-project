import { Message } from "../../../models/message.model.js";
import { getIO } from "../../socket.js";
import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { Thread } from "../../../models/thread.model.js";
import { User } from "../../../models/user.model.js";
import {
  detectPromptInjection,
  getPromptInjectionResponse,
} from "../../../ai/services/prompt-injection.service.js";
import { aiRateLimitter } from "../../../middlewares/aiRateLimit.middleware.js";
import { getSocketIds } from "../../presence/presence.js";

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
  callback?: (response: any) => void,
) => {
  const hasText = payload.textMessage && payload.textMessage.trim().length > 0;
  const hasImage = payload.image && payload.image.url;
  const hasVideo = payload.video && payload.video.url;
  // const hasAudio = payload.audio && payload.audio.url;
  if (!hasText && !hasImage && !hasVideo) {
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
  const receiverId = receiver.toString();
  const receiverSocketId = getSocketIds(receiverId);
  let receiverIsViewingThread = false;

  for (const socketId of receiverSocketId) {
    const receiverSocket = getIO().sockets.sockets.get(socketId);
    if (receiverSocket) continue;
    const authenticatedReceiverSocket =
      receiverSocket as unknown as AuthenticatedSocket;
    if (authenticatedReceiverSocket.activeThreadId === thread._id.toString()) {
      receiverIsViewingThread = true;
      break;
    }
  }
  if (!isAIThread && !thread.isGroup) {
    if (!receiverIsViewingThread) {
      const currentUnread = thread.unreadCount.get(receiverId) ?? 0;

      thread.unreadCount.set(receiverId, currentUnread + 1);
    }
  }
  if (thread.isGroup) {
    for (const participantId of thread.participants) {
      const participantIdString = participantId.toString();

      if (participantIdString === socket.user._id.toString()) {
        continue;
      }

      const socketIds = getSocketIds(participantIdString);

      let isViewingThread = false;

      for (const socketId of socketIds) {
        const participantSocket = getIO().sockets.sockets.get(socketId);

        if (!participantSocket) continue;

        const authenticatedSocket = participantSocket as AuthenticatedSocket;

        if (authenticatedSocket.activeThreadId === thread._id.toString()) {
          isViewingThread = true;
          break;
        }
      }

      if (!isViewingThread) {
        const currentUnread = thread.unreadCount.get(participantIdString) ?? 0;

        thread.unreadCount.set(participantIdString, currentUnread + 1);
      }
    }
  } else if (!isAIThread) {
    if (!receiverIsViewingThread) {
      const currentUnread = thread.unreadCount.get(receiverId) ?? 0;

      thread.unreadCount.set(receiverId, currentUnread + 1);
    }
  }
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
    const rateLimit = await aiRateLimitter(socket.user._id.toString());
    if (!rateLimit.allowed) {
      const limitMessageText = `Travel AI chat limit exceeded, please wait for ${rateLimit.retryAfter} secs.`;

      const aiUser = await User.findOne({ isAI: true });
      if (aiUser) {
        const errorMessage = await Message.create({
          threadId: thread._id,
          sender: aiUser._id,
          receiver: socket.user._id,
          textMessage: limitMessageText,
          status: "sent",
        });

        const populatedErrorMessage = await Message.findById(errorMessage._id)
          .populate("sender", "username avatar isAI")
          .populate("receiver", "username avatar isAI");

        getIO()
          .to(socket.user._id.toString())
          .emit("new-message", populatedErrorMessage);
      }

      callback?.({
        success: false,
        error: limitMessageText,
      });
      return;
    }
    const injectedPrompt = detectPromptInjection(payload.textMessage ?? "");
    if (injectedPrompt.detected) {
      const aiUser = await User.findOne({
        isAI: true,
      });
      if (!aiUser) {
        callback?.({
          success: false,
          error: "Travel AI currently available",
        });
        return;
      }
      const safeResponse = getPromptInjectionResponse();
      const aiMessage = await Message.create({
        threadId: thread._id,
        sender: aiUser._id,
        receiver: socket.user._id,
        textMessage: safeResponse,
        intent: "prompt_injection",
      });
      thread.lastMessage = aiMessage._id;
      thread.lastMessageAt = new Date();

      await thread.save();

      const populatedAIMessage = await Message.findById(aiMessage._id)
        .populate("sender", "username avatar isAI")
        .populate("receiver", "username avatar isAI");
      callback?.({
        success: true,
        message: populatedMessage,
      });
      getIO()
        .to(socket.user._id.toString())
        .emit("new-message", populatedAIMessage);
      return;
    }
    getIO().to(socket.user._id.toString()).emit("user-typing", {
      threadId: thread._id,
      username: "Travel AI",
    });
    void (async () => {
      try {
        const aiChatService =
          await import("../../../ai/services/ai-chat.service.js");
        let aiMessageId: string | null = null;
        const aiMessage = await aiChatService.reply(
          thread._id.toString(),
          (messageId, chunk) => {
            aiMessageId = messageId;
            getIO().to(socket.user._id.toString()).emit("ai-stream", {
              threadId: thread._id,
              messageId,
              chunk,
            });
          },
        );
        if (aiMessage) {
          getIO().to(socket.user._id.toString()).emit("ai-stream-end", {
            threadId: thread._id,
            messageId: aiMessageId,
            message: aiMessage,
          });
        }
      } catch (error) {
        console.error("Travel AI reply failed", error);

        const aiUser = await User.findOne({ isAI: true });
        if (aiUser) {
          const errorMessage = await Message.create({
            threadId: thread._id,
            sender: aiUser._id,
            receiver: socket.user._id,
            textMessage:
              "Travel AI could not generate a reply. Please try again.",
            status: "sent",
          });

          const populatedErrorMessage = await Message.findById(errorMessage._id)
            .populate("sender", "username avatar isAI")
            .populate("receiver", "username avatar isAI");

          getIO()
            .to(socket.user._id.toString())
            .emit("new-message", populatedErrorMessage);
        }
      } finally {
        getIO().to(socket.user._id.toString()).emit("user-stop-typing", {
          threadId: thread._id,
        });
      }
    })();
  }
  return populatedMessage;
};
