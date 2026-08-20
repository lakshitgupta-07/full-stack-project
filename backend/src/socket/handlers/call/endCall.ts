import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { getSocketIds } from "../../presence/presence.js";
import { getIO } from "../../socket.js";

export const endCall = async(
    socket: AuthenticatedSocket,
    payload: {
        receiverId: string,
    }
) => {
    const receiverId = payload.receiverId
    if(!receiverId)  throw new Error("receiver id required");
    const callerId = socket.user._id.toString()
    if(!callerId) throw new Error("user not authenticated");

    const receiverSockets = getSocketIds(receiverId)

    receiverSockets.forEach((socketId) => {
        getIO().to(socketId).emit("call-ended", {
            callerId
        })
    })
}