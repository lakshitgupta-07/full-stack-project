import { Component, inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-resend-verification',
  imports: [CommonModule, RouterLink],
  templateUrl: './resend-verification.html',
  styleUrl: './resend-verification.css',
})
export class ResendVerification {
  private authService = inject(AuthService)
  private router = inject(Router)
  email = ''
  isLoading = true
  message = ''
  error = ''
  onClick(): void {
    const state = history.state;
    this.email = state.email ?? ''
    if(!this.email) {
      this.isLoading = false
      this.error = 'No email was provided. please login again';
      return
    }
    this.sendVerification()
  }
  sendVerification() {
    this.authService.resendVerification({
      email: this.email
    }).subscribe({
      next: (response) => {
        this.isLoading = false
        this.message = response.message
      },
      error: (err) => {
        this.isLoading = false
        this.error =
            err.error?.message ??
            'Unable to send verification email';
      }
    })
  }
}
