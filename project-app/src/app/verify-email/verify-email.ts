import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css'
})
export class VerifyEmailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = true;
  success = false;
  error = '';

  ngOnInit(): void {

    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.loading = false;
      this.error = 'Verification token missing';
      return;
    }

    this.authService.verifyEmail(token).subscribe({

      next: () => {

        this.loading = false;
        this.success = true;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);

      },

      error: (err) => {

        this.loading = false;
        this.error =
          err.error?.message ??
          'Verification failed';

      }

    });

  }

}