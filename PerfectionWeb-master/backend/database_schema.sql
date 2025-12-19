-- Supabase Database Schema for PerfectionWeb
-- Run this SQL in your Supabase SQL Editor
-- IMPORTANT: Also run parents_schema.sql to create the parents authentication table

-- Create session_records table
CREATE TABLE IF NOT EXISTS session_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT,
    parent_no TEXT,
    session_number INTEGER NOT NULL CHECK (session_number >= 1 AND session_number <= 8),
    group_name TEXT NOT NULL CHECK (group_name IN ('cam1', 'maimi', 'cam2', 'west', 'station1', 'station2', 'station3')),
    is_general_exam BOOLEAN DEFAULT FALSE,
    lecture_name TEXT,
    exam_name TEXT,
    quiz_mark FLOAT,
    admin_quiz_mark FLOAT,
    start_time TIMESTAMP WITH TIME ZONE,
    finish_time TIMESTAMP WITH TIME ZONE,
    attendance INTEGER DEFAULT 0 CHECK (attendance IN (0, 1)),
    payment FLOAT DEFAULT 0,
    homework_status INTEGER CHECK (homework_status IN (0, 1, 2, 3)),
    pokin FLOAT,
    student_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_session_records_student_id ON session_records(student_id);
CREATE INDEX IF NOT EXISTS idx_session_records_session_group ON session_records(session_number, group_name, is_general_exam);
CREATE INDEX IF NOT EXISTS idx_session_records_parent_no ON session_records(parent_no);

-- REMOVED: Unique constraint to allow multiple records per student/session
-- This allows uploading all records without constraint violations

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_session_records_updated_at 
BEFORE UPDATE ON session_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easy querying
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

