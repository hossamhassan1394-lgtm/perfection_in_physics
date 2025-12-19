# Angular Integration Guide

This guide shows you how to integrate the Flask backend with your Angular frontend.

## ✅ What's Already Set Up

1. **Excel Upload Service** - `src/app/core/services/excel-upload.service.ts`
2. **Environment Configuration** - API URL configured in `environment.ts`
3. **HttpClient** - Added to `app.config.ts`
4. **Excel Upload Component** - Ready to use component

## 📋 Step-by-Step Integration

### 1. Install Dependencies (if needed)

Your Angular project should already have `@angular/common/http`. If not:

```bash
npm install @angular/common
```

### 2. Add Excel Upload to Admin Dashboard

#### Option A: Add as a Route

Update `app.routes.ts`:

```typescript
import { ExcelUploadComponent } from './features/admin/excel-upload/excel-upload.component';

export const routes: Routes = [
  // ... existing routes
  {
    path: 'admin/upload',
    component: ExcelUploadComponent,
    canActivate: [/* your admin guard */]
  }
];
```

#### Option B: Add to Admin Dashboard Component

Update `admin-dashboard.component.ts`:

```typescript
import { ExcelUploadComponent } from '../excel-upload/excel-upload.component';

@Component({
  // ... existing config
  imports: [
    // ... existing imports
    ExcelUploadComponent
  ]
})
```

Then in `admin-dashboard.component.html`:

```html
<app-excel-upload></app-excel-upload>
```

### 3. Update Environment Files

The environment files are already configured, but verify:

**`src/environments/environment.ts`** (Development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

**`src/environments/environment.prod.ts`** (Production):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api-url.com/api'
};
```

### 4. Start Both Servers

**Terminal 1 - Flask Backend:**
```bash
cd backend
py app.py  # or python3 app.py
```

**Terminal 2 - Angular Frontend:**
```bash
npm start  # or ng serve
```

### 5. Test the Integration

1. Navigate to your admin dashboard
2. Go to the Excel upload section
3. Select an Excel file
4. Fill in the form:
   - Session number (1-8)
   - Quiz mark (required for general exam)
   - Finish time (optional)
   - Group (cam1, maimi, cam2, etc.)
   - Check "General Exam" if it's a general exam
5. Click "Upload Excel File"

## 🔧 Using the Service Directly

If you want to use the service in your own component:

```typescript
import { ExcelUploadService } from '../../../core/services/excel-upload.service';

constructor(private excelUploadService: ExcelUploadService) {}

uploadFile() {
  const file = /* your file */;
  this.excelUploadService.uploadExcel(
    file,
    1,              // session number
    50,             // quiz mark
    null,           // finish time
    'cam1',         // group
    false           // is general exam
  ).subscribe({
    next: (response) => {
      console.log('Success:', response);
    },
    error: (error) => {
      console.error('Error:', error);
    }
  });
}
```

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors, make sure:
1. Flask backend is running on `http://localhost:5000`
2. Flask CORS is enabled (already done in `app.py`)
3. Angular is calling the correct API URL

### Connection Refused

If you get "Connection refused":
1. Check that Flask backend is running
2. Verify the API URL in `environment.ts`
3. Check firewall settings

### File Upload Fails

1. Check browser console for errors
2. Verify file format (.xlsx or .xls)
3. Check Flask backend logs
4. Ensure Supabase credentials are set in `.env`

## 📝 Example: Complete Integration

Here's a complete example of using the upload in a component:

```typescript
import { Component } from '@angular/core';
import { ExcelUploadService } from '../../../core/services/excel-upload.service';

@Component({
  selector: 'app-my-upload',
  template: `
    <input type="file" (change)="onFileSelected($event)" accept=".xlsx,.xls">
    <button (click)="upload()" [disabled]="!file">Upload</button>
    <div *ngIf="result">{{ result.message }}</div>
  `
})
export class MyUploadComponent {
  file: File | null = null;
  result: any = null;

  constructor(private uploadService: ExcelUploadService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.file = input.files[0];
    }
  }

  upload() {
    if (!this.file) return;

    this.uploadService.uploadExcel(
      this.file,
      1,      // session
      50,     // quiz mark
      null,   // finish time
      'cam1', // group
      false   // normal lecture
    ).subscribe({
      next: (res) => this.result = res,
      error: (err) => console.error(err)
    });
  }
}
```

## 🚀 Next Steps

1. Add the Excel upload component to your admin dashboard
2. Test with sample Excel files
3. Customize the UI to match your design
4. Add error handling and user feedback
5. Deploy both backend and frontend

Your integration is ready! 🎉

