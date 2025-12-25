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
  selectedMonth = signal<number | null>(null);
  availableMonths = signal<number[]>([]);

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

  // Language / translations - CHANGED DEFAULT TO ARABIC
  lang = signal<'en' | 'ar'>('ar');

  constructor(
    private router: Router,
    private authService: AuthService,
    private studentService: StudentService
  ) { }

  ngOnInit(): void {
    // Set Arabic as default on component initialization
    this.setLanguage('ar');

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

  // Helper method to set language and update DOM
  private setLanguage(language: 'en' | 'ar'): void {
    this.lang.set(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }

  loadStudents(): void {
    this.isLoadingStudents.set(true);
    this.hasError.set(false);

    this.studentService.getStudentsForParent().subscribe({
      next: (students) => {
        // Backend returns students already grouped by parent_no + name
        const uniqueStudentsList: UniqueStudent[] = students.map((student: Student) => {
          const sid = String(student.id || '');
          return {
            parentNumber: (student as any).parent_no || sid,
            name: student.name,
            combinedId: `${sid}_${student.name}`,
            ids: [sid],
            grade: student.grade,
            sessions: []
          };
        });

        this.uniqueStudents.set(uniqueStudentsList);
        this.isLoadingStudents.set(false);

        if (uniqueStudentsList.length > 0) {
          const first = uniqueStudentsList[0];
          this.selectedStudent.set(first);
          this.selectedStudentCombinedId.set(first.combinedId);

          // Add small delay to ensure DOM is ready, then load available months (which will load sessions)
          setTimeout(() => {
            this.loadAvailableMonthsForStudent(first);
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
      this.loadAvailableMonthsForStudent(student);
    }
  }

  loadAvailableMonthsForStudent(student: UniqueStudent): void {
    this.availableMonths.set([]);
    const combined = student.combinedId;
    this.studentService.getAvailableMonthsForStudent(combined).subscribe({
      next: (months) => {
        // Use only months returned by backend. If months returned, default to the first month and load sessions for it.
        if (months && months.length > 0) {
          // ensure months are sorted ascending
          months.sort((a, b) => a - b);
          this.availableMonths.set(months);
          // default selected month to latest available (most recent)
          const latest = months[months.length - 1];
          this.selectedMonth.set(latest);
          this.loadSessionsForStudent(student, latest);
        } else {
          // no months available — clear selection and load all sessions
          this.availableMonths.set([]);
          this.selectedMonth.set(null);
          this.loadSessionsForStudent(student);
        }
      },
      error: () => {
        this.availableMonths.set([]);
        this.selectedMonth.set(null);
        this.loadSessionsForStudent(student);
      }
    });
  }

  onMonthChange(month: any): void {
    const m = month === null || month === '' ? null : Number(month);
    this.selectedMonth.set(m);
    const student = this.selectedStudent();
    if (student) {
      this.loadSessionsForStudent(student, m);
    }
  }

  loadSessionsForStudent(student: UniqueStudent, month?: number | null): void {
    this.isLoadingSessions.set(true);

    this.studentService.getSessionsForStudent(student.combinedId, month).subscribe({
      next: (sessions) => {
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

        // Calculate session statistics using returned sessions list
        const regularSessions = (sortedSessions as any[]).filter((s: any) => {
          const sessionAny = s as any;
          const isGeneralExam =
            sessionAny.is_general_exam === true ||
            sessionAny.is_general_exam === 'true' ||
            sessionAny.is_general_exam === 1 ||
            sessionAny.isGeneralExam === true;
          return !isGeneralExam; // Exclude general exams
        });

        const total = regularSessions.length;
        const attended = regularSessions.filter((s: any) => s.attendance === 'attended').length;
        const missed = regularSessions.filter((s: any) => s.attendance === 'missed').length;

        this.sessionCount.set(total);
        this.attendedCount.set(attended);
        this.missedCount.set(missed);
      },
      error: (err) => {
        this.isLoadingSessions.set(false);
        this.sessionCount.set(0);
        this.attendedCount.set(0);
        this.missedCount.set(0);
        this.sessions.set([]);
      }
    });
  }

  applyMonthFilter(): void {
    const student = this.selectedStudent();
    const month = this.selectedMonth();
    if (student) {
      this.loadSessionsForStudent(student, month);
    }
  }

  // Helper methods for data state checking
  hasStudentData(): boolean {
    return this.uniqueStudents().length > 0;
  }

  hasSessionData(): boolean {
    return this.sessions().length > 0;
  }

  refreshData(): void {
    if (this.selectedStudent()) {
      this.loadSessionsForStudent(this.selectedStudent()!);
    } else {
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
      // Skip general exams
      const sessionAny = session as any;
      const isGeneralExam =
        sessionAny.is_general_exam === true ||
        sessionAny.is_general_exam === 'true' ||
        sessionAny.is_general_exam === 1 ||
        sessionAny.isGeneralExam === true;

      if (session.attendance === 'attended' && !isGeneralExam) {
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
      // Skip general exams - must match getQuizPerformance logic
      const sessionAny = session as any;
      const isGeneralExam =
        sessionAny.is_general_exam === true ||
        sessionAny.is_general_exam === 'true' ||
        sessionAny.is_general_exam === 1 ||
        sessionAny.isGeneralExam === true;

      if (session.attendance === 'attended' && !isGeneralExam) {
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
      this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true }).then(success => {
        if (!success) {
          try { window.location.replace('/login'); } catch (e) { }
        }
      }).catch(() => {
        try { window.location.replace('/login'); } catch (e) { }
      });
    } catch (e) {
      try { window.location.replace('/login'); } catch (err) { }
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
      this.settingsMessage.set(this.lang() === 'en' ? 'Please fill all fields' : 'يرجى ملء جميع الحقول');
      return;
    }
    if (nw !== conf) {
      this.settingsMessage.set(this.lang() === 'en' ? 'New password and confirmation do not match' : 'كلمة المرور الجديدة والتأكيد غير متطابقين');
      return;
    }

    this.authService.changePassword(cur, nw).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.settingsMessage.set(this.lang() === 'en' ? 'Password changed successfully' : 'تم تغيير كلمة المرور بنجاح');
          setTimeout(() => this.closeSettings(), 1200);
        } else {
          this.settingsMessage.set(resp.message || (this.lang() === 'en' ? 'Failed to change password' : 'فشل تغيير كلمة المرور'));
        }
      },
      error: (err) => {
        this.settingsMessage.set(this.lang() === 'en' ? 'Failed to change password' : 'فشل تغيير كلمة المرور');
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

      return isGeneralExam && isAttended;
    });

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
      return {
        score,
        total,
        label: exam.name || exam.lectureName || (this.lang() === 'en' ? 'General Exam' : 'امتحان عام')
      };
    }

    return { score: 0, total: 60, label: this.lang() === 'en' ? 'No exam data' : 'لا توجد بيانات امتحان' };
  }

  formatTimestamp(value?: string): string {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        const parsed = Date.parse(value);
        if (isNaN(parsed)) return value;
        const parsedDate = new Date(parsed);
        return this.formatDateWithDay(parsedDate);
      }
      return this.formatDateWithDay(d);
    } catch (e) {
      return value;
    }
  }

  private formatDateWithDay(date: Date): string {
    const currentLang = this.lang();

    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // ✅ ALL LOCAL — no UTC
    const dayIndex = date.getDay();
    const dayName = currentLang === 'en'
      ? dayNamesEn[dayIndex]
      : dayNamesAr[dayIndex];

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    const dateStr = `${month}/${day}/${year}`;

    const timeStr = date.toLocaleTimeString(
      currentLang === 'ar' ? 'ar-EG' : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    );

    return `${dayName}\n${dateStr} ${timeStr}`;
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
    this.setLanguage(next);
  }
}