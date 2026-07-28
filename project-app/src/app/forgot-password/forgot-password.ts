import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isLoading = false;
  message = '';
  error = '';

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotPasswordForm.invalid || this.isLoading) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.error = '';

    this.authService.forgotPassword(this.forgotPasswordForm.getRawValue() as { email: string }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
        this.forgotPasswordForm.reset();
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message ?? 'Unable to send reset email';
      },
    });
  }
}
