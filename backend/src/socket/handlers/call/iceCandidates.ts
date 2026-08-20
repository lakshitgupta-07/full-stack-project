import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { getIO } from "../../socket.js";
import { getSocketIds } from "../../presence/presence.js";

export const iceCandidate = async(
    socket: AuthenticatedSocket,
    payload: {
        receiverId: string;
        candidate: RTCIceCandidateInit;
    }
) => {
    const receiverSocketIds = getSocketIds(payload.receiverId)
    if(!receiverSocketIds.length) return
    receiverSocketIds.forEach((socketId) => {
        getIO().to(socketId).emit("ice-candidates",
            {
                sender: socket.user._id.toString(),
                candidate: payload.candidate
            }
        )
    })
}