import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

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
  homework: {
    completed: number;
    total: number;
  };
}

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
  isGeneralExam?: boolean;
  noQuiz?: boolean;
}

// Mock student data
const MOCK_STUDENTS: Student[] = [
  {
    id: 'M-123',
    name: 'Ahmed Hassan',
    grade: '3rd Secondary (Grade 12)',
    attendance: 85,
    payments: { paid: 420, total: 560 },
    quizzes: { average: 0, total: 0 },
    homework: { completed: 6, total: 8 }
  },
  {
    id: 'M-124',
    name: 'Sara Mohamed',
    grade: '3rd Secondary (Grade 12)',
    attendance: 92,
    payments: { paid: 560, total: 560 },
    quizzes: { average: 0, total: 0 },
    homework: { completed: 8, total: 8 }
  }
];

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor(private http: HttpClient) { }

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

  /**
   * Get sessions for a student
   */
  getSessionsForStudent(studentId: string): Observable<Session[]> {
    // TODO: Replace with actual API call
    // return this.http.get<Session[]>(`/api/parent/sessions?phone_number=${phone}`);
    
    // Mock data for now
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
        homeworkStatus: 'completed',
        isGeneralExam: false,
        noQuiz: false
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
        homeworkStatus: 'pending',
        isGeneralExam: false,
        noQuiz: false
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
        homeworkStatus: 'pending',
        isGeneralExam: false,
        noQuiz: false
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
        homeworkStatus: 'completed',
        isGeneralExam: false,
        noQuiz: false
      },
      {
        id: 5,
        chapter: 1,
        name: 'General Exam - Midterm',
        date: 'December 8, 2025',
        startTime: '4:00 PM',
        endTime: '6:00 PM',
        attendance: 'missed',
        quizCorrect: 0,
        quizTotal: 0,
        payment: 0,
        homeworkStatus: 'pending',
        isGeneralExam: true,
        noQuiz: false
      }
    ];

    return of(mockSessions).pipe(delay(300));
  }
}