# Flask Backend for PerfectionWeb

This Flask backend handles Excel file uploads and updates the Supabase database with student session data.

## Setup

1. **Install dependencies:**
   ```bash
   # Windows:
   py -m pip install -r requirements.txt
   # OR
   python3 -m pip install -r requirements.txt
   
   # Linux/Mac:
   python3 -m pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   Create a `.env` file in the `backend` directory with the following:
   ```
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_key_here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

3. **Set up Supabase database:**
   - Create a table named `session_records` with the schema provided in `database_schema.sql`
   - Or use the Supabase dashboard to create the table

4. **Run the Flask server:**
   ```bash
   # Windows:
   py app.py
   # OR
   python3 app.py
   
   # Linux/Mac:
   python3 app.py
   ```

   The server will run on `http://localhost:5000`

## Testing the API

### Web Interface (Recommended)
Open `upload_test.html` in your browser for an easy-to-use upload interface. No command line needed!

### Other Methods
- Python script: 
  - Windows: `py test_upload.py` or `python3 test_upload.py`
  - Linux/Mac: `python3 test_upload.py`
- Postman: Create a POST request with form-data
- curl: See examples below

## API Endpoints

### POST `/api/upload-excel`
Upload and process an Excel file.

**Form Data:**
- `file`: Excel file (.xlsx or .xls)
- `session_number`: Integer (1-8)
- `quiz_mark`: Float (required for general exam)
- `finish_time`: DateTime string (optional)
- `group`: String (cam1, maimi, cam2, west, station1, station2, station3)
- `is_general_exam`: Boolean (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 16 records",
  "updated_count": 16,
  "total_records": 16
}
```

### GET `/api/groups`
Get list of available groups.

**Response:**
```json
{
  "groups": ["cam1", "maimi", "cam2", "west", "station1", "station2", "station3"]
}
```

### GET `/api/sessions`
Get list of available session numbers.

**Response:**
```json
{
  "sessions": [1, 2, 3, 4, 5, 6, 7, 8]
}
```

### POST `/api/auth/login`
Parent login endpoint.

**Request Body:**
```json
{
  "phone_number": "01234567890",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "phone_number": "01234567890",
    "name": "Parent Name",
    "needs_password_reset": true
  },
  "needs_password_reset": true
}
```

### POST `/api/auth/reset-password`
Reset password for first-time login.

**Request Body:**
```json
{
  "phone_number": "01234567890",
  "new_password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### GET `/api/health`
Health check endpoint.

## Excel File Formats

### General Exam Sheet
Expected columns:
- `id`: Student ID
- `name`: Student name
- `.Parent No`: Parent phone number
- `shamel` (with sub-columns `a` and `p`): Attendance and payment
- `Q`: Quiz mark

### Normal Lecture Sheet
Expected columns:
- `id`: Student ID
- `name`: Student name
- `pokin`: Pokin value
- `student no.`: Student number
- `Parent No.`: Parent phone number
- `a`: Attendance (1 = present)
- `p`: Payment amount
- `Q`: Quiz mark
- `time`: Finish time
- `s1`: Homework status (null/empty = completed, 1 = no hw, 2 = not completed, 3 = cheated)

## Database Schema

The `session_records` table should have the following structure:
- `id`: UUID (primary key, auto-generated)
- `student_id`: TEXT (student ID from Excel)
- `student_name`: TEXT
- `parent_no`: TEXT
- `session_number`: INTEGER
- `group_name`: TEXT
- `is_general_exam`: BOOLEAN
- `quiz_mark`: FLOAT
- `finish_time`: TIMESTAMP
- `attendance`: INTEGER (0 or 1)
- `payment`: FLOAT
- `homework_status`: INTEGER (0 = completed, 1 = no hw, 2 = not completed, 3 = cheated)
- `pokin`: FLOAT
- `student_no`: TEXT
- `updated_at`: TIMESTAMP

