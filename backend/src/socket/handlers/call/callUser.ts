import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { getIO } from "../../socket.js";
import { getSocketIds } from "../../presence/presence.js";

export const callUser = async(
    socket: AuthenticatedSocket,
    payload: {
        receiverId: string;
        offer: RTCSessionDescriptionInit
    }
) => {
    const receiverSockets = getSocketIds(payload.receiverId)
    if(receiverSockets.length === 0) throw new Error("user is offline");
    receiverSockets.forEach((socketId) => {
        getIO().to(socketId).emit("incoming-call", {
            callerId: socket.user._id.toString(),
            offer: payload.offer
        })
    })
    return {
        message:"Call sent"
    }
}