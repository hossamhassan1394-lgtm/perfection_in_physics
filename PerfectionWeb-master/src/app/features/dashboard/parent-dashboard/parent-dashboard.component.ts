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
import { NoDataComponent } from '../../../shared/components/no-data/no-data.component';

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

interface UniqueStudent {
  parentNumber: string;
  name: string;
  combinedId: string;
  ids: string[];
  grade: string;
  sessions: Session[];
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    NoDataComponent
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

  // Component state - using unified students
  uniqueStudents = signal<UniqueStudent[]>([]);
  selectedStudent = signal<UniqueStudent | null>(null);
  selectedStudentCombinedId = signal<string | null>(null);
  sessions = signal<Session[]>([]);

  // Loading and error states
  isLoadingStudents = signal(true);
  isLoadingSessions = signal(false);
  hasError = signal(false);

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
    this.isLoadingStudents.set(true);
    this.hasError.set(false);

    this.studentService.getStudentsForParent().subscribe({
      next: (students) => {
        console.log('📚 Raw students from backend:', students);

        // Backend returns students already grouped by parent_no + name
        const uniqueStudentsList: UniqueStudent[] = students.map((student: Student) => {
          return {
            parentNumber: student.id,
            name: student.name,
            combinedId: `${student.id}_${student.name}`,
            ids: [student.id],
            grade: student.grade,
            sessions: []
          };
        });

        console.log('✅ Unique students loaded:', uniqueStudentsList);

        this.uniqueStudents.set(uniqueStudentsList);
        this.isLoadingStudents.set(false);

        if (uniqueStudentsList.length > 0) {
          const first = uniqueStudentsList[0];
          this.selectedStudent.set(first);
          this.selectedStudentCombinedId.set(first.combinedId);

          // Add small delay to ensure DOM is ready
          setTimeout(() => {
            this.loadSessionsForStudent(first);
          }, 100);
        } else {
          // No students found - clear everything
          this.sessions.set([]);
          this.sessionCount.set(0);
          this.attendedCount.set(0);
          this.missedCount.set(0);
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.isLoadingStudents.set(false);
        this.hasError.set(true);
        this.sessions.set([]);
        this.sessionCount.set(0);
        this.attendedCount.set(0);
        this.missedCount.set(0);
      }
    });
  }

  onStudentChange(combinedIdOrEvent: any): void {
    const combinedId = typeof combinedIdOrEvent === 'string' ? combinedIdOrEvent : String(combinedIdOrEvent);
    const student = this.uniqueStudents().find(s => s.combinedId === combinedId);
    if (student) {
      this.selectedStudent.set(student);
      this.loadSessionsForStudent(student);
    }
  }

  loadSessionsForStudent(student: UniqueStudent): void {
    console.log(`📚 Loading sessions for ${student.name} (Parent: ${student.parentNumber})`);

    this.isLoadingSessions.set(true);

    this.studentService.getSessionsForStudent(student.ids[0]).subscribe({
      next: (sessions) => {
        console.log(`📚 Loaded ${sessions.length} sessions for ${student.name}`);

        // Sort sessions by upload/created time (most recent first).
        const sortedSessions = (sessions as Session[]).slice().sort((a: any, b: any) => {
          const getTimestamp = (s: any) => {
            const keys = ['created_at', 'start_time', 'startTime', 'date'];
            for (const k of keys) {
              if (s && s[k]) {
                const t = Date.parse(String(s[k]));
                if (!isNaN(t)) return t;
              }
            }
            return 0;
          };
          return getTimestamp(b) - getTimestamp(a);
        });

        this.sessions.set(sortedSessions);
        this.isLoadingSessions.set(false);

        // Calculate session statistics using sorted list
        const total = sortedSessions.length;
        const attended = sortedSessions.filter(s => s.attendance === 'attended').length;
        const missed = sortedSessions.filter(s => s.attendance === 'missed').length;

        this.sessionCount.set(total);
        this.attendedCount.set(attended);
        this.missedCount.set(missed);

        // Debug: Check for general exams that are attended
        const attendedGeneralExams = sessions.filter((s: any) => {
          const isGeneralExam = s.is_general_exam === true || s.isGeneralExam === true;
          const isAttended = s.attendance === 'attended';
          return isGeneralExam && isAttended;
        });

        console.log('🏆 Attended general exams found:', attendedGeneralExams);

        // Log each session's details
        sessions.forEach((s: any, index: number) => {
          console.log(`Session ${index + 1}:`, {
            id: s.id,
            name: s.name,
            is_general_exam: s.is_general_exam,
            isGeneralExam: s.isGeneralExam,
            attendance: s.attendance,
            quizCorrect: s.quizCorrect,
            adminQuizMark: s.adminQuizMark,
            quizTotal: s.quizTotal
          });
        });
      },
      error: (err) => {
        console.error('Error loading sessions:', err);
        this.isLoadingSessions.set(false);
        this.sessionCount.set(0);
        this.attendedCount.set(0);
        this.missedCount.set(0);
        this.sessions.set([]);
      }
    });
  }

  // Helper methods for data state checking
  hasStudentData(): boolean {
    return this.uniqueStudents().length > 0;
  }

  hasSessionData(): boolean {
    return this.sessions().length > 0;
  }

  refreshData(): void {
    console.log('🔄 Refreshing data...');
    if (this.selectedStudent()) {
      console.log('🔄 Reloading sessions for current student');
      this.loadSessionsForStudent(this.selectedStudent()!);
    } else {
      console.log('🔄 Reloading all students');
      this.loadStudents();
    }
  }

