import {Thread} from "../../../models/thread.model.js";
import {Message} from "../../../models/message.model.js";
import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";

export const getMyThread = async (
    socket: AuthenticatedSocket
) => {
    const threads = await Thread.find({
        participants: socket.user._id
    })
    .populate("participants", "username avatar")
    .populate("createdBy", "username avatar")
    .sort({
        updatedAt: -1
    });

    const threadsWithUnread = await Promise.all(threads.map(async (thread) => {
        const unreadCount = await Message.countDocuments({
            threadId: thread._id,
            seen: false,
            receiver: socket.user._id
        });
        const threadObj = thread.toObject() as any;
        threadObj.unreadCount = {
            [socket.user._id.toString()]: unreadCount
        };
        return threadObj;
    }));

    return threadsWithUnread;
}
