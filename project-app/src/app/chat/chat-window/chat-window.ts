import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { SocketService } from '../../core/services/socket.service';
import { ChatMessage, Thread } from '../../core/models/chat.model';
import { UploadService } from '../../core/services/upload.service';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
})
export class ChatWindow {
  @ViewChild('messagesContainer') messageContainer!: ElementRef<HTMLDivElement>;
  public chatService = inject(ChatService);
  public authState = inject(AuthStateService);
  private socketService = inject(SocketService);
  private typingTimeout: any;
  private uploadService = inject(UploadService);

  newMessageText = '';

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;
  openedImage: string | null = null;

  private audioStream!: MediaStream;
  audioRecorder!: MediaRecorder;
  audioChunks: Blob[] = [];
  isRecording = false;
  recordingTime = 0;
  recordTimer: any;
  audioToggle: boolean = false;

  get currentUser() {
    return this.authState.user;
  }

  getOtherParticipants(thread: Thread) {
    return thread.participants.find((p) => p._id !== this.authState.user?._id);
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageContainer) {
        const element = this.messageContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 0);
  }

  constructor() {
    effect(() => {
      this.chatService.selectedThread();
      this.chatService.messages();
      this.scrollToBottom();
    });
  }

  acceptThread(thread: Thread) {
    this.socketService.emit('accept-thread', { threadId: thread._id }, (response: any) => {
      if (response.success) {
        this.chatService.updateThread(response.thread);
      } else {
        console.error('Failed to accept thread:', response.error);
      }
    });
  }
  onTyping() {
    const thread = this.chatService.selectedThread();
    if (!thread) return;
    this.socketService.emit('typing', {
      threadId: thread._id,
    });
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.socketService.emit('stop-typing', {
        threadId: thread._id,
      });
    }, 1000);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    this.previewUrl = URL.createObjectURL(this.selectedFile);
  }

  cancelImage() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  get isVideoSelected() {
    return this.selectedFile?.type.startsWith('video/');
  }

  get isAudioSelected() {
    return this.selectedFile?.type.startsWith('audio/');
  }

  sendMessage() {
    const text = this.newMessageText.trim();
    const thread = this.chatService.selectedThread();
    if (!thread) return;
    if (!text && !this.selectedFile) return;
    const file = this.selectedFile;
    const currentUser = this.currentUser;
    const otherParticipant = this.getOtherParticipants(thread);
    if (!currentUser || !otherParticipant) return;

    const isVideo = file && file.type.startsWith('video/');
    const isAudio = file && file.type.startsWith('audio/');
    const tempId = crypto.randomUUID();
    const tempMessage: ChatMessage = {
      _id: tempId,
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
          ? { url: currentUser.avatar.url, publicId: currentUser.avatar.publicId }
          : { url: '', publicId: '' },
          isAI: false
      },
      receiver: otherParticipant,
      textMessage: text,
      image: !isVideo && !isAudio && this.previewUrl ? { url: this.previewUrl, publicId: '' } : null,
      video: isVideo && this.previewUrl ? { url: this.previewUrl, publicId: '' } : null,
      audio: isAudio && this.previewUrl ? { url: this.previewUrl, publicId: '' } : null,
      threadId: thread._id,
      createdAt: new Date(),//.toISOString(),
      isAI: false,
      status: 'sending',
    };

    this.chatService.addTemporaryMessage(tempMessage);

    this.newMessageText = '';
    this.previewUrl = null;
    this.selectedFile = null;

    if (file) {
      this.isUploading = true;
      let upload$;
      if (isVideo) {
        upload$ = this.uploadService.uploadVideo(file);
      } else if (isAudio) {
        upload$ = this.uploadService.uploadAudio(file);
      } else {
        upload$ = this.uploadService.uploadImage(file);
      }

      upload$.subscribe({
        next: (response) => {
          const payload: any = {
            threadId: thread._id,
            textMessage: text,
          };
          if (isVideo) {
            payload.video = response.data;
          } else if (isAudio) {
            payload.audio = response.data;
          } else {
            payload.image = response.data;
          }
          this.socketService.emit('send-message', payload, (socketResponse: any) => {
            if (socketResponse.success) {
              this.chatService.replaceTemporaryMessage(tempId, socketResponse.message);
            } else {
              console.error('Failed to send message:', socketResponse.error);
              this.chatService.markMessageSendFailed(tempId);
            }
          });
        },
        error: (err) => {
          console.error('Upload failed:', err);
          this.chatService.markMessageSendFailed(tempId);
          this.isUploading = false;
        },
        complete: () => {
          this.isUploading = false;
        },
      });
      return;
    }

    this.socketService.emit(
      'send-message',
      {
        threadId: thread._id,
        textMessage: text,
      },
      (response: any) => {
        if (response.success) {
          this.chatService.replaceTemporaryMessage(tempId, response.message);
        } else {
          console.error('Failed to send message:', response.error);
          this.chatService.markMessageSendFailed(tempId);
        }
      },
    );
  }

  uploadVoice(file: File) {
    const thread = this.chatService.selectedThread();
    if (!thread) return;
    const currentUser = this.currentUser;
    const otherParticipant = this.getOtherParticipants(thread);
    const text = this.newMessageText.trim();
    if (!currentUser || !otherParticipant) return;

    const tempId = crypto.randomUUID();
    const tempMessage: ChatMessage = {
      _id: tempId,
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
          ? { url: currentUser.avatar.url, publicId: currentUser.avatar.publicId }
          : { url: '', publicId: '' },
          isAI: false
      },
      receiver: otherParticipant,
      textMessage: text,
      image: null,
      video: null,
      audio: { url: URL.createObjectURL(file), publicId: '' },
      threadId: thread._id,
      createdAt: new Date(),//.toISOString(),
      isAI: false,
      status: 'sending',
    };
    this.chatService.addTemporaryMessage(tempMessage);

    this.uploadService.uploadAudio(file).subscribe({
      next: (response) => {
        this.socketService.emit(
          'send-message',
          {
            threadId: thread._id,
            audio: response.data,
          },
          (socketResponse: any) => {
            if (socketResponse.success) {
              this.chatService.replaceTemporaryMessage(tempId, socketResponse.message);
            } else {
              console.error('Failed to send voice message:', socketResponse.error);
              this.chatService.markMessageSendFailed(tempId);
            }
          },
        );
      },
      error: (err) => {
        console.error('Voice upload failed:', err);
        this.chatService.markMessageSendFailed(tempId);
      }
    });
  }

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    this.audioRecorder = new MediaRecorder(stream);
    this.audioStream = stream;
    this.audioChunks = [];
    this.audioRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.audioRecorder.start();
    this.isRecording = true;
    this.recordingTime = 0;
    this.recordTimer = setInterval(() => {
      this.recordingTime++;
    }, 1000);
  }

  stopRecording() {
    if (!this.audioRecorder) return;
    this.audioRecorder.stop();
    this.audioStream.getTracks().forEach((track) => track.stop());
    clearInterval(this.recordTimer);
    this.isRecording = false;
    this.audioRecorder.onstop = () => {
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      this.uploadVoice(file);
    };
  }

  restartConversation(): void {
    const thread = this.chatService.selectedThread();
    if(!thread || !thread.isAI) {
      return ;
    }

    const confirmed = window.confirm("Start a fresh conversation? Your current chat history will remain, but Travel AI will have fresh context")

    if(!confirmed) return;
    this.socketService.restartConversation(
      thread._id,
      (response: any) => {
        if(!response?.success) {
          console.error("Failed to restart conversation", response?.error);
          return
        }
        console.log("AI conversation restarted")
      }
    )
  }

  toggleMic() {
    this.audioToggle = !this.audioToggle;

    if (this.audioToggle) {
      this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  openImage(url: string) {
    this.openedImage = url;
  }

  closeImage() {
    this.openedImage = null;
  }
}
