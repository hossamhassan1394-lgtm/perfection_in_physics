import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Admin accounts (still using mock for now)
const ADMIN_ACCOUNTS = [
  { username: 'admin', password: 'admin123', name: 'Admin User' }
];

export interface LoginCredentials {
  identifier: string;
  password: string;
  userType: 'parent' | 'admin';
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  needsPasswordReset?: boolean;
  message?: string;
  user?: any;
}

export interface User {
  identifier: string;
  name: string;
  type: 'parent' | 'admin';
  needsPasswordReset?: boolean;
  students?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private readonly STORAGE_KEY = 'physics_portal_user';
  private readonly PASSWORD_STORAGE_KEY = 'physics_portal_passwords';
  private readonly REMEMBER_ME_KEY = 'physics_portal_remember_me';

  constructor(private http: HttpClient) {
    // Load user from localStorage ONLY if "Remember Me" was checked
    this.loadUserFromStorage();
  }

  private normalizePhone(phone: string): string {
    if (!phone) return '';
    const cleaned = (phone || '').toString().replace(/\D/g, '');
    let s = cleaned;
    if (s.startsWith('00')) s = s.slice(2);
    if (s.startsWith('20') && s.length >= 11) {
      const candidate = '0' + s.slice(2);
      if (candidate.startsWith('01') && candidate.length === 11) return candidate;
    }
    if (s.length === 11 && s.startsWith('01')) return s;
    if (s.length === 10 && s.startsWith('1')) return '0' + s;
    if (s.length > 11) {
      const last10 = s.slice(-10);
      if (last10.startsWith('1')) return '0' + last10;
    }
    return s;
  }

  /**
   * Login method - authenticates with backend API
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    if (credentials.userType === 'parent') {
      // Authenticate parent with backend API
      return new Observable(observer => {
        const phone = this.normalizePhone(credentials.identifier);
        this.http.post<{
          success: boolean;
          user?: { phone_number: string; name: string; needs_password_reset: boolean };
          needs_password_reset?: boolean;
          message?: string;
        }>(`${environment.apiUrl}/auth/login`, {
          phone_number: phone,
          password: credentials.password
        }).subscribe({
          next: (response) => {
            if (response.success && response.user) {
              const userPhone = this.normalizePhone(response.user.phone_number || phone);
              const user: User = {
                identifier: userPhone,
                name: response.user.name || '',
                type: 'parent',
                needsPasswordReset: response.needs_password_reset || response.user.needs_password_reset || false
              };

              this.currentUser.set(user);

              // Save to storage only if "Remember Me" is checked
              if (credentials.rememberMe) {
                this.saveUserToStorage(user, true);
              } else {
                this.saveUserToStorage(user, false);
              }

              observer.next({
                success: true,
                needsPasswordReset: user.needsPasswordReset,
                user
              });
            } else {
              observer.next({
                success: false,
                message: response.message || 'Invalid phone number or password'
              });
            }
            observer.complete();
          },
          error: (error) => {
            observer.next({
              success: false,
              message: error.error?.message || 'Invalid phone number or password'
            });
            observer.complete();
          }
        });
      });
    } else {
      // Admin login via backend API
      return new Observable(observer => {
        this.http.post<{ success: boolean; user?: { username: string; name?: string }; message?: string }>(
          `${environment.apiUrl}/admin/login`,
          {
            username: credentials.identifier,
            password: credentials.password
          }
        ).subscribe({
          next: (response) => {
            if (response.success && response.user) {
              const user: User = {
                identifier: response.user.username,
                name: response.user.name || '',
                type: 'admin'
              };

              this.currentUser.set(user);

              if (credentials.rememberMe) {
                this.saveUserToStorage(user, true);
              } else {
                this.saveUserToStorage(user, false);
              }

              observer.next({ success: true, user });
            } else {
              observer.next({ success: false, message: response.message || 'Invalid admin credentials' });
            }
            observer.complete();
          },
          error: (error) => {
            observer.next({ success: false, message: error.error?.message || 'Invalid admin credentials' });
            observer.complete();
          }
        });
      });
    }
  }

  /**
   * Reset password for first-time login
   */
  resetPassword(newPassword: string): Observable<{ success: boolean; message?: string }> {
    const user = this.currentUser();

    if (!user) {
      return of({
        success: false,
        message: 'No user logged in'
      });
    }

    if (newPassword.length < 6) {
      return of({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if (user.type === 'parent') {
      // Reset password via backend API
      return new Observable(observer => {
        const phone = this.normalizePhone(user.identifier || '');
        this.http.post<{ success: boolean; message?: string }>(`${environment.apiUrl}/auth/reset-password`, {
          phone_number: phone,
          new_password: newPassword
        }).subscribe({
          next: (response) => {
            if (response.success) {
              // Update user state
              const updatedUser = { ...user, needsPasswordReset: false };
              this.currentUser.set(updatedUser);

              // Update storage with new user state
              const rememberMe = this.isRememberMeEnabled();
              this.saveUserToStorage(updatedUser, rememberMe);
            }
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            observer.next({
              success: false,
              message: error.error?.message || 'Failed to update password'
            });
            observer.complete();
          }
        });
      });
    } else {
      // Admin password reset via backend API
      return new Observable(observer => {
        this.http.post<{ success: boolean; message?: string }>(`${environment.apiUrl}/admin/reset-password`, {
          username: user.identifier,
          new_password: newPassword
        }).subscribe({
          next: (response) => {
            if (response.success) {
              const updatedUser = { ...user, needsPasswordReset: false };
              this.currentUser.set(updatedUser);
              const rememberMe = this.isRememberMeEnabled();
              this.saveUserToStorage(updatedUser, rememberMe);
            }
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            observer.next({ success: false, message: error.error?.message || 'Failed to update password' });
            observer.complete();
          }
        });
      });
    }
  }

  /**
   * Logout method
   */
  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Check if "Remember Me" is enabled
   */
  isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Get user type
   */
  getUserType(): 'parent' | 'admin' | null {
    const user = this.currentUser();
    return user ? user.type : null;
  }

  /**
   * Check if password reset is needed
   */
  needsPasswordReset(): boolean {
    const user = this.currentUser();
    return user?.needsPasswordReset ?? false;
  }

  // Private helper methods (no longer needed for parent auth, but keeping for admin)

  private saveUserToStorage(user: User, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
    } else {
      // Store user for current session only (will be cleared on logout)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
  }

  private loadUserFromStorage(): void {
    // Only auto-load if "Remember Me" was checked
    const rememberMe = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';

    if (!rememberMe) {
      // Clear any existing session
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        this.currentUser.set(user);
        console.log('✅ User auto-logged in (Remember Me enabled)');
      } catch (error) {
        console.error('Error loading user from storage:', error);
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.REMEMBER_ME_KEY);
      }
    }
  }
}