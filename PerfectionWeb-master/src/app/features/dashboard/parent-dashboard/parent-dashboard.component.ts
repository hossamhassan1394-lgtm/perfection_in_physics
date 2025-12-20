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
  is_general_exam?: boolean;
  isGeneralExam?: boolean;
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

  // Session counters
  sessionCount = signal<number>(0);
  attendedCount = signal<number>(0);
  missedCount = signal<number>(0);

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
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.needsPasswordReset()) {
      this.router.navigate(['/reset-password']);
      return;
    }

    if (this.authService.getUserType() !== 'parent') {
      this.router.navigate(['/admin']);
      return;
    }

    this.loadStudents();
  }

  loadStudents(): void {
    this.studentService.getStudentsForParent().subscribe({
      next: (students) => {
        console.log('📚 Raw students from backend:', students);
        
        // Deduplicate students by ID
        const uniqueStudents = students.reduce((acc: Student[], current: Student) => {
          const existing = acc.find(s => s.id === current.id);
          if (!existing) {
            acc.push(current);
          } else {
            console.log(`⚠️ Duplicate student found: ${current.name} (ID: ${current.id})`);
          }
          return acc;
        }, []);
        
        console.log('✅ Unique students after deduplication:', uniqueStudents);
        
        this.students.set(uniqueStudents);
        
        if (uniqueStudents.length > 0) {
          const first = uniqueStudents[0];
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
    const id = typeof studentIdOrEvent === 'string' ? studentIdOrEvent : String(studentIdOrEvent);
    this.selectedStudentId.set(id);
    const student = this.students().find(s => s.id === id);
    if (student) {
      this.selectedStudent.set(student);
      this.loadSessions(student.id);
    }
  }

  loadSessions(studentId: string): void {
    this.studentService.getSessionsForStudent(studentId).subscribe({
      next: (sessions) => {
        console.log('📚 Raw sessions from backend:', sessions);
        
        this.sessions.set(sessions as Session[]);
        
        // Calculate session statistics
        const total = sessions.length;
        const attended = sessions.filter(s => s.attendance === 'attended').length;
        const missed = sessions.filter(s => s.attendance === 'missed').length;
        
        this.sessionCount.set(total);
        this.attendedCount.set(attended);
        this.missedCount.set(missed);
        
        // Debug: Check for general exams
        const generalExams = sessions.filter((s: any) => 
          s.is_general_exam === true || s.isGeneralExam === true
        );
        console.log('🏆 General exams found:', generalExams);
        
        // Log each session's is_general_exam status
        sessions.forEach((s: any, index: number) => {
          console.log(`Session ${index + 1}:`, {
            id: s.id,
            name: s.name,
            is_general_exam: s.is_general_exam,
            isGeneralExam: s.isGeneralExam,
            attendance: s.attendance
          });
        });
      },
      error: (err) => {
        console.error('Error loading sessions:', err);
        this.sessionCount.set(0);
        this.attendedCount.set(0);
        this.missedCount.set(0);
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

    const scrollAmount = 464;
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

  isLoggedIn(): boolean {
    try {
      return this.authService.isLoggedIn();
    } catch {
      return false;
    }
  }

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

  // Check if a specific session is a general exam
  isGeneralExamSession(session: Session): boolean {
    return (session as any).is_general_exam === true || (session as any).isGeneralExam === true;
  }

  // Check if student has general exam data
  hasShamelData(): boolean {
    const sessions = this.sessions();
    console.log('Checking for Shamel data in sessions:', sessions);
    
    const exam = sessions.find(s => {
      const isGeneralExam = (s as any).is_general_exam === true || (s as any).isGeneralExam === true;
      const isAttended = s.attendance === 'attended';
      console.log(`Session ${s.id}: is_general_exam=${isGeneralExam}, attendance=${s.attendance}`);
      return isGeneralExam && isAttended;
    });
    
    console.log('Found general exam:', exam);
    return !!exam;
  }

  // Get current shamel grade from general exam session
  getCurrentShamel(): { score: number; total: number; label?: string } {
    const sessions = this.sessions();
    const exam = sessions.find(s => {
      const isGeneralExam = (s as any).is_general_exam === true || (s as any).isGeneralExam === true;
      return isGeneralExam && s.attendance === 'attended';
    });

    if (exam) {
      const total = exam.adminQuizMark || exam.quizTotal || 60;
      const score = exam.quizCorrect || 0;
      console.log('Shamel grade:', { score, total, label: exam.name });
      return { 
        score, 
        total, 
        label: exam.name || exam.lectureName || 'General Exam'
      };
    }

    return { score: 0, total: 60, label: 'No exam data' };
  }

  formatTimestamp(value?: string): string {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) {
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

  onCurrentPasswordChange(value: any): void {
    this.currentPassword.set(String(value || ''));
  }

  onNewPasswordChange(value: any): void {
    this.newPassword.set(String(value || ''));
  }

  onConfirmPasswordChange(value: any): void {
    this.confirmPassword.set(String(value || ''));
  }

  toggleLanguage(): void {
    const next = this.lang() === 'en' ? 'ar' : 'en';
    this.lang.set(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  }
}