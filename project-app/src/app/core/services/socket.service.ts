import { Injectable, inject } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { environment } from "../../../environment/envirenment";
import { ChatService } from "./chat.service";
import { Thread, ChatMessage } from "../models/chat.model";
import { AuthStateService } from "./auth-state.service";

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket!: Socket;
    private authState = inject(AuthStateService);

    connect(token: string): void {
        if(this.socket?.connected) {
            return
        }
        
        this.socket = io(environment.socketUrl, {
            auth: {
                token,
            },
            transports: ['websocket']
        });
    }

    disconnect(): void {
        if(this.socket) {
            this.socket.disconnect();
        }
    }

    getSocket(): Socket {
        return this.socket
    }

    emit(event: string, data?: any, callback?: (...args: any[]) => void): void {
        this.socket.emit(event, data, callback)
    }

    on(event: string, callback: (...args: any[]) => void): void {
        this.socket.on(event, callback)
    }

    once(event: string, callback: (...args: any[]) => void): void {
        this.socket.once(event, callback)
    }

    off(event: string): void {
        this.socket.off(event)
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    getMyThread(chatService: ChatService) {
        this.socket?.emit(
            "get-my-thread",
            {},
            (response: any) => {
                if(response.success) {
                    chatService.setThread(
                        response.threads
                    )
                }
            }
        )
    }

    joinThread(threadId: string) {
        this.socket?.emit(
            "join-thread",
            { threadId },
            (response: any) => {
                if (response && !response.success) {
                    console.error("Failed to join thread room:", response.error);
                }
            }
        )
    }

    createGroup(
        groupName: string,
        participants: string[],
        callback?: Function
    ) {
        this.emit(
            "create-group",
            {
                groupName,
                participants
            },
            callback as any
        )
    }

    getThreadMessage(
        threadId: string,
        chatService: ChatService
    ) {
        this.socket?.emit(
            "get-thread-message",
            {
                threadId
            },
            (response: any) => {
                if(response.success) {
                    chatService.setMessage(response.message);
                    
                    const currentUserId = this.authState.user?._id;
                    if (currentUserId && Array.isArray(response.message)) {
                        response.message.forEach((msg: ChatMessage) => {
                            const isReceived = msg.receiver?._id === currentUserId || (typeof msg.receiver === 'string' && msg.receiver === currentUserId);
                            if (isReceived && msg.status !== 'read') {
                                this.emit("mark-seen", { messageId: msg._id });
                            }
                        });
                    }
                }
            }
        )
    }

    initializeChatListeners(chatService: ChatService) {
        this.on(
            "thread-request",
            (thread: Thread) => {
                chatService.addThread(thread)
            }
        );
        this.on(
            "thread-accepted",
            (thread: Thread) => {
                chatService.updateThread(thread);
                if (chatService.selectedThread()?._id === thread._id) {
                    this.joinThread(thread._id);
                }
            }
        );
        this.on(
            "group-created",
            (thread: Thread) => {
                chatService.addThread(thread)
            }
        )
        this.on(
            "new-message",
            (message: ChatMessage) => {
                if (chatService.selectedThread()?._id === message.threadId) {
                    chatService.addMessage(message);
                    
                    const currentUserId = this.authState.user?._id;
                    if (currentUserId) {
                        const isReceived = message.receiver?._id === currentUserId || (typeof message.receiver === 'string' && message.receiver === currentUserId);
                        if (isReceived) {
                            this.emit("message-delivered", { messageId: message._id });
                            this.emit("mark-seen", { messageId: message._id });
                        }
                    }
                } else {
                    const currentUserId = this.authState.user?._id;
                    if (currentUserId) {
                        const isReceived = message.receiver?._id === currentUserId || (typeof message.receiver === 'string' && message.receiver === currentUserId);
                        if (isReceived) {
                            this.emit("message-delivered", { messageId: message._id });
                        }
                    }
                }
            }
        );
        this.on(
            "message-delivered",
            (updatedMsg: ChatMessage) => {
                if (chatService.selectedThread()?._id === updatedMsg.threadId) {
                    chatService.messages.update(messages =>
                        messages.map(m => m._id === updatedMsg._id ? { ...m, status: updatedMsg.status } : m)
                    );
                }
            }
        );
        this.on(
            "message-seen",
            (data: { messageId: string, seen: boolean, status: string }) => {
                chatService.messages.update(messages =>
                    messages.map(m => m._id === data.messageId ? { ...m, seen: data.seen, status: data.status as any } : m)
                );
            }
        );
        this.on(
            "user-typing",
            (data) => {
                chatService.setTyping(
                    data.threadId,
                    data.username
                )
            }
        );
        this.on(
            "user-stop-typing",
            (data) => {
                chatService.removeTyping(
                    data.threadId,
                )
            }
        );
        this.on(
            "ai-stream",
            (data: {
                threadId: string;
                messageId: string;
                chunk: string
            }) => {
                if(chatService.selectedThread()?._id !== data.threadId) return;
                chatService.appendAiStream(
                    data.messageId,
                    data.threadId,
                    data.chunk
                )
            }
        )
        this.on(
            "ai-stream-end",
            (data: {
                threadId: string;
                messageId: string;
                message: ChatMessage;
            }) => {
                if(chatService.selectedThread()?._id !== data.threadId) {
                    return;
                }
                chatService.finishAiStream(
                    data.message,
                )
            }
        )
    }
}