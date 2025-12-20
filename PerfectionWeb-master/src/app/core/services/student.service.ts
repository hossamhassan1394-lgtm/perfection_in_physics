import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Student {
  id: string;
  name: string;
  grade: string;
  attendance: number;
  payments: {
    paid: number;
    total: number;
  };
  quizzes: {
    average: number;
    total: number;
  };
}

// Mock student data
const MOCK_STUDENTS: Student[] = [
  {
    id: 'M-123',
    name: 'Ahmed Hassan',
    grade: '3rd Secondary (Grade 12)',
    attendance: 85,
    payments: { paid: 420, total: 560 },
    quizzes: { average: 88, total: 8 }
  },
  {
    id: 'M-124',
    name: 'Sara Mohamed',
    grade: '3rd Secondary (Grade 12)',
    attendance: 92,
    payments: { paid: 560, total: 560 },
    quizzes: { average: 94, total: 8 }
  }
];

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  constructor(private http: HttpClient, private authService: AuthService) { }

  /**
   * Get students for the logged-in parent from backend API
   */
  getStudentsForParent(): Observable<Student[]> {
    const user = this.authService.getCurrentUser();
    if (!user || !user.identifier) return of([]);

    const params = new HttpParams().set('phone_number', user.identifier);
    return this.http.get<{ students: Student[] }>(`${environment.apiUrl}/parent/students`, { params }).pipe(
      map(resp => {
        const students = resp.students || [];
        // Deduplicate students by `id` where possible; fallback to `name+student_no`.
        const seen = new Map<string, boolean>();
        const unique: Student[] = [];
        for (const s of students) {
          const keyParts: string[] = [];
          if (s.id) keyParts.push(String(s.id));
          if (s.name) keyParts.push(String(s.name).trim());
          if ((s as any).student_no) keyParts.push(String((s as any).student_no).trim());
          const key = keyParts.length ? keyParts.join('||') : JSON.stringify(s);
          if (!seen.has(key)) {
            seen.set(key, true);
            unique.push(s);
          }
        }
        return unique;
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get all students (for admin)
   */
  getAllStudents(): Observable<Student[]> {
    return this.http.get<{ students: Student[] }>(`${environment.apiUrl}/students`).pipe(
      map(resp => resp.students || []),
      catchError(() => of(MOCK_STUDENTS))
    );
  }

  /**
   * Get student by ID
   */
  getStudentById(id: string): Observable<Student | undefined> {
    const user = this.authService.getCurrentUser();
    if (!user || !user.identifier) return of(undefined);

    const params = new HttpParams().set('phone_number', user.identifier);
    return this.http.get<{ students: Student[] }>(`${environment.apiUrl}/parent/students`, { params }).pipe(
      map(resp => (resp.students || []).find(s => s.id === id)),
      catchError(() => of(undefined))
    );
  }

  /**
   * Get sessions for a given student for the logged-in parent
   */
  getSessionsForStudent(studentId: string): Observable<any[]> {
    const user = this.authService.getCurrentUser();
    if (!user || !user.identifier) return of([]);

    const params = new HttpParams().set('phone_number', user.identifier).set('student_id', studentId);
    return this.http.get<{ sessions: any[] }>(`${environment.apiUrl}/parent/sessions`, { params }).pipe(
      map(resp => resp.sessions || []),
      catchError(() => of([]))
    );
  }
}