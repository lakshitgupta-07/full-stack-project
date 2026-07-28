import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ConfirmPasswordValidator } from '../validators/confirm-password.validator';
import { ValidatePasswordPatternValidator } from '../validators/validate-password-pattern.validator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoading = false;
  error = '';

  resetPasswordForm = this.fb.group(
    {
      password: ['', [Validators.required, ValidatePasswordPatternValidator]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: ConfirmPasswordValidator,
    }
  );

  onSubmit() {
    if (this.resetPasswordForm.invalid || this.isLoading) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.error = 'Reset token is missing';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.resetPassword(token, {
      password: this.resetPasswordForm.controls.password.value ?? '',
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message ?? 'Unable to reset password';
      },
    });
  }
}
