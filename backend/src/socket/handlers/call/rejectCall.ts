import type { Socket } from "socket.io";
import { getSocketIds } from "../../presence/presence.js";

interface RejectCallPayload {
    callId: string;
}

export async function rejectCall(
    socket: Socket,
    payload: RejectCallPayload
): Promise<void> {

    const { callId } = payload;

    if (!callId) {
        throw new Error("Caller ID is required");
    }

    const callerSocketIds = getSocketIds(callId);

    if (callerSocketIds.length === 0) {
        return;
    }

    for (const socketId of callerSocketIds) {
        socket.to(socketId).emit("call-rejected");
    }
}