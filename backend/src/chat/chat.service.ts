import { Message } from "../models/message.model.js";

export const saveMessageService = async(
    sender: string,
    receiver: string,
    textMessage: string
) => {
    const chat = await Message.create({
        sender,
        receiver,
        textMessage,
        status: 'sent',
    });

    return chat.populate([
        {
            path: "sender",
            select: "username avatar",
        },
        {
            path: "receiver",
            select: "username avatar"
        },
    ]);
};

export const getConversationHistory = async(
    user1: string,
    user2: string,
) => {
    return Message.find({
        $or: [
            {
                sender: user1,
                receiver: user2,
            },
            {
                sender: user2,
                receiver: user1,
            },
        ],
    }).sort({
        createdAt: 1,
    }).populate("sender", "username avatar").populate("receiver", "username avatar")
};