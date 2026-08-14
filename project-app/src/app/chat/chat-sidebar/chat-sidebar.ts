import { inject, Component, ViewChild } from '@angular/core';
import { ChatService } from '../../core/services/chat.service';
import { Thread } from '../../core/models/chat.model';
import { UserService } from '../../core/services/user.service';
import { SocketService } from '../../core/services/socket.service';
import { CommonModule } from '@angular/common';
import { NewChatDialog } from '../new-chat-dialog/new-chat-dialog';
import { FormsModule } from '@angular/forms';
import { CreateGroupDialog } from '../create-group-dialog/create-group-dialog';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, FormsModule, NewChatDialog, CreateGroupDialog],
  templateUrl: './chat-sidebar.html',
  styleUrl: './chat-sidebar.css',
})
export class ChatSidebar {
  @ViewChild(CreateGroupDialog) dialog!: CreateGroupDialog
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
    this.chatService.resetUnreadCount(thread._id);
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
      if (thread.isGroup) {
        return thread.groupName?.toLowerCase().includes(query);
      }
      const otherUser = this.getOtherParticipants(thread);
      return otherUser?.username.toLowerCase().includes(query);
    });
  }
  getUnreadCount(thread: Thread): number {
    const currentUserId = this.currentUser()?._id;
    if (!currentUserId || !thread.unreadCount) return 0;
    return thread.unreadCount[currentUserId] || 0;
  }
  openCreateGroup() {
    this.dialog.open();
  }
}
