import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService } from '../../core/services/user.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-group-dialog.html',
  styleUrl: './create-group-dialog.css',
})
export class CreateGroupDialog {
  private userService = inject(UserService);
  private socket = inject(SocketService);

  groupName = '';

  search = '';

  users: any[] = [];

  selectedUsers = signal<string[]>([]);

  visible = signal(false);

  open() {
    this.visible.set(true);

    this.groupName = '';

    this.search = '';

    this.users = [];

    this.selectedUsers.set([]);
  }

  close() {
    this.visible.set(false);
  }

  searchUsers() {
    if (this.search.trim().length < 2) {
      this.users = [];

      return;
    }

    this.userService.searchUser(this.search).subscribe({
      next: (users) => {
        this.users = users
      },
    });
  }

  toggleUser(id: string) {
    const selected = this.selectedUsers();

    if (selected.includes(id)) {
      this.selectedUsers.set(selected.filter((x) => x !== id));
    } else {
      this.selectedUsers.set([...selected, id]);
    }
  }

  createGroup() {
    if (!this.groupName.trim()) {
      return;
    }

    if (this.selectedUsers().length < 2) {
      alert('Select at least two users.');

      return;
    }

    this.socket.createGroup(
      this.groupName,

      this.selectedUsers(),

      (response: any) => {
        if (response.success) {
          this.close();
        } else {
          alert(response.error);
        }
      },
    );
  }
}
