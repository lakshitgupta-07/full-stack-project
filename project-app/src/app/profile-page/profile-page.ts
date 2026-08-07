import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../core/models/user.model';
import { UserService } from '../core/services/user.service';
import { PaymentService } from '../core/services/payment.service';
import { RazorpayLoaderService } from '../core/services/razorpay-loader.service';
import { environment } from '../../environment/envirenment';
import { AuthStateService } from '../core/services/auth-state.service';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage implements OnInit {
  router = inject(Router);
  private userService = inject(UserService);
  private paymentService = inject(PaymentService);
  private loader = inject(RazorpayLoaderService);
  private authState = inject(AuthStateService)
  currentUser!: User;
  avatarPreview = '';
  userForm!: FormGroup;

  isEditMode: boolean = false;

  constructor(private formBuilder: FormBuilder) {}
  ngOnInit(): void {
    this.userForm = this.formBuilder.group({
      username: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      phoneNumber: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      skills: this.formBuilder.array([]),
    });
    this.loadProfile();
  }
  get skills(): FormArray {
    return this.userForm.get('skills') as FormArray;
  }

  loadProfile() {
    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        this.currentUser = response.data;
        this.avatarPreview = response.data.avatar?.url ?? 'assets/default-avatar.png';
        this.skills.clear();

        this.userForm.patchValue({
          username: response.data.username,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
          address: response.data.address,
        });
        const skills = response.data.skills ?? [];
        if (skills.length) {
          skills.forEach((skill: string) => {
            this.addSkill(skill, true);
          });
        } else {
          this.addSkill('', true);
        }
      },
    });
  }

  addSkill(value = '', isDisabled = true) {
    this.skills.push(this.formBuilder.control({ value, disabled: isDisabled }));
  }
  removeSkill(index: number) {
    this.skills.removeAt(index);
  }
  enableEdit() {
    this.isEditMode = true;
    this.userForm.enable();
    this.userForm.get('email')?.disable();
    this.userForm.get('username')?.disable();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.userForm.disable();
    this.loadProfile();
  }

  onSubmit() {
    if (this.userForm.invalid) return;
    this.userService.updateProfile(this.userForm.getRawValue()).subscribe({
      next: (response) => {
        this.currentUser = response.data;
        this.isEditMode = false;
        this.userForm.disable();
        this.loadProfile();
      },
    });
  }
  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const file = input.files[0];

    this.userService.updateAvatar(file).subscribe({
      next: (response) => {
        this.currentUser = response.data;

        this.avatarPreview = response.data.avatar?.url ?? 'assets/default-avatar.png';
      },
    });
  }
  returnToHomePage() {
    this.router.navigate(['/homePage']);
  }
  moveToParentComp() {
    this.router.navigate(['/parentcomponent']);
  }

  buyPremium() {
    this.paymentService.createOrder(999).subscribe(async res => {
      await this.loader.load();
      const order = res.data
      const options = {
        key: environment.razorpayKey,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "Chat Application",
        description: "Premium",
        handler: (response: any) => {
          console.log(response);
          console.log(response.razorpay_order_id)
          console.log(response.razorpay_payment_id)
          console.log(response.razorpay_signature)
          this.paymentService.verifyPayment(response).subscribe( {
            next: (res) => {
              console.log(res);
              alert("Premium active");
            }, error: (err) => console.log(err)
          });
        }
      };
      new (window as any).Razorpay(options).open();
    });
  }
}
