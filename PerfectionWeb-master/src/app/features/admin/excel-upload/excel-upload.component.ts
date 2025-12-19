import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExcelUploadService, UploadResponse } from '../../../core/services/excel-upload.service';

@Component({
  selector: 'app-excel-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excel-upload.component.html',
  styleUrls: ['./excel-upload.component.scss']
})
export class ExcelUploadComponent {
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

  constructor(private excelUploadService: ExcelUploadService) {
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
      // For normal lecture, quiz mark is typically required
      if (this.quizMark === null) {
        this.uploadError.set('Please enter the quiz mark for the lecture');
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

    this.excelUploadService
      .uploadExcel(
        this.selectedFile,
        this.sessionNumber,
        this.quizMark,
        finishTimeValue,
        this.selectedGroup,
        this.isGeneralExam,
        this.lectureNumber,
        this.examName.trim() || undefined
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
}

