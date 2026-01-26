import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

// Mock data simulating Excel sheet of parent phone numbers
const PARENT_ACCOUNTS = [
  { phone: '+20 100-0000-000', password: '123456', needsPasswordReset: true, name: 'Parent 1', students: [1, 2] },
  { phone: '+20 101-1111-111', password: '123456', needsPasswordReset: true, name: 'Parent 2', students: [3] },
  { phone: '+20 102-2222-222', password: '123456', needsPasswordReset: true, name: 'Parent 3', students: [4, 5] },
];

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

  constructor() {
    // Load user from localStorage ONLY if "Remember Me" was checked
    this.loadUserFromStorage();
  }

  /**
   * Login method - simulates backend authentication
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        if (credentials.userType === 'parent') {
          const account = this.findParentAccount(credentials.identifier, credentials.password);
          
          if (account) {
            const user: User = {
              identifier: account.phone,
              name: account.name,
              type: 'parent',
              needsPasswordReset: account.needsPasswordReset,
              students: account.students
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
              needsPasswordReset: account.needsPasswordReset,
              user
            });
          } else {
            observer.next({
              success: false,
              message: 'Invalid phone number or password'
            });
          }
        } else {
          const account = ADMIN_ACCOUNTS.find(
            acc => acc.username === credentials.identifier && acc.password === credentials.password
          );
          
          if (account) {
            const user: User = {
              identifier: account.username,
              name: account.name,
              type: 'admin'
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
              user
            });
          } else {
            observer.next({
              success: false,
              message: 'Invalid admin credentials'
            });
          }
        }
        
        observer.complete();
      }, 500);
    });
  }

  /**
   * Reset password for first-time login
   */
  resetPassword(newPassword: string): Observable<{ success: boolean; message?: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        const user = this.currentUser();
        
        if (!user) {
          observer.next({
            success: false,
            message: 'No user logged in'
          });
          observer.complete();
          return;
        }

        if (newPassword.length < 6) {
          observer.next({
            success: false,
            message: 'Password must be at least 6 characters'
          });
          observer.complete();
          return;
        }

        // Update password in mock storage
        this.updateParentPassword(user.identifier, newPassword);
        
        // Update user state
        const updatedUser = { ...user, needsPasswordReset: false };
        this.currentUser.set(updatedUser);
        
        // Update storage with new user state
        const rememberMe = this.isRememberMeEnabled();
        this.saveUserToStorage(updatedUser, rememberMe);
        
        observer.next({
          success: true,
          message: 'Password updated successfully'
        });
        observer.complete();
      }, 300);
    });
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

  // Private helper methods

  private findParentAccount(phone: string, password: string) {
    // First check if there's a custom password stored
    const customPasswords = this.getCustomPasswords();
    const customPassword = customPasswords[phone];
    
    if (customPassword) {
      // User has already reset their password
      if (customPassword === password) {
        const account = PARENT_ACCOUNTS.find(acc => acc.phone === phone);
        return account ? { ...account, needsPasswordReset: false } : null;
      }
      return null;
    }
    
    // Check default password (first-time login)
    return PARENT_ACCOUNTS.find(
      acc => acc.phone === phone && acc.password === password
    );
  }

  private updateParentPassword(phone: string, newPassword: string): void {
    const customPasswords = this.getCustomPasswords();
    customPasswords[phone] = newPassword;
    localStorage.setItem(this.PASSWORD_STORAGE_KEY, JSON.stringify(customPasswords));
  }

  private getCustomPasswords(): Record<string, string> {
    const stored = localStorage.getItem(this.PASSWORD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

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