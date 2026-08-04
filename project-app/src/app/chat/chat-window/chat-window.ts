import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
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
  @ViewChild('messagesContainer') messageContainer!: ElementRef<HTMLDivElement>
  public chatService = inject(ChatService)
  public authState = inject(AuthStateService)
  private socketService = inject(SocketService)
  private typingTimeout: any
  private uplodadService = inject(UploadService)
  newMessageText = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false
  openedImage: string | null = null;

  get currentUser() {
    return this.authState.user;
  }

  getOtherParticipants(thread: Thread) {
    return thread.participants.find(
      p => p._id !== this.authState.user?._id
    )
  }

  private scrollToBottom() {
    queueMicrotask(() => {
      if(!this.messageContainer) return;
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight
    })
  }
  constructor() {
    effect(() => {
      this.chatService.messages();
      this.scrollToBottom()
    })
  }

  acceptThread(thread: Thread) {
    this.socketService.emit(
      "accept-thread",
      { threadId: thread._id },
      (response: any) => {
        if (response.success) {
          this.chatService.updateThread(response.thread);
        } else {
          console.error("Failed to accept thread:", response.error);
        }
      }
    )
  }
  onTyping() {
    const thread = this.chatService.selectedThread();
    if(!thread) return;
    this.socketService.emit(
      "typing",
      {
        threadId: thread._id
      }
    )
    clearTimeout(this.typingTimeout)
    this.typingTimeout = setTimeout(() => {
      this.socketService.emit(
      "stop-typing",
      {
        threadId: thread._id
      }
      );
    }, 1000)
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if(!input.files?.length) return;
    this.selectedFile = input.files[0]
    this.previewUrl = URL.createObjectURL(this.selectedFile)
  }

  cancelImage() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  sendMessage() {
    const text = this.newMessageText.trim();
    const thread = this.chatService.selectedThread();
    if (!thread) return;
    if(!text && !this.selectedFile) return
    const file = this.selectedFile;

    if(file) {
      this.isUploading = true;
      this.uplodadService.uploadImage(file)
      .subscribe({
        next: (response) => {
          this.socketService.emit(
            "send-message",
            {
              threadId: thread._id,
              textMessage: text,
              image: response.data
            },
            (socketResponse: any) => {
              if(socketResponse.success) {
                this.newMessageText = ''
                this.previewUrl = null
                this.selectedFile = null
                this.chatService.messages.update(messages => [
                  ...messages,
                  socketResponse.message
                ])
              }
            }
          );
        },
        complete: () => {
          this.isUploading = false
        } 
      });
      return
    }

    if(!text) return
    this.socketService.emit(
      "send-message",
      {
        threadId: thread._id,
        textMessage: text
      },
      (response: any) => {
        if (response.success) {
          this.newMessageText = '';
          this.chatService.messages.update(messages => [
            ...messages,
            response.message
          ])
        } else {
          console.error("Failed to send message:", response.error);
        }
      }
    );
  }

  openImage(url: string) {
    this.openedImage = url
  }

  closeImage() {
    this.openedImage = null
  }
}