  // Calculate attendance percentage
  getAttendancePercentage(): number {
    const total = this.sessionCount();
    const attended = this.attendedCount();
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  }

  // Get total paid amount from sessions
  getTotalPayment(): number {
    return this.sessions().reduce((sum, session) => sum + (session.payment || 0), 0);
  }

  // Calculate quiz performance percentage
  getQuizPerformance(): number {
    const sessions = this.sessions();
    let totalCorrect = 0;
    let totalQuestions = 0;

    sessions.forEach(session => {
      if (session.attendance === 'attended') {
        totalCorrect += session.quizCorrect || 0;
        const totalForSession = session.adminQuizMark || session.quizTotal || 0;
        totalQuestions += totalForSession;
      }
    });

    if (totalQuestions === 0) return 0;
    return Math.round((totalCorrect / totalQuestions) * 100);
  }

  // Get quiz details for display
  getQuizDetails(): { correct: number; total: number } {
    const sessions = this.sessions();
    let totalCorrect = 0;
    let totalQuestions = 0;

    sessions.forEach(session => {
      if (session.attendance === 'attended') {
        totalCorrect += session.quizCorrect || 0;
        const totalForSession = session.adminQuizMark || session.quizTotal || 0;
        totalQuestions += totalForSession;
      }
    });

    return { correct: totalCorrect, total: totalQuestions };
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
    const sessionAny = session as any;

    const isMarkedAsGeneralExam = (
      sessionAny.is_general_exam === true ||
      sessionAny.is_general_exam === 'true' ||
      sessionAny.is_general_exam === 1 ||
      sessionAny.isGeneralExam === true ||
      sessionAny.isGeneralExam === 'true' ||
      sessionAny.isGeneralExam === 1 ||
      sessionAny.general_exam === true ||
      sessionAny.generalExam === true
    );

    const nameStr = (session.name || session.lectureName || '').toLowerCase();
    const hasExamKeyword =
      nameStr.includes('shamel') ||
      nameStr.includes('شامل') ||
      nameStr.includes('general exam') ||
      nameStr.includes('امتحان عام');

    return isMarkedAsGeneralExam || hasExamKeyword;
  }

  // Check if student has attended general exam data
  hasShamelData(): boolean {
    const sessions = this.sessions();
    console.log('🔍 Checking for Shamel data. Total sessions:', sessions.length);

    const exam = sessions.find(s => {
      const sessionAny = s as any;

      const isMarkedAsGeneralExam =
        sessionAny.is_general_exam === true ||
        sessionAny.is_general_exam === 'true' ||
        sessionAny.is_general_exam === 1 ||
        sessionAny.isGeneralExam === true ||
        sessionAny.isGeneralExam === 'true' ||
        sessionAny.isGeneralExam === 1 ||
        sessionAny.general_exam === true ||
        sessionAny.generalExam === true;

      const nameStr = (s.name || s.lectureName || '').toLowerCase();
      const hasExamKeyword =
        nameStr.includes('shamel') ||
        nameStr.includes('شامل') ||
        nameStr.includes('general exam') ||
        nameStr.includes('امتحان عام');

      const isGeneralExam = isMarkedAsGeneralExam || hasExamKeyword;
      const isAttended = s.attendance === 'attended';

      console.log(`📋 Session ${s.id} (${s.name}):`, {
        'is_general_exam': sessionAny.is_general_exam,
        'name': s.name,
        'hasExamKeyword': hasExamKeyword,
        'attendance': s.attendance,
        'isGeneralExam': isGeneralExam,
        'isAttended': isAttended,
        'QUALIFIES': isGeneralExam && isAttended
      });

      return isGeneralExam && isAttended;
    });

    if (exam) {
      console.log('✅ Found qualifying attended general exam:', exam);
    } else {
      console.log('❌ No attended general exam found');
    }

    return !!exam;
  }

  // Get current shamel grade from attended general exam session
  getCurrentShamel(): { score: number; total: number; label?: string } {
    const sessions = this.sessions();
    const exam = sessions.find(s => {
      const sessionAny = s as any;

      const isMarkedAsGeneralExam =
        sessionAny.is_general_exam === true ||
        sessionAny.is_general_exam === 'true' ||
        sessionAny.is_general_exam === 1 ||
        sessionAny.isGeneralExam === true ||
        sessionAny.isGeneralExam === 'true' ||
        sessionAny.isGeneralExam === 1 ||
        sessionAny.general_exam === true ||
        sessionAny.generalExam === true;

      const nameStr = (s.name || s.lectureName || '').toLowerCase();
      const hasExamKeyword =
        nameStr.includes('shamel') ||
        nameStr.includes('شامل') ||
        nameStr.includes('general exam') ||
        nameStr.includes('امتحان عام');

      const isGeneralExam = isMarkedAsGeneralExam || hasExamKeyword;

      return isGeneralExam && s.attendance === 'attended';
    });

    if (exam) {
      const total = exam.adminQuizMark || exam.quizTotal || 60;
      const score = exam.quizCorrect || 0;
      console.log('📊 Shamel grade calculated:', { score, total, label: exam.name });
      return {
        score,
        total,
        label: exam.name || exam.lectureName || 'General Exam'
      };
    }

    console.log('⚠️ No attended Shamel data available, returning default');
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