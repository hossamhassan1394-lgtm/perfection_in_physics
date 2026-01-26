import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { ParentDashboardComponent } from './features/dashboard/parent-dashboard/parent-dashboard.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: ParentDashboardComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'parent' }
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    data: { requiredRole: 'admin' }
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];