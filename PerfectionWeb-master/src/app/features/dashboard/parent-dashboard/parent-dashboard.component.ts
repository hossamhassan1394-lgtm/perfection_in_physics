import { Component, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Atom,
  Users,
  Calendar,
  TrendingUp,
  MapPin,
  Zap,
  BookOpen,
  Trophy,
  History,
  CalendarDays,
  DollarSign,
  GraduationCap,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Settings,
  LogOut
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService, Student } from '../../../core/services/student.service';

export interface Session {
  id: number;
  chapter: number;
  name: string;
  lectureName?: string;
  date: string;
  startTime: string;
  endTime: string;
  start_time?: string;
  mark?: number;
  attendance: 'attended' | 'upcoming' | 'missed';
  quizCorrect: number;
  quizTotal: number;
  adminQuizMark?: number;
  payment: number;
  homeworkStatus: 'completed' | 'pending';
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss']
})
export class ParentDashboardComponent implements OnInit {
  // Icons
  readonly Atom = Atom;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly TrendingUp = TrendingUp;
  readonly MapPin = MapPin;
  readonly Zap = Zap;
  readonly BookOpen = BookOpen;
  readonly Trophy = Trophy;
  readonly History = History;
  readonly CalendarDays = CalendarDays;
  readonly DollarSign = DollarSign;
  readonly GraduationCap = GraduationCap;
  readonly Filter = Filter;
  readonly ChevronDown = ChevronDown;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Clock = Clock;
  readonly FileText = FileText;
  readonly Settings = Settings;
  readonly LogOut = LogOut;

  // Math reference for template
  Math = Math;

  // View references
  @ViewChild('sessionCarousel') sessionCarousel!: ElementRef<HTMLDivElement>;

  // Component state
  students = signal<Student[]>([]);
  selectedStudent = signal<Student | null>(null);
  selectedStudentId = signal<string | null>(null);
  sessions = signal<Session[]>([]);
  // Settings modal / change password
  showSettings = signal<boolean>(false);
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  settingsMessage = signal<string>('');

  // Language / translations (simple)
  lang = signal<'en' | 'ar'>('en');

  constructor(
    private router: Router,
    private authService: AuthService,
    private studentService: StudentService
  ) { }

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Check if password reset is needed
    if (this.authService.needsPasswordReset()) {
      this.router.navigate(['/reset-password']);
      return;
    }

    // Check if user is parent
    if (this.authService.getUserType() !== 'parent') {
      this.router.navigate(['/admin']);
      return;
    }

