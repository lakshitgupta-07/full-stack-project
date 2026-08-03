import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ChatSidebar } from '../chat-sidebar/chat-sidebar';
import { ChatWindow } from '../chat-window/chat-window';
import { SocketService } from '../../core/services/socket.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat-page',
  imports: [CommonModule, ChatSidebar, ChatWindow],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage {
  constructor(
    private socketService: SocketService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.socketService.getMyThread(
      this.chatService
    )
  }
}
