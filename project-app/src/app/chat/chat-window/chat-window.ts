import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { SocketService } from '../../core/services/socket.service';
import { Thread } from '../../core/models/chat.model';

@Component({
  selector: 'app-chat-window',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.css',
})
export class ChatWindow {
  public chatService = inject(ChatService)
  public authState = inject(AuthStateService)
  private socketService = inject(SocketService)
  private typingTimeout: any
  newMessageText = '';

  get currentUser() {
    return this.authState.user;
  }

  getOtherParticipants(thread: Thread) {
    return thread.participants.find(
      p => p._id !== this.authState.user?._id
    )
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

  sendMessage() {
    const text = this.newMessageText.trim();
    const thread = this.chatService.selectedThread();
    if (!text || !thread) return;

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
}
