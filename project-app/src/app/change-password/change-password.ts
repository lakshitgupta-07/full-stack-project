import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { UserService } from '../core/services/user.service';

import { ConfirmPasswordValidator } from '../validators/confirm-password.validator';
import { ValidatePasswordPatternValidator } from '../validators/validate-password-pattern.validator';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css'
})

export class ChangePasswordComponent {

  private fb = inject(FormBuilder);

  private userService = inject(UserService);

  private router = inject(Router);

  isLoading = false;
  isInitialPasswordSetup = false;

  passwordForm = this.fb.group(
    {
      oldPassword: [
        ''
      ],

      newPassword: [
        '',
        [
          Validators.required,
          ValidatePasswordPatternValidator
        ]
      ],

      confirmPassword: [
        '',
        Validators.required
      ]
    },

    {
      validators: ConfirmPasswordValidator
    }
  );

  ngOnInit() {
    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        this.isInitialPasswordSetup = !response.data.hasPassword;
        const oldPasswordControl = this.passwordForm.get('oldPassword');

        if (this.isInitialPasswordSetup) {
          oldPasswordControl?.clearValidators();
        } else {
          oldPasswordControl?.setValidators(Validators.required);
        }

        oldPasswordControl?.updateValueAndValidity();
      },
      error: (error) => {
        alert(error.error.message);
      }
    });
  }

  onSubmit() {

    if (this.passwordForm.invalid || this.isLoading) {

      this.passwordForm.markAllAsTouched();

      return;

    }

    this.isLoading = true;

    const data = {
      newPassword: this.passwordForm.value.newPassword ?? '',
      ...(!this.isInitialPasswordSetup && {
        oldPassword: this.passwordForm.value.oldPassword ?? ''
      })
    };

    this.userService.changePassword(data as any)
      .subscribe({

        next: (response) => {

          this.isLoading = false;

          alert(response.message);

          this.passwordForm.reset();

          this.router.navigate(['/login']);

        },

        error: (error) => {

          this.isLoading = false;

          alert(error.error.message);

        }

      });

  }

}
