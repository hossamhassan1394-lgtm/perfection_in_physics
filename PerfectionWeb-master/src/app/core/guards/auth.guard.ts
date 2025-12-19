import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 Auth Guard Triggered');
  console.log('   Route Path:', route.routeConfig?.path);
  console.log('   Is Logged In:', authService.isLoggedIn());
  console.log('   User Type:', authService.getUserType());
  console.log('   Needs Password Reset:', authService.needsPasswordReset());

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    console.log('❌ Not logged in - redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  // Get current route path
  const currentPath = route.routeConfig?.path || '';

  // SPECIAL CASE: Reset Password Route
  if (currentPath === 'reset-password') {
    // If user needs password reset, allow access to reset page
    if (authService.needsPasswordReset()) {
      console.log('✅ Allowing access to reset-password page');
      return true;
    }
    
    // If user doesn't need password reset, redirect to their dashboard
    console.log('⚠️ User does not need password reset - redirecting to dashboard');
    const userType = authService.getUserType();
    if (userType === 'parent') {
      router.navigate(['/dashboard']);
    } else if (userType === 'admin') {
      router.navigate(['/admin']);
    }
    return false;
  }

  // FOR ALL OTHER ROUTES: Check if password reset is needed FIRST
  if (authService.needsPasswordReset()) {
    console.log('⚠️ Password reset required - redirecting to reset-password');
    router.navigate(['/reset-password']);
    return false;
  }

  // Check role-based access
  const requiredRole = route.data['requiredRole'];
  if (requiredRole) {
    const userType = authService.getUserType();
    
    console.log('   Required Role:', requiredRole);
    console.log('   User Role:', userType);
    
    if (userType !== requiredRole) {
      console.log('❌ Role mismatch - redirecting');
      // Redirect to appropriate dashboard based on user type
      if (userType === 'parent') {
        router.navigate(['/dashboard']);
      } else if (userType === 'admin') {
        router.navigate(['/admin']);
      } else {
        router.navigate(['/login']);
      }
      return false;
    }
  }

  console.log('✅ Access granted');
  return true;
};