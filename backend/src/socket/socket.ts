import { Server } from "socket.io"
import type { Server as HttpServer } from "http"
import { socketAuth } from "./socketAuth.js";
import { registerChatEvents } from "./chat.socket.js";
import { AuthenticatedSocket } from "../types/authenticated-socket.js";
import { createThread } from "./handlers/threads/createThread.js";
import { acceptThread } from "./handlers/threads/acceptThread.js";
import { sendMessage } from "./handlers/message/sendMessage.js";
import { getMessageThread } from "./handlers/message/getThreadMessage.js";
import { addUser, removeUser, getOnlineUsers } from "./presence/presence.js";
import { markSeen } from "./handlers/message/markSeen.js";
import { messageDelivered } from "./handlers/message/messageDelivered.js";
import { getMyThread } from "./handlers/threads/getMyThreads.js";
import { createGroup } from "./handlers/group/createGroup.js";

let io: Server;

export const initializeSocket = (server: HttpServer) => {
    console.log("Initializing Socket.IO...");

    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        },
    });
    io.use(socketAuth)
    io.on("connection", (socket) => {
        const authSocket = socket as AuthenticatedSocket
        socket.join(authSocket.user._id.toString())
        addUser(
            authSocket.user._id.toString(),
            socket.id
        )
        io.emit(
            "user-online",
            {
                userId: authSocket.user._id,
                username: authSocket.user.username
            }
        )
        socket.emit(
            "online-users",
            getOnlineUsers()
        )
        console.log(`${authSocket.user.username} joined room ${authSocket.user._id.toString()}`);
        authSocket.on(
            "create-thread",
            async (payload, callback) => {
                try {
                    const threadRequest = await createThread(authSocket, payload)
                    callback({
                        success: true,
                        message: threadRequest
                    })
                    console.log("Create thread received", payload)
                } catch (err: any) {
                    callback({
                        success: false,
                        error: err.message
                    })
                }
            }
        )
        authSocket.on(
            "accept-thread",
            async (payload, callback) => {
                try {
                    const acceptedThread = await acceptThread(authSocket, payload)
                    callback({
                        success: true,
                        thread: acceptedThread
                    })
                    console.log("Thread accepted", payload)
                } catch (err: any) {
                    callback({
                        success: false,
                        error: err.message
                    })
                }
            }
        )
        authSocket.on(
            "create-group",
            async (payload, callback) => {
                try {
                    const groupThread = await createGroup(authSocket, payload)
                    callback({
                        success: true,
                        groupThread
                    })
                } catch (err: any) {
                    callback({
                        success: false,
                        error: err.message
                    })
                }
            }
        )
        authSocket.on(
            "get-my-thread",
            async (_, callback) => {
                try {
                    const threads = await getMyThread(authSocket)

                    callback({
                        success: true,
                        threads
                    })
                } catch (err: any) {
                    callback({
                        success: false,
                        error: err.message
                    })
                }
            }
        )
        registerChatEvents(authSocket)
        authSocket.on(
            "send-message",
            async (payload, callback) => {
                try {
                    const textMessage = await sendMessage(authSocket, payload);
                    callback({
                        success: true,
                        message: textMessage
                    })
                } catch (err: any) {
                    callback({
                        success: false,
                        error: err.message
                    });
                }
            }
        )
        authSocket.on(
            "message-delivered",
            async (payload, callback) => {
                try {
                    const message = await messageDelivered(authSocket, payload)
                    callback({
                        success: true,
                        message: message
                    })
                } catch (err: any) {
                    if(callback) {
                        callback({
                            success: false,
                            error: err.message
                        })
                    }
                }
            }
        )
        authSocket.on(
            "mark-seen",
            async (payload, callback) => {
                try {
                    const message = await markSeen(authSocket, payload)
                    if (callback) {
                        callback({
                            success: true,
                            message: message
                        })
                    }
                } catch (err: any) {
                    if (callback) {
                        callback({
                            success: false,
                            error: err.message
                        })
                    }
                }
            }
        )
        authSocket.on(
            "get-thread-message",
            async (payload, callback) => {
                try {
                    const message = await getMessageThread(authSocket, payload)
                    callback({
                        success: true,
                        message: message
                    })
                } catch (err: any) {
                    callback({
                        success: false,
                        error: err.message
                    })
                }
            }
        )
        authSocket.on(
            "join-thread",
            (
                payload: {
                    threadId: string;
                },
                callback
            ) => {
                authSocket.join(payload.threadId);
                callback({
                    success: true
                });
            }
        )
        authSocket.on(
            "typing",
            (
                payload: {
                    threadId: string;
                }
            ) => {
                authSocket.to(payload.threadId).emit(
                    "user-typing",
                    {
                        threadId: payload.threadId,
                        userId: authSocket.user._id,
                        username: authSocket.user.username
                    }
                )
            }
        )
        authSocket.on(
            "stop-typing",
            (
                payload: {
                    threadId: string;
                }
            ) => {
                authSocket.to(payload.threadId).emit(
                    "user-stop-typing",
                    {
                        threadId: payload.threadId,
                        userId: authSocket.user._id
                    }
                )
            }
        )
        socket.on("disconnect", () => {
            removeUser(
                authSocket.user._id.toString(),
                socket.id
            );
            io.emit(
                "user-offline",
                {
                    userId: authSocket.user._id,
                    username: authSocket.user.username
                }
            );
            console.log(`${authSocket.user.username} disconnected`)
        });
    });
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.ID not intialized")
    }
    return io;
}