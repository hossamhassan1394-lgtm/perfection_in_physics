import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import {
  LucideAngularModule,
  ChevronLeft
} from 'lucide-angular';
import { ExcelUploadService, UploadResponse } from '../../../core/services/excel-upload.service';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './excel-upload.component.html',
  styleUrls: ['./excel-upload.component.scss']
})
export class ExcelUploadComponent {
  // Icons
  readonly ChevronLeft = ChevronLeft;

  // Language signal
  lang = signal<'en' | 'ar'>('en');
  // Form data
  selectedFile: File | null = null;
  sessionNumber: number = 1; // lecture or exam session number (1–8)
  quizMark: number | null = null;
  finishTime: string = '';
  selectedGroup: string = 'cam1';
  isGeneralExam: boolean = false;

  // Extra metadata
  // For normal lectures
  lectureNumber: number | null = null;
  lectureName: string = '';
  hasExamGrade: boolean = true;
  hasPayment: boolean = true;
  hasTime: boolean = true;
  // For general exams
  examName: string = '';

  // Available options
  groups = signal<string[]>(['cam1', 'maimi', 'cam2', 'west', 'station1', 'station2', 'station3']);
  sessions = signal<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  // Upload state
  isUploading = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  uploadResult = signal<UploadResponse | null>(null);
  uploadError = signal<string | null>(null);

  constructor(
    private location: Location,
    private excelUploadService: ExcelUploadService
  ) {
    this.loadOptions();
  }

  loadOptions(): void {
    // Load groups and sessions from API
    this.excelUploadService.getGroups().subscribe({
      next: (groups) => this.groups.set(groups),
      error: (err) => console.error('Error loading groups:', err)
    });

    this.excelUploadService.getSessions().subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: (err) => console.error('Error loading sessions:', err)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadError.set(null);
    }
  }

  onSubmit(): void {
    if (!this.selectedFile) {
      this.uploadError.set('Please select a file');
      return;
    }

    // Validation based on type
    if (this.isGeneralExam) {
      if (!this.examName.trim()) {
        this.uploadError.set('Please enter the exam name');
        return;
      }
      // Quiz mark can be optional for exams; remove this check if you want it required
    } else {
      // For normal lecture, lecture name is required
      if (!this.lectureName.trim()) {
        this.uploadError.set('Please enter the lecture name');
        return;
      }
      // If admin enabled exam grade, require quizMark
      if (this.hasExamGrade && (this.quizMark === null || this.quizMark === undefined)) {
        this.uploadError.set('Please enter the quiz/exam mark for the lecture');
        return;
      }
      // If admin enabled finish time, ensure it is provided
      if (this.hasTime && !this.finishTime) {
        this.uploadError.set('Please select the finish time');
        return;
      }
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set(null);
    this.uploadResult.set(null);

    const finishTimeValue = this.finishTime
      ? new Date(this.finishTime).toISOString().slice(0, 19).replace('T', ' ')
      : null;
    // For general exam marks, ensure integer value
    if (this.isGeneralExam && this.quizMark !== null && this.quizMark !== undefined) {
      this.quizMark = Math.trunc(this.quizMark);
    }

    this.excelUploadService
      .uploadExcel(
        this.selectedFile,
        this.sessionNumber,
        this.quizMark,
        finishTimeValue,
        this.selectedGroup,
        this.isGeneralExam,
        this.lectureNumber,
        this.lectureName.trim() || undefined,
        this.examName.trim() || undefined,
        this.hasExamGrade,
        this.hasPayment,
        this.hasTime
      )
      .subscribe({
        next: (response) => {
          this.isUploading.set(false);
          this.uploadProgress.set(100);
          this.uploadResult.set(response);
          if (response.success) {
            // Reset form on success
            this.resetForm();
          }
        },
        error: (error) => {
          this.isUploading.set(false);
          this.uploadError.set(error.error?.error || error.message || 'Upload failed');
          console.error('Upload error:', error);
        }
      });
  }

  resetForm(): void {
    this.selectedFile = null;
    this.sessionNumber = 1;
    this.quizMark = null;
    this.finishTime = '';
    this.selectedGroup = 'cam1';
    this.isGeneralExam = false;
    this.lectureNumber = null;
    this.examName = '';
    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getErrorMessage(): string | null {
    return this.uploadError();
  }

  getSuccessMessage(): string | null {
    const result = this.uploadResult();
    if (result?.success) {
      return result.message;
    }
    return null;
  }

  // Go back to previous page
  goBack(): void {
    this.location.back();
  }

  // Toggle language between English and Arabic
  toggleLanguage(): void {
    const newLang = this.lang() === 'en' ? 'ar' : 'en';
    this.lang.set(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  }
}

