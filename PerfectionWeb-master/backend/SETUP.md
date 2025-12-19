# Flask Backend Setup Guide

## Prerequisites

- Python 3.8 or higher
- Supabase account and project
- pip (Python package manager)

## Step-by-Step Setup

### 1. Install Python Dependencies

```bash
cd backend

# Windows:
py -m pip install -r requirements.txt
# OR
python3 -m pip install -r requirements.txt
# OR
pip install -r requirements.txt

# Linux/Mac:
python3 -m pip install -r requirements.txt
# OR
pip3 install -r requirements.txt
```

### 2. Set Up Supabase

1. Go to [Supabase](https://supa base.com) and create a new project (or use an existing one)
2. Go to your project's SQL Editor
3. Run the SQL script from `database_schema.sql` to create the `session_records` table
4. Go to Project Settings > API
5. Copy your:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_KEY)

### 3. Configure Environment Variables

1. Create a `.env` file in the `backend` directory:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Linux/Mac
touch .env
```

2. Add the following content to `.env`:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
FLASK_ENV=development
FLASK_DEBUG=True
```

Replace `your-project-id` and `your-anon-key-here` with your actual Supabase credentials.

### 4. Run the Flask Server

**Windows:**
```bash
# Try one of these commands:
py app.py
# OR
python3 app.py
# OR
python app.py
```

**Linux/Mac:**
```bash
python3 app.py
# OR
python app.py
```

**Note:** If `python` doesn't work, try `py` (Windows) or `python3` (Linux/Mac). The server will start on `http://localhost:5000`

### 5. Test the API

You can test the API using multiple methods:

#### Option 1: Web Interface (Easiest) ⭐
1. Open `upload_test.html` in your web browser
2. Fill in the form and upload your Excel file
3. No command line needed!

#### Option 2: Python Test Script
```bash
# Windows:
py test_upload.py
# OR
python3 test_upload.py

# Linux/Mac:
python3 test_upload.py
```

#### Option 3: Using curl (Command Line)
1. **Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Get Groups:**
   ```bash
   curl http://localhost:5000/api/groups
   ```

3. **Get Sessions:**
   ```bash
   curl http://localhost:5000/api/sessions
   ```

4. **Upload Excel File:**
   ```bash
   curl -X POST http://localhost:5000/api/upload-excel \
     -F "file=@path/to/your/file.xlsx" \
     -F "session_number=1" \
     -F "quiz_mark=50" \
     -F "finish_time=2025-01-15 10:00:00" \
     -F "group=cam1" \
     -F "is_general_exam=true"
   ```

#### Option 4: Using Postman
1. Create a new POST request to `http://localhost:5000/api/upload-excel`
2. Go to the "Body" tab
3. Select "form-data"
4. Add the following fields:
   - `file` (type: File) - select your Excel file
   - `session_number` (type: Text) - e.g., "1"
   - `quiz_mark` (type: Text) - e.g., "50"
   - `finish_time` (type: Text) - e.g., "2025-01-15 10:00:00"
   - `group` (type: Text) - e.g., "cam1"
   - `is_general_exam` (type: Text) - "true" or "false"
5. Click "Send"

## Integration with Angular Frontend

To connect your Angular frontend to this backend:

1. Update your Angular environment files to point to the Flask backend:
   ```typescript
   // src/environments/environment.ts
   export const environment = {
     apiUrl: 'http://localhost:5000/api'
   };
   ```

2. Create a service in Angular to call the upload endpoint:
   ```typescript
   uploadExcel(file: File, sessionNumber: number, quizMark: number, 
               finishTime: string, group: string, isGeneralExam: boolean) {
     const formData = new FormData();
     formData.append('file', file);
     formData.append('session_number', sessionNumber.toString());
     formData.append('quiz_mark', quizMark.toString());
     formData.append('finish_time', finishTime);
     formData.append('group', group);
     formData.append('is_general_exam', isGeneralExam.toString());
     
     return this.http.post(`${this.apiUrl}/upload-excel`, formData);
   }
   ```

## Troubleshooting

### Common Issues

1. **"SUPABASE_URL and SUPABASE_KEY must be set"**
   - Make sure your `.env` file exists and contains the correct values
   - Check that the file is in the `backend` directory

2. **"Table 'session_records' does not exist"**
   - Run the SQL script from `database_schema.sql` in your Supabase SQL Editor

3. **CORS errors from Angular**
   - The Flask app has CORS enabled, but make sure the Angular app is calling the correct URL
   - Check browser console for specific CORS error messages

4. **Excel parsing errors**
   - Make sure your Excel file matches the expected format
   - Check that column names are correct (case-insensitive matching is used)
   - Verify the file is not corrupted

### Debug Mode

The Flask app runs in debug mode by default. To disable it, set `FLASK_DEBUG=False` in your `.env` file.

## Production Deployment

For production:

1. Set `FLASK_ENV=production` and `FLASK_DEBUG=False` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
3. Set up proper CORS configuration for your production domain
4. Use environment variables for sensitive data (never commit `.env` file)

