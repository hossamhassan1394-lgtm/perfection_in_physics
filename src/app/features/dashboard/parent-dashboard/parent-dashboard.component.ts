import { Component, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  date: string;
  startTime: string;
  endTime: string;
  attendance: 'attended' | 'upcoming' | 'missed';
  quizCorrect: number;
  quizTotal: number;
  payment: number;
  homeworkStatus: 'completed' | 'pending';
}

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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

  // View references
  @ViewChild('sessionCarousel') sessionCarousel!: ElementRef<HTMLDivElement>;

  // Component state
  students = signal<Student[]>([]);
  selectedStudent = signal<Student | null>(null);
  sessions = signal<Session[]>([]);

  constructor(
    private router: Router,
    private authService: AuthService,
    private studentService: StudentService
  ) {}

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
          this.selectedStudent.set(students[0]);
         // this.loadSessions(students[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  loadSessions(studentId: number): void {
    // Mock session data - replace with actual service call
    const mockSessions: Session[] = [
      {
        id: 2,
        chapter: 3,
        name: 'Magnetic Fields & Forces',
        date: 'December 16, 2025',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        attendance: 'attended',
        quizCorrect: 14,
        quizTotal: 15,
        payment: 140,
        homeworkStatus: 'completed'
      },
      {
        id: 3,
        chapter: 4,
        name: 'Electromagnetic Induction',
        date: 'December 20, 2025',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        attendance: 'upcoming',
        quizCorrect: 0,
        quizTotal: 15,
        payment: 140,
        homeworkStatus: 'pending'
      },
      {
        id: 4,
        chapter: 5,
        name: 'Wave Properties',
        date: 'December 23, 2025',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        attendance: 'upcoming',
        quizCorrect: 0,
        quizTotal: 15,
        payment: 140,
        homeworkStatus: 'pending'
      },
      {
        id: 1,
        chapter: 2,
        name: 'Electricity & Current Flow',
        date: 'December 15, 2025',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        attendance: 'attended',
        quizCorrect: 12,
        quizTotal: 15,
        payment: 140,
        homeworkStatus: 'completed'
      },
      {
        id: 5,
        chapter: 1,
        name: 'Electric Fields & Potential',
        date: 'December 8, 2025',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        attendance: 'missed',
        quizCorrect: 0,
        quizTotal: 0,
        payment: 0,
        homeworkStatus: 'pending'
      }
    ];
    
    this.sessions.set(mockSessions);
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
    return Math.round((paid / total) * 100);
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
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}