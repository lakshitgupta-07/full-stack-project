import { Component, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { CommunicationService } from '../core/services/communication-service';

@Component({
  selector: 'app-child-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './child-component.html',
})
export class ChildComponent implements OnInit {
  communicationService = inject(CommunicationService)

  users: any[] = [];

  ngOnInit(): void {
    this.communicationService.users$.subscribe((data) => {
      this.users = data;
    });
  }

  editUser(index: number) {
    this.communicationService.selectUser(index);
  }

  deleteUser(index: number) {
    this.communicationService.deleteUser(index);
  }
}
