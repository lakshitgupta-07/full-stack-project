import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmPasswordValidator } from '../validators/confirm-password.validator';
import { ValidatePasswordPatternValidator } from '../validators/validate-password-pattern.validator';
import { NgIf } from '@angular/common';
import { ThemeService } from '../core/services/theme';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp implements OnInit {
  signUpForm!: FormGroup;
  isLoading = false;
  isDarkMode = false;
  private formBuilder =  inject(FormBuilder)
  private route = inject(Router)
    private authService = inject(AuthService)
  constructor(
    private themeService: ThemeService
  ) { 
    this.themeService.darkMode$.subscribe((mode) => {
      this.isDarkMode = mode
    })
  }

  ngOnInit(): void {
    this.signUpForm = this.formBuilder.group(
      {
        //username: ['', [Validators.required]],
        password: ['', [Validators.required, ValidatePasswordPatternValidator]],
        confirmPassword: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: [
          '',
          [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(10),
            Validators.pattern(/^\d{10}$/),
          ],
        ],
      },
      {
        validators: [ConfirmPasswordValidator, /*ContainsUsername*/],
      },
    );
  }
  onSubmit(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();

      return;
    }

    const { confirmPassword, ...registerData } = this.signUpForm.value;
    this.isLoading = true;
    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log(response);
        this.isLoading = false;
        // alert(response.message);
        alert('Email verification sent on registered email');
        this.route.navigate(['/login']);
      },

      error: (error) => {
        this.isLoading = false;
        console.error(error);

        console.log('Full Error:', error);

        alert(error?.error?.message || error.message || 'Unknown error');
      },
    });
  }
  signUpWithGoogle() {
    window.location.href = "http://localhost:8000/api/v1/auth/google"
  }
  signUpWithGithub() {
    window.location.href = "http://localhost:8000/api/v1/auth/github"
  }
  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
