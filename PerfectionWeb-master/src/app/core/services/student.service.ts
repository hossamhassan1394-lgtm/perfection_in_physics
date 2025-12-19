import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  
  /**
   * Get students for the logged-in parent
   */
  getStudentsForParent(): Observable<Student[]> {
    // For demo purposes, return first 2 students
    const students = MOCK_STUDENTS.slice(0, 2);
    return of(students).pipe(delay(300));
  }

  /**
   * Get all students (for admin)
   */
  getAllStudents(): Observable<Student[]> {
    return of(MOCK_STUDENTS).pipe(delay(300));
  }

  /**
   * Get student by ID
   */
  getStudentById(id: string): Observable<Student | undefined> {
    const student = MOCK_STUDENTS.find(s => s.id === id);
    return of(student).pipe(delay(200));
  }
}