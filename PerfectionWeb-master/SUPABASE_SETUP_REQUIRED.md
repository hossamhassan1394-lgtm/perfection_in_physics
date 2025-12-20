# Supabase Database Setup Required

## Issue: "All records failed: 353 errors"

If you're seeing this error when trying to upload Excel files, it means the database tables haven't been created yet in Supabase.

## Solution

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com and log in to your project
   - Open the **SQL Editor** in the sidebar

2. **Run the Migration Script**
   - Copy the entire contents of: `backend/recreate_session_records_with_unique_key.sql`
   - Paste it into the Supabase SQL Editor
   - Click **Run** to execute

   Alternative: You can also run `backend/database_schema.sql` if you prefer a fresh start

3. **Additional Setup** (if needed)
   - Run `backend/parents_schema.sql` - creates the parents table
   - Run `backend/create_lectures_table.sql` - creates the lectures table

4. **Verify Setup**
   - After running the scripts, go to the **Table Editor** in Supabase
   - You should see: `session_records`, `parents`, `lectures`, `admins` tables
   - Each table should be fully populated with columns

5. **Try Uploading Again**
   - Return to the admin dashboard
   - Try uploading an Excel file again
   - All 353 records should now upload successfully

## What These Scripts Do

- **recreate_session_records_with_unique_key.sql**
  - Creates the main `session_records` table with proper schema
  - Adds uniqueness constraint: `(student_id, session_number, group_name, is_general_exam)`
  - Sets up indexes and triggers

- **parents_schema.sql**
  - Creates the `parents` table for parent accounts
  - Stores parent phone numbers and credentials

- **database_schema.sql**
  - Full database schema from scratch
  - Includes all tables: session_records, parents, admins, lectures

## Still Having Issues?

- Check that your `SUPABASE_URL` and `SUPABASE_KEY` are correct in `.env`
- Make sure the backend is running: `python app.py` (you should see "Running on http://0.0.0.0:5000")
- Check the logs: `backend/uploads.log` or visit `/api/upload-log` endpoint

## Environment Setup

Make sure your `.env` file has:
```
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```
