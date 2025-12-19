import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Eye, 
  EyeOff, 
  Atom, 
  Zap, 
  Waves, 
  CircuitBoard, 
  Sparkles, 
  User, 
  Shield, 
  Copy 
} from 'lucide-angular';
import { PhysicsBackgroundComponent } from '../../../shared/components/physics-background/physics-background.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    PhysicsBackgroundComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Lucide icons
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Atom = Atom;
  readonly Zap = Zap;
  readonly Waves = Waves;
  readonly CircuitBoard = CircuitBoard;
  readonly Sparkles = Sparkles;
  readonly User = User;
  readonly Shield = Shield;
  readonly Copy = Copy;

  // Signals for reactive state
  showPassword = signal(false);
  phoneNumber = signal('');
  password = signal('');
  rememberMe = signal(false);
  activeTab = signal<'parent' | 'admin'>('parent');
  passwordStrength = signal(0);
  loginError = signal('');

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in with "Remember Me"
    if (this.authService.isLoggedIn() && this.authService.isRememberMeEnabled()) {
      console.log('✅ User has "Remember Me" enabled - auto-redirecting');
      this.redirectToDashboard();
    } else {
      // Clear any existing session if "Remember Me" is not enabled
      console.log('📝 Login page loaded - Please sign in');
    }
  }

  redirectToDashboard(): void {
    // Check if password reset is needed first
    if (this.authService.needsPasswordReset()) {
      this.router.navigate(['/reset-password']);
      return;
    }

    // Navigate based on user type
    const userType = this.authService.getUserType();
    if (userType === 'parent') {
      this.router.navigate(['/dashboard']);
    } else if (userType === 'admin') {
      this.router.navigate(['/admin']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(val => !val);
  }

  setActiveTab(tab: 'parent' | 'admin'): void {
    this.activeTab.set(tab);
    this.loginError.set('');
    this.phoneNumber.set('');
    this.password.set('');
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
    
    // Calculate password strength
    let strength = 0;
    if (value.length > 6) strength += 25;
    if (value.length > 10) strength += 25;
    if (/[A-Z]/.test(value)) strength += 25;
    if (/[0-9]/.test(value)) strength += 25;
    
    this.passwordStrength.set(strength);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('📋 Copied to clipboard:', text);
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.loginError.set('');

    console.log('🔐 Login attempt started');
    console.log('   Phone/Username:', this.phoneNumber());
    console.log('   User Type:', this.activeTab());
    console.log('   Remember Me:', this.rememberMe());

    // Basic validation
    if (!this.phoneNumber() || !this.password()) {
      this.loginError.set('Please fill in all fields');
      return;
    }

    const credentials = {
      identifier: this.phoneNumber(),
      password: this.password(),
      userType: this.activeTab(),
      rememberMe: this.rememberMe()
    };

    // Attempt login through auth service
    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Login successful!', response.user);
          
          // Check if password reset is needed (first-time login)
          if (response.needsPasswordReset) {
            console.log('⚠️ First-time login - Password reset required');
            this.router.navigate(['/reset-password']);
          } else {
            // Navigate based on user type
            if (this.activeTab() === 'parent') {
              console.log('📊 Navigating to parent dashboard');
              this.router.navigate(['/dashboard']);
            } else {
              console.log('🔧 Navigating to admin dashboard');
              this.router.navigate(['/admin']);
            }
          }
        } else {
          this.loginError.set(response.message || 'Login failed');
          console.error('❌ Login failed:', response.message);
        }
      },
      error: (error) => {
        this.loginError.set('Invalid credentials. Please try again.');
        console.error('❌ Login error:', error);
      }
    });
  }
}