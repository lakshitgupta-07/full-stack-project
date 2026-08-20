import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environment/envirenment';
import { ChatService } from './chat.service';
import { Thread, ChatMessage } from '../models/chat.model';
import { AuthStateService } from './auth-state.service';
import { WebRTCService } from './webrtc.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;
  private authState = inject(AuthStateService);
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private listenersInitialized = false;
  private remoteUserId: string | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private webRTCService = inject(WebRTCService)

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
  private setupIceCandidatesListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (!event.candidate) return;
      console.log('ICE candidate generated');
      this.socket?.emit('ice-candidate', {
        candidate: event.candidate,
      });
    };
  }
  async handleRemoteIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      return;
    }
    if (!this.peerConnection.remoteDescription) {
      this.pendingIceCandidates.push(candidate);
      console.log('ICE candidate queued');
      return;
    }
    try {
      await this.peerConnection?.addIceCandidate(candidate);
      console.log('Remote ICE candidate added');
    } catch (error) {
      console.error('Failed to add remote ICE candidate', error);
    }
  }
  async createCallOffer(receiverId: string, callback: (response: any) => void): Promise<void> {
    try {
      this.remoteUserId = receiverId;
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.peerConnection = this.webRTCService.createPeerConnection()
      this.setupIceCandidatesListeners();
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.emit(
        'call-user',
        {
          receiverId,
          offer: this.peerConnection.localDescription,
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
  async handleCallAccepted(
    answer: RTCSessionDescriptionInit,
    // callback: (response: any) => void
  ): Promise<void> {
    if (!this.peerConnection) {
      console.error('No peer connection exists');
      return;
    }
    try {
      await this.peerConnection.setRemoteDescription(answer);
      for (const candidate of this.pendingIceCandidates) {
        await this.peerConnection.addIceCandidate(candidate);
      }

      this.pendingIceCandidates = [];

      console.log('Remote WebRTC answer set successfully');
      console.log('Call accepted');
    } catch (error) {
      console.error('Failed to accept call', error);
    }
  }
  async handleIncomingCall(callerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      console.log('Incoming WebRtc from', callerId);
      this.remoteUserId = callerId;

      this.peerConnection = this.webRTCService.createPeerConnection()
      this.setupIceCandidatesListeners();
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      await this.peerConnection.setRemoteDescription(offer);
      for (const candidate of this.pendingIceCandidates) {
        await this.peerConnection.addIceCandidate(candidate);
      }

      this.pendingIceCandidates = [];
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket?.emit('accept-call', {
        callerId,
        answer: this.peerConnection.localDescription,
      });
      console.log('Webrtc answer');
    } catch (error) {
      console.error('Failed to handle incoming WebRTC call:', error);
    }
  }
  rejectCall(callId: string, callback?: Function): void {
    this.emit(
      'reject-call',
      {
        callId,
      },
      callback as any,
    );
  }
  endCall(callId: string, callback?: Function): void {
    this.emit(
      'end-call',
      {
        callId,
      },
      callback as any,
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
    this.on(
      'incoming-call',
      async (data: { callerId: string; offer: RTCSessionDescriptionInit }) => {
        console.log('Incoming call from', data);
        await this.handleIncomingCall(data.callerId, data.offer);
      },
    );
    this.on('call-accepted', async (data: { answer: RTCSessionDescriptionInit }) => {
      await this.handleCallAccepted(data.answer);
    });
    this.on('ice-candidate', async (data: { senderId: string; candidates: RTCIceCandidate }) => {
      console.log('ICE cand received');
      await this.handleRemoteIceCandidate(data.candidates);
    });
  }
}
