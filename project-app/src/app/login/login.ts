import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../core/services/theme';
import { AuthService } from '../core/services/auth.service';
import { UserService } from '../core/services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private authService = inject(AuthService);
  private userService = inject(UserService)
  isDarkMode = false;
  isLoading = false;
  onLogin(form: NgForm): void {
    if (form.invalid || this.isLoading) return;
    this.isLoading = true;
    console.log('Sending login request', form.value);

    this.authService.login(form.value).subscribe({
      next: (response) => {
        console.log(response);

        this.isLoading = false;
        this.userService.getCurrentUser().subscribe();
        this.router.navigate(['/homePage']);
      },

      error: (error) => {
        this.isLoading = false;

        const message = error.error?.message ?? '';
        if (error.status === 403 && message.includes('verify')) {
          this.router.navigate(['/resend-verification'],
            {
              state: {
                email: form.value.email
              }
            }
          );
          return
        }
        error = message || 'Login failed';
      },

    });
  }
  loginWithGoogle() {
    window.location.href = "http://localhost:8000/api/v1/auth/google"
  }
  loginWithGithub() {
    window.location.href = "http://localhost:8000/api/v1/auth/github"
  }
  constructor(private themeService: ThemeService) {
    this.themeService.darkMode$.subscribe((mode) => {
      this.isDarkMode = mode;
    });
  }
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
