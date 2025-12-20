-- Full schema recreate script for PerfectionWeb
-- Drops existing tables (if any) and recreates them with expected schema
-- Run this in Supabase SQL Editor. Test on staging before production.

BEGIN;

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop tables if they exist (order: dependent tables first)
DROP TABLE IF EXISTS session_records CASCADE;
DROP TABLE IF EXISTS lectures CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Create parents table (authentication for parent users)
CREATE TABLE parents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  needs_password_reset BOOLEAN DEFAULT TRUE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_parents_phone_number ON parents(phone_number);

-- Trigger function to update parents.updated_at
CREATE OR REPLACE FUNCTION update_parents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_parents_updated_at ON parents;
CREATE TRIGGER update_parents_updated_at
BEFORE UPDATE ON parents
FOR EACH ROW
EXECUTE FUNCTION update_parents_updated_at();

-- Create admins table (site administrators)
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_admins_updated_at();

-- Create lectures table
CREATE TABLE lectures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unique_key TEXT NOT NULL UNIQUE,
  lecture_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lectures_unique_key ON lectures(unique_key);

-- Create main session_records table with uniqueness constraint
CREATE TABLE session_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT Not Null,
  parent_no TEXT not null,
  session_number INTEGER NOT NULL CHECK (session_number >= 1 AND session_number <= 8),
  group_name TEXT NOT NULL CHECK (group_name IN ('cam1','maimi','cam2','west','station1','station2','station3','online')),
  is_general_exam BOOLEAN DEFAULT FALSE,
  lecture_name TEXT,
  exam_name TEXT,
  quiz_mark FLOAT,
  admin_quiz_mark FLOAT,
  start_time TIMESTAMP WITH TIME ZONE,
  finish_time TIMESTAMP WITH TIME ZONE,
  attendance INTEGER DEFAULT 0 CHECK (attendance IN (0,1)),
  payment FLOAT DEFAULT 0,
  homework_status INTEGER CHECK (homework_status IN (0,1,2,3)),
  pokin FLOAT,
  student_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (student_name, session_number,parent_no)
);

CREATE INDEX IF NOT EXISTS idx_session_records_student_name ON session_records(student_name);
CREATE INDEX IF NOT EXISTS idx_session_records_session_group ON session_records(session_number, group_name, is_general_exam);
CREATE INDEX IF NOT EXISTS idx_session_records_parent_no ON session_records(parent_no);

-- Trigger function to update updated_at for session_records
CREATE OR REPLACE FUNCTION update_session_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_records_updated_at ON session_records;
CREATE TRIGGER update_session_records_updated_at
BEFORE UPDATE ON session_records
FOR EACH ROW
EXECUTE FUNCTION update_session_records_updated_at();

-- Optional: view for easier querying
CREATE OR REPLACE VIEW session_records_view AS
SELECT
  id,
  student_id,
  student_name,
  parent_no,
  session_number,
  group_name,
  is_general_exam,
  lecture_name,
  exam_name,
  quiz_mark,
  admin_quiz_mark,
  start_time,
  finish_time,
  attendance,
  payment,
  homework_status,
  pokin,
  student_no,
  created_at,
  updated_at,
  CASE
    WHEN homework_status IS NULL OR homework_status = 0 THEN 'completed'
    WHEN homework_status = 1 THEN 'no_hw'
    WHEN homework_status = 2 THEN 'not_completed'
    WHEN homework_status = 3 THEN 'cheated'
    ELSE 'unknown'
  END as homework_status_text
FROM session_records;

COMMIT;

-- Notes:
-- 1) Run this script in Supabase SQL editor.
-- 2) It will DROP existing tables and recreate them; backup data first if needed.
-- 3) If gen_random_uuid() is not available, enable pgcrypto extension or replace with uuid_generate_v4().
