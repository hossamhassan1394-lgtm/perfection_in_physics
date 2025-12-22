import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    if (credentials.userType === 'parent') {
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
      return new Observable(observer => {
        const phone = this.normalizePhone(user.identifier || '');
        this.http.post<{ success: boolean; message?: string }>(`${environment.apiUrl}/auth/reset-password`, {
          phone_number: phone,
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
            observer.next({
              success: false,
              message: error.error?.message || 'Failed to update password'
            });
            observer.complete();
          }
        });
      });
    } else {
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

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message?: string }> {
    const user = this.currentUser();
    if (!user) {
      return of({ success: false, message: 'No user logged in' });
    }

    if (newPassword.length < 6) {
      return of({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (user.type === 'parent') {
      return new Observable(observer => {
        const phone = this.normalizePhone(user.identifier || '');
        this.http.post<{ success: boolean; message?: string }>(`${environment.apiUrl}/auth/change-password`, {
          phone_number: phone,
          current_password: currentPassword,
          new_password: newPassword
        }).subscribe({
          next: (response) => {
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            observer.next({ success: false, message: error.error?.message || 'Failed to change password' });
            observer.complete();
          }
        });
      });
    } else {
      return new Observable(observer => {
        this.http.post<{ success: boolean; message?: string }>(`${environment.apiUrl}/admin/change-password`, {
          username: user.identifier,
          current_password: currentPassword,
          new_password: newPassword
        }).subscribe({
          next: (response) => {
            observer.next(response);
            observer.complete();
          },
          error: (error) => {
            observer.next({ success: false, message: error.error?.message || 'Failed to change password' });
            observer.complete();
          }
        });
      });
    }
  }

  logout(): void {
    this.currentUser.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.REMEMBER_ME_KEY);
      localStorage.removeItem(this.PASSWORD_STORAGE_KEY);
      sessionStorage.clear();
    } catch (e) {
      // Silent fail
    }
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  isRememberMeEnabled(): boolean {
    return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  getUserType(): 'parent' | 'admin' | null {
    const user = this.currentUser();
    return user ? user.type : null;
  }

  needsPasswordReset(): boolean {
    const user = this.currentUser();
    return user?.needsPasswordReset ?? false;
  }

  private saveUserToStorage(user: User, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    }
  }

  private loadUserFromStorage(): void {
    const rememberMe = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';

    if (!rememberMe) {
      localStorage.removeItem(this.STORAGE_KEY);
      return;
    }

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        this.currentUser.set(user);
      } catch (error) {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.REMEMBER_ME_KEY);
      }
    }
  }
}