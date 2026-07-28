import { Component, OnInit, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChildComponent } from '../child-component/child-component';
import { CommunicationService } from '../core/services/communication-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-parent-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ChildComponent],
  styleUrl: './parent-component.css',
  templateUrl: './parent-component.html',
})
export class ParentComponent implements OnInit {
  communicationService = inject(CommunicationService)
  router = inject(Router)
  tempForm!: FormGroup;

  users: any[] = [];

  selectedIndex: number | null = null;

  showChild = false;

  ngOnInit(): void {
    this.tempForm = new FormGroup({
      userName: new FormControl('', Validators.required),
      age: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required),
    });

    this.communicationService.users$.subscribe((data) => {
      this.users = data;
    });

    this.communicationService.selectedUser$.subscribe((data) => {
      if (!data) {
        return;
      }

      this.selectedIndex = data.index;

      this.tempForm.patchValue({
        userName: data.user.userName,
        age: data.user.age,
        address: data.user.address,
      });
    });
  }

  onAddItem() {
    if (this.tempForm.invalid) {
      return;
    }

    this.communicationService.addUser(this.tempForm.getRawValue());

    this.tempForm.reset();
  }

  saveChanges() {
    if (this.selectedIndex === null || this.tempForm.invalid) {
      return;
    }

    this.communicationService.updateUser(this.selectedIndex, this.tempForm.getRawValue());

    this.selectedIndex = null;

    this.tempForm.reset();
  }

  cancelChange() {
    this.selectedIndex = null;

    this.tempForm.reset();
  }

  toggleChild() {
    this.showChild = !this.showChild;
  }
  moveToProfilePage() {
    this.router.navigate(['profile'])
  }
}