    // Load student data
    this.loadStudents();
  }

  loadStudents(): void {
    this.studentService.getStudentsForParent().subscribe({
      next: (students) => {
        this.students.set(students);
        if (students.length > 0) {
          // default to first student
          const first = students[0];
          this.selectedStudent.set(first);
          this.selectedStudentId.set(first.id);
          this.loadSessions(first.id);
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  onStudentChange(studentIdOrEvent: any): void {
    // ngModel will pass the selected id string
    const id = typeof studentIdOrEvent === 'string' ? studentIdOrEvent : String(studentIdOrEvent);
    const student = this.students().find(s => s.id === id);
    if (student) {
      this.selectedStudent.set(student);
      this.loadSessions(student.id);
    }
  }

  loadSessions(studentId: string): void {
    this.studentService.getSessionsForStudent(studentId).subscribe({
      next: (sessions) => {
        // Backend returns sessions in a compatible shape; set directly
        this.sessions.set(sessions as Session[]);
      },
      error: (err) => {
        console.error('Error loading sessions:', err);
      }
    });
  }

  /*onStudentChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const studentId = Number(selectElement.value);
    const student = this.students().find(s => s.id === studentId);
    if (student) {
      this.selectedStudent.set(student);
      this.loadSessions(student.id);
    }
  }
*/
  getPaymentPercentage(): number {
    const student = this.selectedStudent();
    if (!student) return 0;
    const { paid, total } = student.payments;
    return paid;
  }

  scrollSessions(direction: 'left' | 'right'): void {
    if (!this.sessionCarousel) return;

    const scrollAmount = 464; // card width (440) + gap (24)
    const container = this.sessionCarousel.nativeElement;

    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  }

  onLogout(): void {
    try {
      console.log('🔓 Parent logout initiated');
      this.authService.logout();
      // Prefer router navigation with replace to avoid back navigation, fallback to full reload
      this.router.navigate(['/login'], { replaceUrl: true }).then(success => {
        if (success) {
          console.log('✓ Navigated to login after logout');
        } else {
          console.error('✗ Router navigation to /login failed - falling back to full redirect');
          try { window.location.replace('/login'); } catch (e) { console.error('Fallback redirect failed', e); }
        }
      }).catch(err => {
        console.error('✗ Navigation error during logout:', err);
        try { window.location.replace('/login'); } catch (e) { console.error('Fallback redirect failed', e); }
      });
    } catch (e) {
      console.error('✗ Error during logout:', e);
      try { window.location.replace('/login'); } catch (err) { console.error('Fallback redirect failed', err); }
    }
  }

  // Expose login state to template
  isLoggedIn(): boolean {
    try {
      return this.authService.isLoggedIn();
    } catch {
      return false;
    }
  }

  // Open settings modal
  openSettings(): void {
    this.settingsMessage.set('');
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.showSettings.set(true);
  }

  closeSettings(): void {
    this.showSettings.set(false);
  }

  submitChangePassword(): void {
    this.settingsMessage.set('');
    const cur = this.currentPassword();
    const nw = this.newPassword();
    const conf = this.confirmPassword();

    if (!cur || !nw || !conf) {
      this.settingsMessage.set('Please fill all fields');
      return;
    }
    if (nw !== conf) {
      this.settingsMessage.set('New password and confirmation do not match');
      return;
    }

    this.authService.changePassword(cur, nw).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.settingsMessage.set('Password changed successfully');
          setTimeout(() => this.closeSettings(), 1200);
        } else {
          this.settingsMessage.set(resp.message || 'Failed to change password');
        }
      },
      error: (err) => {
        this.settingsMessage.set('Failed to change password');
        console.error('Change password error:', err);
      }
    });
  }

  // Compute current shamel grade from sessions (prefer general exam session)
  getCurrentShamel(): { score: number; total: number; label?: string } {
    // Try to find a session that looks like a general exam
    const exam = this.sessions().find(s => {
      const name = (s.name || '').toLowerCase();
      return name.includes('exam') || name.includes('shamel') || (s.quizTotal && s.quizTotal > 0 && s.attendance === 'attended');
    });

    if (exam) {
      return { score: exam.quizCorrect || 0, total: exam.quizTotal || 0, label: exam.name };
    }

    // Fallback to student quizzes average (map percentage to /60)
    const student = this.selectedStudent();
    if (student && student.quizzes && typeof student.quizzes.average === 'number') {
      const avg = student.quizzes.average;
      const total = 60;
      const score = Math.round((avg / 100) * total);
      return { score, total };
    }

    return { score: 0, total: 0 };
  }

  // Format timestamps to `MM/DD/YYYY hh:mm:ss AM/PM` (fallback to original if invalid)
  formatTimestamp(value?: string): string {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        // Try parsing as local date string
        const parsed = Date.parse(value);
        if (isNaN(parsed)) return value;
        return new Date(parsed).toLocaleString('en-US', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
      }
      return d.toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    } catch (e) {
      return value;
    }
  }

  // Helper methods for password inputs (convert any type to string)
  onCurrentPasswordChange(value: any): void {
    this.currentPassword.set(String(value || ''));
  }

  onNewPasswordChange(value: any): void {
    this.newPassword.set(String(value || ''));
  }

  onConfirmPasswordChange(value: any): void {
    this.confirmPassword.set(String(value || ''));
  }

  // Simple language toggle
  toggleLanguage(): void {
    const next = this.lang() === 'en' ? 'ar' : 'en';
    this.lang.set(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  }
}