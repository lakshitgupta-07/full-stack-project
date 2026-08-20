import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef, effect, HostListener, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { SocketService } from '../../core/services/socket.service';
import { ChatMessage, Thread } from '../../core/models/chat.model';
import { UploadService } from '../../core/services/upload.service';
import { AiTextFormatPipe } from '../../pipes/ai-text-format-pipe';
import { SpeechRecognitionService } from '../../core/services/speech-recogination.service';
import { WebRTCService } from '../../core/services/webrtc.service';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule, AiTextFormatPipe],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
})
export class ChatWindow implements AfterViewInit {
  @ViewChild('messagesContainer') messageContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;
  public chatService = inject(ChatService);
  public authState = inject(AuthStateService);
  private socketService = inject(SocketService);
  private typingTimeout: any;
  private uploadService = inject(UploadService);
  private speechRecoginition = inject(SpeechRecognitionService);
  private webRTCService = inject(WebRTCService);

  isAiListening = false;
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
  voiceError: string = '';
  private voiceErrorTimeout: any;

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
    const thread = this.chatService.selectedThread();
    if (thread) {
      this.socketService.joinThread(thread._id);
    }
    effect(() => {
      this.chatService.selectedThread();
      this.chatService.messages();
      this.scrollToBottom();
    });
  }

  ngAfterViewInit() {
    this.webRTCService.remoteStream$.subscribe((stream) => {
      if (!this.remoteAudio) {
        console.warn('remoteAudio ViewChild is not initialized yet');
        return;
      }

      this.remoteAudio.nativeElement.srcObject = stream;

      this.remoteAudio.nativeElement.play().catch((error) => {
        console.error('Could not play remote audio:', error);
      });
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
        isAI: false,
      },
      receiver: otherParticipant,
      textMessage: text,
      image:
        !isVideo && !isAudio && this.previewUrl ? { url: this.previewUrl, publicId: '' } : null,
      video: isVideo && this.previewUrl ? { url: this.previewUrl, publicId: '' } : null,
      audio: isAudio && this.previewUrl ? { url: this.previewUrl, publicId: '' } : null,
      threadId: thread._id,
      createdAt: new Date(), //.toISOString(),
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
        isAI: false,
      },
      receiver: otherParticipant,
      textMessage: text,
      image: null,
      video: null,
      audio: { url: URL.createObjectURL(file), publicId: '' },
      threadId: thread._id,
      createdAt: new Date(), //.toISOString(),
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
      },
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
  
  async testCall() {
    const thread = this.chatService.selectedThread();

    if (!thread) {
      console.log('No conversation selected');
      return;
    }

    const otherUser = this.getOtherParticipants(thread);

    if (!otherUser) {
      console.log('No other user found');
      return;
    }
    await this.socketService.createCallOffer(otherUser._id, (response) => {
      console.log('Call response:', response);
    });
  }

  restartConversation(): void {
    const thread = this.chatService.selectedThread();
    if (!thread || !thread.isAI) {
      return;
    }

    const confirmed = window.confirm(
      'Start a fresh conversation? Your chat histroy will be deleted and Travel AI start with fresh context',
    );

    if (!confirmed) return;
    this.socketService.restartConversation(thread._id, (response: any) => {
      if (!response?.success) {
        console.error('Failed to restart conversation', response?.error);
        return;
      }
      this.chatService.clearCurrentConversation();
      this.newMessageText = '';
      this.selectedFile = null;
      this.previewUrl = null;
      this.openedImage = null;
      this.isUploading = false;

      clearTimeout(this.typingTimeout);
      this.isRecording = false;
      this.audioToggle = false;

      console.log('AI conversation restarted');
    });
  }

  clearChat(): void {
    const thread = this.chatService.selectedThread();
    if (!thread || thread.isAI) return;

    const confirmed = window.confirm(
      'Clear chat will delete all the messages and media received which cannot be recovered.',
    );
    if (!confirmed) return;
    this.socketService.clearChat(thread._id, (response: any) => {
      if (!response?.success) {
        console.error('Failed to restart conversation', response?.error);
        return;
      }
      this.chatService.clearCurrentConversation();
      this.newMessageText = '';
      this.selectedFile = null;
      this.previewUrl = null;
      this.openedImage = null;
      this.isUploading = false;

      clearTimeout(this.typingTimeout);
      this.isRecording = false;
      this.audioToggle = false;
    });
  }
  private sendAiSpeechMessage(text: string) {
    const thread = this.chatService.selectedThread();

    if (!thread || !thread.isAI) {
      return;
    }

    const currentUser = this.currentUser;

    if (!currentUser) {
      return;
    }

    const otherParticipant = this.getOtherParticipants(thread);

    if (!otherParticipant) {
      return;
    }

    const tempId = crypto.randomUUID();

    const tempMessage: ChatMessage = {
      _id: tempId,

      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
          ? {
              url: currentUser.avatar.url,
              publicId: currentUser.avatar.publicId,
            }
          : {
              url: '',
              publicId: '',
            },
        isAI: false,
      },

      receiver: otherParticipant,

      textMessage: text,

      image: null,
      video: null,
      audio: null,

      threadId: thread._id,

      createdAt: new Date(),

      isAI: false,

      status: 'sending',
    };

    this.chatService.addTemporaryMessage(tempMessage);

    this.newMessageText = '';

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
          console.error('Failed to send AI speech message:', response.error);

          this.chatService.markMessageSendFailed(tempId);
        }
      },
    );
  }

  startAiSpeech() {
    if (!this.speechRecoginition.isSupported) {
      console.error('Speech recoginition is not supported in this browser.');
    }
    this.newMessageText = '';
    this.isAiListening = true;
    this.speechRecoginition.start(
      (transcript) => {
        this.newMessageText = transcript;
      },
      () => {
        this.isAiListening = false;
      },
      (error) => {
        this.isAiListening = false;

        switch (error) {
          case 'no-speech':
            this.showVoiceError('No speech detected.');
            break;

          case 'audio-capture':
            this.showVoiceError('Microphone could not be accessed.');
            break;

          case 'not-allowed':
            this.showVoiceError('Microphone permission was denied.');
            break;

          case 'network':
            this.showVoiceError('Speech recognition network error.');
            break;

          default:
            this.showVoiceError('Speech recognition error:');
        }
      },
    );
  }
  stopAiSpeech() {
    this.speechRecoginition.stop();
    this.isAiListening = false;

    const text = this.newMessageText.trim();
    if (!text) {
      this.showVoiceError("I didn't hear anything. Please try again.");
      return;
    }

    this.sendAiSpeechMessage(text);
  }

  private showVoiceError(message: string) {
    this.voiceError = message;
    clearTimeout(this.voiceErrorTimeout);
    this.voiceErrorTimeout = setTimeout(() => {
      this.voiceError = '';
    }, 3000);
  }

  dismissVoiceError() {
    clearTimeout(this.voiceErrorTimeout);
    this.voiceError = '';
  }

  toggleMic() {
    const thread = this.chatService.selectedThread();
    if (!thread) return;

    if (thread.isAI) {
      if (this.isAiListening) this.stopAiSpeech();
      else this.startAiSpeech();
    }

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
  @HostListener('document:keydown.escape')
  onEscape(): void {
    const thread = this.chatService.selectedThread();
    if (!thread) return;
    this.socketService.leaveThread(thread._id);
    clearTimeout(this.typingTimeout);
    clearTimeout(this.voiceErrorTimeout);
    this.voiceError = '';
    if (this.isRecording) this.stopRecording;
    this.openedImage = null;
    this.newMessageText = '';
    this.selectedFile = null;
    this.isUploading = false;
    this.audioToggle = false;
    this.chatService.clearSelectedThread();
  }
}
