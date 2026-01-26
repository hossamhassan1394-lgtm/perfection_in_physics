import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Users,
  TrendingUp,
  DollarSign,
  Award
} from 'lucide-angular';
import { TopNavComponent } from '../../../shared/components/top-nav/top-nav.component';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService, Student } from '../../../core/services/student.service';



@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    TopNavComponent
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

  // Component state
  allStudents = signal<Student[]>([]);

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
    private authService: AuthService,
    private studentService: StudentService
  ) {}

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
}