import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import {
  LucideAngularModule,
  Users,
  TrendingUp,
  DollarSign,
  Award,
  ChevronLeft,
  LogOut
} from 'lucide-angular';
// import { TopNavComponent } from '../../../shared/components/top-nav/top-nav.component';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService, Student } from '../../../core/services/student.service';
import { ExcelUploadComponent } from '../excel-upload/excel-upload.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ExcelUploadComponent
    // TopNavComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // Icons
  readonly Users = Users;
  readonly TrendingUp = TrendingUp;
  readonly DollarSign = DollarSign;
  readonly Award = Award;
  readonly ChevronLeft = ChevronLeft;
  readonly LogOut = LogOut;

  // Language signal
  lang = signal<'en' | 'ar'>('en');

  // Component state
  allStudents = signal<Student[]>([]);
  uploadErrors = signal<Array<{ timestamp: string; level: string; message: string }>>([]);

  // Computed statistics
  totalStudents = computed(() => this.allStudents().length);

  averageAttendance = computed(() => {
    const students = this.allStudents();
    if (students.length === 0) return 0;
    const total = students.reduce((sum, s) => sum + s.attendance, 0);
    return Math.round(total / students.length);
  });

  totalRevenue = computed(() => {
    const students = this.allStudents();
    const totalPaid = students.reduce((sum, s) => sum + s.payments.paid, 0);
    return `${totalPaid} months`;
  });

  averageQuizScore = computed(() => {
    const students = this.allStudents();
    if (students.length === 0) return 0;
    const total = students.reduce((sum, s) => sum + s.quizzes.average, 0);
    return Math.round(total / students.length);
  });

  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private studentService: StudentService
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.getUserType() !== 'admin') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAllStudents();
    this.loadUploadErrors();
  }

  loadAllStudents(): void {
    this.studentService.getAllStudents().subscribe({
      next: (students) => {
        this.allStudents.set(students);
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  getAttendanceColor(attendance: number): string {
    if (attendance >= 90) return 'bg-green-500/20 text-green-300';
    if (attendance >= 75) return 'bg-blue-500/20 text-blue-300';
    if (attendance >= 60) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return 'bg-green-500/20 text-green-300';
    if (score >= 75) return 'bg-blue-500/20 text-blue-300';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
  }

  getPaymentColor(payment: { paid: number; total: number }): string {
    const percentage = (payment.paid / payment.total) * 100;
    if (percentage === 100) return 'bg-green-500/20 text-green-300';
    if (percentage >= 75) return 'bg-blue-500/20 text-blue-300';
    if (percentage >= 50) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
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

  // Logout
  handleLogout(): void {
    try {
      console.log('🔓 Logging out admin user');
      this.authService.logout();
      console.log('✓ Auth service logout complete');

      // Navigate to login with replace to prevent back button
      this.router.navigate(['/login'], { replaceUrl: true }).then(success => {
        if (success) {
          console.log('✓ Successfully navigated to login');
        } else {
          console.error('✗ Failed to navigate to login - falling back to full page redirect');
          try {
            window.location.replace('/login');
          } catch (e) {
            console.error('Fallback redirect failed', e);
          }
        }
      }).catch(err => {
        console.error('✗ Navigation error:', err);
        try {
          window.location.replace('/login');
        } catch (e) {
          console.error('Fallback redirect failed', e);
        }
      });
    } catch (error) {
      console.error('✗ Logout error:', error);
    }
  }

  // Download uploads.log from backend
  async downloadLog(): Promise<void> {
    try {
      const resp = await fetch('/api/upload-log/download', { method: 'GET' });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Failed to download log:', resp.status, txt);
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'uploads.log';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      console.log('Log download started');
    } catch (err) {
      console.error('Error downloading log:', err);
    }
  }

  loadUploadErrors(): void {
    fetch('/api/admin/upload-errors?limit=50')
      .then(resp => resp.json())
      .then(data => {
        if (data.errors && Array.isArray(data.errors)) {
          this.uploadErrors.set(data.errors);
        }
      })
      .catch(err => {
        console.error('Error loading upload errors:', err);
      });
  }
}