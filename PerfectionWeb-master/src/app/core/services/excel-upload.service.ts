import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  success: boolean;
  message: string;
  updated_count: number;
  total_records: number;
  errors?: string[];
  error_count?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface GroupsResponse {
  groups: string[];
}

export interface SessionsResponse {
  sessions: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ExcelUploadService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Upload Excel file to backend
   */
  uploadExcel(
    file: File,
    sessionNumber: number,
    quizMark: number | null,
    finishTime: string | null,
    group: string,
    isGeneralExam: boolean,
    lectureNumber?: number | null,
    lectureName?: string,
    examName?: string,
    hasExamGrade: boolean = true,
    hasPayment: boolean = true,
    hasTime: boolean = true
  ): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_number', sessionNumber.toString());
    if (quizMark !== null) {
      formData.append('quiz_mark', quizMark.toString());
    }
    if (finishTime) {
      formData.append('finish_time', finishTime);
    }
    formData.append('group', group);
    formData.append('is_general_exam', isGeneralExam.toString());

    // Admin flags
    formData.append('has_exam_grade', hasExamGrade.toString());
    formData.append('has_payment', hasPayment.toString());
    formData.append('has_time', hasTime.toString());

    // Extra metadata (backend can ignore safely if not used)
    if (lectureNumber !== undefined && lectureNumber !== null) {
      formData.append('lecture_number', lectureNumber.toString());
    }
    if (lectureName) {
      formData.append('lecture_name', lectureName);
    }
    if (examName) {
      formData.append('exam_name', examName);
    }

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload-excel`, formData, {
      reportProgress: true,
      responseType: 'json'
    });
  }

  /**
   * Upload Excel file with progress tracking
   */
  uploadExcelWithProgress(
    file: File,
    sessionNumber: number,
    quizMark: number | null,
    finishTime: string | null,
    group: string,
    isGeneralExam: boolean
  ): Observable<UploadProgress | UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_number', sessionNumber.toString());
    if (quizMark !== null) {
      formData.append('quiz_mark', quizMark.toString());
    }
    if (finishTime) {
      formData.append('finish_time', finishTime);
    }
    formData.append('group', group);
    formData.append('is_general_exam', isGeneralExam.toString());

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload-excel`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total || 0,
              percentage: event.total ? Math.round((100 * event.loaded) / event.total) : 0
            };
            return progress;
          case HttpEventType.Response:
            return event.body as UploadResponse;
          default:
            return {} as any;
        }
      })
    );
  }

  /**
   * Get available groups
   */
  getGroups(): Observable<string[]> {
    return this.http.get<GroupsResponse>(`${this.apiUrl}/groups`).pipe(
      map(response => response.groups)
    );
  }

  /**
   * Get available session numbers
   */
  getSessions(): Observable<number[]> {
    return this.http.get<SessionsResponse>(`${this.apiUrl}/sessions`).pipe(
      map(response => response.sessions)
    );
  }

  /**
   * Health check
   */
  healthCheck(): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(`${this.apiUrl}/health`);
  }
}

