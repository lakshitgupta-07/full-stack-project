import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { SocketService } from '../../core/services/socket.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-new-chat-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-chat-dialog.html',
  styleUrl: './new-chat-dialog.css',
})
export class NewChatDialog {
  @Output()
  close = new EventEmitter<void>();

  private userService = inject(UserService);
  private socketService = inject(SocketService);
  private chatService = inject(ChatService)

  search = ''
  users: any[] = []

  searchUsers() {
    console.log("serachUser called")
    if(this.search.trim().length < 2) {
      this.users = []
      return
    }
    console.log("Calling API", this.search)
    this.userService.searchUser(this.search).subscribe({
      next:(users) => {
        console.log("Response");
        console.log(users)
        this.users = users
        console.log("Users Array");
        console.log(this.users)
      },
      error: (err) => {
        console.log("Error")
        console.error(err)
      },
      complete: () => {
        console.log("Complete")
      }
    }
  )
  }

  startConversation(user: any) {
    this.socketService.emit(
      "create-thread",
      {
        receiverId:user._id
      },
      (response: any) => {
        if(!response.success) {
          return
        }

        const thread = response.message
        this.chatService.updateThread(thread)
        this.chatService.selectThread(thread)
        this.socketService.joinThread(thread._id)
        this.socketService.getThreadMessage(
          thread._id,
          this.chatService
        );
        this.close.emit()
      }
    )
  }
}
