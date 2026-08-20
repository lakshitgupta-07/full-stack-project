import type { AuthenticatedSocket } from "../../../types/authenticated-socket.js";
import { getIO } from "../../socket.js";
import { getSocketIds } from "../../presence/presence.js";

export const acceptCall = async(
    socket: AuthenticatedSocket,
    payload: {
        calledId: string,
        answer: RTCSessionDescriptionInit
    }
) => {
    const callerSocketIds = getSocketIds(payload.calledId);

    if(!callerSocketIds.length) throw new Error("Caller is offline");
    callerSocketIds.forEach((socketId) => {
        getIO().to(socketId).emit("call-accepted", {
            answer: payload.answer
        })
    })
}