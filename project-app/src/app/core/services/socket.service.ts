import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environment/envirenment';
import { ChatService } from './chat.service';
import { Thread, ChatMessage } from '../models/chat.model';
import { AuthStateService } from './auth-state.service';
import { WebRTCService } from './webrtc.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private authState = inject(AuthStateService);
  private webRTCService = inject(WebRTCService);
  private listenersInitialized = false;
  private remoteUserId: string | null = null;
  private callEndedSubject = new Subject<void>();
  callEnded$ = this.callEndedSubject.asObservable();

  private callAcceptedSubject = new Subject<void>();
  callAccepted$ = this.callAcceptedSubject.asObservable();

  private incomingCallSubject = new Subject<{
    callerId: string;
    callerUsername?: string;
    offer: RTCSessionDescriptionInit;
  }>();
  incomingCall$ = this.incomingCallSubject.asObservable();

  private callRejectedSubject = new Subject<void>();
  callRejected$ = this.callRejectedSubject.asObservable();

  constructor() {
    this.webRTCService.iceCandidate$.subscribe((candidate) => {
      if (this.remoteUserId) {
        this.socket?.emit('ice-candidate', {
          receiverId: this.remoteUserId,
          candidate,
        });
      }
    });
  }
  private cleanupCall(): void {
    this.webRTCService.close();
    this.remoteUserId = null;
  }

  getRemoteUserId(): string | null {
    return this.remoteUserId;
  }

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.listenersInitialized = false;
    }
  }

  getSocket(): Socket {
    return this.socket;
  }

  emit(event: string, data?: any, callback?: (...args: any[]) => void): void {
    this.socket.emit(event, data, callback);
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  once(event: string, callback: (...args: any[]) => void): void {
    this.socket.once(event, callback);
  }

  off(event: string): void {
    this.socket.off(event);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getMyThread(chatService: ChatService) {
    this.socket?.emit('get-my-thread', {}, (response: any) => {
      if (response.success) {
        chatService.setThread(response.threads);
      }
    });
  }

  joinThread(threadId: string) {
    this.socket?.emit('join-thread', { threadId }, (response: any) => {
      if (response && !response.success) {
        console.error('Failed to join thread room:', response.error);
        return;
      }
      console.log(response.unreadCount);
    });
  }

  createGroup(groupName: string, participants: string[], callback?: Function) {
    this.emit(
      'create-group',
      {
        groupName,
        participants,
      },
      callback as any,
    );
  }

  getThreadMessage(threadId: string, chatService: ChatService) {
    this.socket?.emit(
      'get-thread-message',
      {
        threadId,
      },
      (response: any) => {
        if (response.success) {
          chatService.setMessage(response.message);

          const currentUserId = this.authState.user?._id;
          if (currentUserId && Array.isArray(response.message)) {
            response.message.forEach((msg: ChatMessage) => {
              const isReceived =
                msg.receiver?._id === currentUserId ||
                (typeof msg.receiver === 'string' && msg.receiver === currentUserId);
              if (isReceived && msg.status !== 'read') {
                this.emit('mark-seen', { messageId: msg._id });
              }
            });
          }
        }
      },
    );
  }
  async createCallOffer(receiverId: string, callback: (response: any) => void): Promise<void> {
    try {
      this.remoteUserId = receiverId;
      const offer = await this.webRTCService.createCallOffer(receiverId);
      this.emit(
        'call-user',
        {
          receiverId,
          offer,
        },
        callback,
      );
    } catch (error) {
      console.error('Failed to create Webrtc offer', error);
      callback({
        success: false,
        error: 'Could not start the call',
      });
    }
  }

  async handleCallAccepted(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.webRTCService.handleCallAccepted(answer);
      console.log('Remote WebRTC answer set successfully');
    } catch (error) {
      console.error('Failed to accept call', error);
    }
  }

  async handleIncomingCall(callerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      this.remoteUserId = callerId;
      const answer = await this.webRTCService.handleIncomingCall(offer);
      this.socket?.emit('accept-call', {
        calledId: callerId,
        callerId,
        answer,
      });
      console.log('Webrtc answer');
    } catch (error) {
      console.error('Failed to handle incoming WebRTC call:', error);
    }
  }

  rejectCall(callerId: string, callback?: Function): void {
    this.webRTCService.close();
    this.emit(
      'reject-call',
      {
        callId: callerId,
        callerId,
      },
      callback as any,
    );
  }

  endCall(callId: string, callback?: (...args: any[]) => void): void {
    this.webRTCService.close();

    this.emit(
      'end-call',
      {
        receiverId: callId,
        callId,
      },
      callback,
    );
  }

  leaveThread(threadId: string, callback?: Function): void {
    this.socket?.emit('leave-thread', { threadId }, callback as any);
  }

  restartConversation(threadId: string, callback?: Function): void {
    this.socket?.emit('restart-ai-conversation', { threadId }, callback as any);
  }

  clearChat(threadId: string, callback?: Function): void {
    this.socket?.emit('clear-conversation', { threadId }, callback as any);
  }

  initializeChatListeners(chatService: ChatService) {
    if (this.listenersInitialized) {
      return;
    }
    this.listenersInitialized = true;

    this.on('thread-request', (thread: Thread) => {
      chatService.addThread(thread);
    });
    this.on('thread-accepted', (thread: Thread) => {
      chatService.updateThread(thread);
      if (chatService.selectedThread()?._id === thread._id) {
        this.joinThread(thread._id);
      }
    });
    this.on('group-created', (thread: Thread) => {
      chatService.addThread(thread);
    });
    this.on('new-message', (message: ChatMessage) => {
      const currentUserId = this.authState.user?._id;
      if (!currentUserId) return;
      const isReceived =
        message.receiver?._id === currentUserId ||
        (typeof message.receiver === 'string' && message.receiver === currentUserId);
      if (!isReceived) return;
      const isCurrentThread = chatService.selectedThread()?._id === message.threadId;
      if (isCurrentThread) {
        chatService.addMessage(message);
        this.emit('message-delivered', { messageId: message._id });
        this.emit('mark-seen', { messageId: message._id });
      } else {
        this.emit('message-delivered', { messageId: message._id });
        chatService.incrementUnreadCount(message.threadId);
      }
    });
    this.on('message-delivered', (updatedMsg: ChatMessage) => {
      if (chatService.selectedThread()?._id === updatedMsg.threadId) {
        chatService.messages.update((messages) =>
          messages.map((m) => (m._id === updatedMsg._id ? { ...m, status: updatedMsg.status } : m)),
        );
      }
    });
    this.on('message-seen', (data: { messageId: string; seen: boolean; status: string }) => {
      chatService.messages.update((messages) =>
        messages.map((m) =>
          m._id === data.messageId ? { ...m, seen: data.seen, status: data.status as any } : m,
        ),
      );
    });
    this.on('user-typing', (data) => {
      chatService.setTyping(data.threadId, data.username);
    });
    this.on('user-stop-typing', (data) => {
      chatService.removeTyping(data.threadId);
    });
    this.on('ai-stream', (data: { threadId: string; messageId: string; chunk: string }) => {
      if (chatService.selectedThread()?._id !== data.threadId) return;
      chatService.appendAiStream(data.messageId, data.threadId, data.chunk);
    });
    this.on(
      'ai-stream-end',
      (data: { threadId: string; messageId: string; message: ChatMessage }) => {
        if (chatService.selectedThread()?._id !== data.threadId) {
          return;
        }
        chatService.finishAiStream(data.message);
      },
    );
    this.on('conversation-cleared', (data: { threadId: string }) => {
      if (chatService.selectedThread()?._id === data.threadId) {
        chatService.messages.set([]);
      }
    });
    // this.on(
    //   'incoming-call',
    //   async (data: {
    //     callerId: string;
    //     callerUsername?: string;
    //     offer: RTCSessionDescriptionInit;
    //   }) => {
    //     console.log('Incoming call from', data);
    //     await this.handleIncomingCall(data.callerId, data.offer);
    //   },
    // );
    this.on(
      'incoming-call',
      (data: { callerId: string; callerUsername?: string; offer: RTCSessionDescriptionInit }) => {
        console.log('Incoming call from', data);
        this.incomingCallSubject.next(data);
      },
    );
    this.on('call-accepted', async (data: { answer: RTCSessionDescriptionInit }) => {
      await this.handleCallAccepted(data.answer);
      this.callAcceptedSubject.next();
    });
    this.on("call-rejected", () => {
      console.log("Call rejected");
      this.cleanupCall();
      this.callRejectedSubject.next();
    });
    this.on('call-ended', () => {
      console.log('Remote user ended the call');
      this.cleanupCall();
      this.callEndedSubject.next();
    });
    this.on('ice-candidates', async (data: { sender: string; candidate: RTCIceCandidateInit }) => {
      console.log('ICE cand received');
      await this.webRTCService.handleRemoteIceCandidate(data.candidate);
    });
  }
}
