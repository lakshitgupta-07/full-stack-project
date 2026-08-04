import {Thread} from "../../../models/thread.model.js";
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
    })
    return threads
}
