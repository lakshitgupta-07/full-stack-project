import { inject, Component } from '@angular/core';
import { ChatService } from '../../core/services/chat.service';
import { Thread } from '../../core/models/chat.model';
import { UserService } from '../../core/services/user.service';
import { SocketService } from '../../core/services/socket.service';
import { CommonModule } from '@angular/common';
import { NewChatDialog } from '../new-chat-dialog/new-chat-dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, FormsModule, NewChatDialog],
  templateUrl: './chat-sidebar.html',
  styleUrl: './chat-sidebar.css',
})
export class ChatSidebar {
  public chatService = inject(ChatService);
  private userService = inject(UserService)
  private socketService = inject(SocketService)
  currentUser = this.userService.currentUser;
  showDialog = false;
  searchQuery = '';

  getOtherParticipants(thread: Thread) {
    const currentUserId = this.currentUser()?._id;
    return thread.participants.find(
      participant => participant._id !== currentUserId
    )
  }
  selectThread(thread: Thread) {
    this.chatService.selectedThread.set(thread)
    this.socketService.joinThread(thread._id)
    this.socketService.getThreadMessage(
      thread._id,
      this.chatService
    )
  }

  get filteredThreads() {
    const query = this.searchQuery.trim().toLowerCase();
    const threads = this.chatService.threads();
    if (!query) {
      return threads;
    }
    return threads.filter(thread => {
      const otherUser = this.getOtherParticipants(thread);
      return otherUser?.username.toLowerCase().includes(query);
    });
  }
}
