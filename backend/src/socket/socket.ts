import { Server } from "socket.io"
import type { Server as HttpServer } from "http"
import { socketAuth } from "./socketAuth.js";
import { registerChatEvents } from "./chat.socket.js";
import { AuthenticatedSocket } from "../types/authenticated-socket.js";
import { createThread } from "./handlers/threads/createThread.js";
import { acceptThread } from "./handlers/threads/acceptThread.js";
import { sendMessage } from "./handlers/message/sendMessage.js";
import { getMessageThread } from "./handlers/message/getThreadMessage.js";
import { addUser, removeUser, getOnlineUsers, setActiveThread, clearActiveThread } from "./presence/presence.js";
import { markSeen } from "./handlers/message/markSeen.js";
import { messageDelivered } from "./handlers/message/messageDelivered.js";
import { getMyThread } from "./handlers/threads/getMyThreads.js";
import { createGroup } from "./handlers/group/createGroup.js";
import { Thread } from "../models/thread.model.js";
import crypto from "node:crypto"
import { callUser } from "./handlers/call/callUser.js";
import { acceptCall } from "./handlers/call/acceptCall.js";
import { iceCandidate } from "./handlers/call/iceCandidates.js";


let io: Server;

export const initializeSocket = (server: HttpServer) => {
    console.log("Initializing Socket.IO...");

    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        },
    });
//     const allowedOrigins = [
//   "http://localhost:4200",
// //   "http://192.168.1.10:4200",
// ];

// io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     credentials: true,
//   },
// });
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
                    const textMessage = await sendMessage(authSocket, payload, callback);
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
            "call-user", 
            async (payload, callback) => {
                try {
                    const result = await callUser(authSocket, payload);
                    callback({
                        success: true,
                        ...result
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
            "accept-call",
            async (payload, callback) => {
                try {
                    await acceptCall(authSocket, payload)
                    callback({
                        success: true,
                    })
                } catch (err: any) {
                    if(callback){
                        callback({
                        success: false,
                        error: err.message
                    })
                }
                }
            }
        )
        authSocket.on(
            "ice-candidate",
            async (payload) => {
                try {
                    await iceCandidate(authSocket, payload)
                } catch (error) {
                    console.error("Ice candidate forwarding failed", error)
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
            "mark-thread-read",
            async(
                payload: {threadId: string},
                callback: (response: any) => void
            ) => {
                try {
                    const thread = await Thread.findOne({
                        _id: payload.threadId,
                        participants: authSocket.user._id
                    });
                    if(!thread) {
                        callback({
                            success: false,
                            error: "Thread not found"
                        });
                        return;
                    }
                    const userId = authSocket.user._id.toString();
                    thread.unreadCount.set(userId, 0)
                    await thread.save()
                    callback({
                        success: true,
                        threadId: payload.threadId,
                        unreadCount: 0
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
                if(authSocket.activeThreadId) {
                    authSocket.leave(authSocket.activeThreadId)
                }
                authSocket.join(payload.threadId);
                authSocket.activeThreadId = payload.threadId;
                callback({
                    success: true,
                    threadId: payload.threadId,
                    unreadCount: 0
                });
            }
        )
        authSocket.on(
            "call-user",
            (
                payload: {
                    receiverId: string;
                    threadId: string;
                    callType: "audio" | "video"
                },
                callback
            ) => {

            }
        )
        authSocket.on(
            "leave-thread",
            (
                payload: {threadId: string},
                callback?: (response: any) => void,
            ) => {
                try {
                    if(!payload?.threadId) {
                        callback?.({
                            success: false,
                            error: "Thread Id required"
                        })
                        return
                    }
                    authSocket.leave(payload.threadId)
                    if(authSocket.activeThreadId === payload.threadId) {
                        authSocket.activeThreadId = undefined
                    }
                    callback?.({
                        success: true,
                    })
                } catch (err: any) {
                    callback?.({
                        success: false,
                        error: err.message
                    })
                }
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
        authSocket.on(
            "restart-ai-conversation",
            async (
                payload: {threadId: string},
                callback?: (response: any) => void,
            ) => {
                try {
                    if(!payload?.threadId) {
                        callback?.({
                            success: false,
                            error: "Thread Id is required",
                        });
                        return
                    }
                    const {restartConversation} = await import ("../ai/services/restart-conversation.service.js")
                    const thread = restartConversation(payload.threadId, authSocket.user._id.toString())
                    callback?.({
                        success: true,
                        thread
                    });
                } catch (err: any) {
                    console.error("Restart AI conversation failed", err)
                    callback?.({
                        success: false,
                        error: err.message
                    })
                }
            }
        )
        authSocket.on(
            "clear-conversation", 
            async(
                payload: { threadId: string },
                callback?: (response: any) => void,
            ) => {
                try {
                    if(!payload?.threadId) {
                        callback?.({
                            success: false,
                            error: "Thread Id is required"
                        })
                        return
                    }
                    const {restartHumanConversation} = await import ("../ai/services/restart-conversation.service.js")
                    const thread = await restartHumanConversation(payload.threadId)
                    authSocket.to(payload.threadId).emit("conversation-cleared", {
                        threadId: payload.threadId
                    })
                    callback?.({
                        success: true,
                        thread
                    })
                } catch (err: any) {
                    callback?.({
                        success: false,
                        error: err.message
                    })
                }
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
    // if (!io) {
    //     throw new Error("Socket.ID not intialized")
    // }
    return io;
}
