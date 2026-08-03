import { Component, inject } from '@angular/core';
import { UserService } from '../core/services/user.service';
import { SocketService } from '../core/services/socket.service';
import { Router } from '@angular/router';
import { ChatService } from '../core/services/chat.service';


@Component({
  selector: 'app-connect',
  imports: [],
  templateUrl: './connect.html',
  styleUrl: './connect.css',
})
export class Connect {
  private userService = inject(UserService);
  private socketService = inject(SocketService);
  private router = inject(Router);
  private chatService = inject(ChatService)
  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        const accessToken = response.data.accessToken;
        this.socketService.connect(accessToken);
        this.socketService.initializeChatListeners(this.chatService);
        this.router.navigate(['/homePage']);
      },
      error: () => {
        this.router.navigate(['/login']);

      },
    });
  }
}
