import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Get current route path
  const currentPath = route.routeConfig?.path || '';


  // Check role-based access
  const requiredRole = route.data['requiredRole'];
  if (requiredRole) {
    const userType = authService.getUserType();

    if (userType !== requiredRole) {
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

  return true;
};