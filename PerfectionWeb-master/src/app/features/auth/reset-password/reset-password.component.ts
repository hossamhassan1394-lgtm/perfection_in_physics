import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  LucideAngularModule,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  ChevronLeft
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  // Icons
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Shield = Shield;
  readonly Loader2 = Loader2;
  readonly ChevronLeft = ChevronLeft;

  // Language signal
  lang = signal<'en' | 'ar'>('en');

  // Form state
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  newPassword = signal('');
  confirmPassword = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  // Computed properties
  passwordStrength = computed(() => {
    const password = this.newPassword();
    let strength = 0;

    if (password.length > 6) strength += 25;
    if (password.length > 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    return strength;
  });

  // Password validation helpers
  hasUpperCase = computed(() => /[A-Z]/.test(this.newPassword()));
  hasNumber = computed(() => /[0-9]/.test(this.newPassword()));
  hasMinLength = computed(() => this.newPassword().length >= 6);

  passwordsMatch = computed(() => {
    return this.newPassword() === this.confirmPassword() && this.confirmPassword() !== '';
  });

  isFormValid = computed(() => {
    return this.newPassword().length >= 6 &&
      this.passwordsMatch() &&
      !this.isLoading();
  });

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Check if user is logged in and needs password reset
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.needsPasswordReset()) {
      // User doesn't need password reset, redirect to dashboard
      const userType = this.authService.getUserType();
      if (userType === 'parent') {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/admin']);
      }
    }
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.update(val => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(val => !val);
  }

  onNewPasswordChange(value: string): void {
    this.newPassword.set(value);
    this.errorMessage.set('');
  }

  getStrengthText(): string {
    const strength = this.passwordStrength();
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Medium';
    return 'Strong';
  }

  getStrengthColor(): string {
    const strength = this.passwordStrength();
    if (strength < 25) return 'text-red-400';
    if (strength < 50) return 'text-orange-400';
    if (strength < 75) return 'text-yellow-400';
    return 'text-green-400';
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set('');

    // Validate form
    if (!this.isFormValid()) {
      return;
    }

    if (!this.passwordsMatch()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (this.newPassword().length < 6) {
      this.errorMessage.set('Password must be at least 6 characters long');
      return;
    }

    // Set loading state
    this.isLoading.set(true);

    // Call auth service to reset password
    this.authService.resetPassword(this.newPassword()).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (response.success) {
          // Password reset successful, navigate to dashboard
          const userType = this.authService.getUserType();
          if (userType === 'parent') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/admin']);
          }
        } else {
          this.errorMessage.set(response.message || 'Failed to update password');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('An error occurred. Please try again.');
        console.error('Password reset error:', error);
      }
    });
  }

  // Go back to previous page
  goBack(): void {
    this.location.back();
  }

  // Toggle language between English and Arabic
  toggleLanguage(): void {
    const newLang = this.lang() === 'en' ? 'ar' : 'en';
    this.lang.set(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  }
} 