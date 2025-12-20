-- Migration: Recreate `session_records` with uniqueness key
-- Purpose: Back up existing data, deduplicate, and rebuild table with
-- UNIQUE(student_id, session_number, group_name, is_general_exam).
-- IMPORTANT: Run in Supabase SQL editor or psql connected to your DB.

BEGIN;

-- 1) Create a backup of the original table
DROP TABLE IF EXISTS session_records_backup;
CREATE TABLE session_records_backup AS TABLE public.session_records;

-- 2) Create the new table with the desired schema and unique constraint
DROP TABLE IF EXISTS session_records_new;
CREATE TABLE session_records_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    parent_no TEXT NOT NULL,
    session_number INTEGER NOT NULL CHECK (session_number >= 1 AND session_number <= 8),
    group_name TEXT NOT NULL CHECK (group_name IN ('cam1', 'maimi', 'cam2', 'west', 'station1', 'station2', 'station3', 'online')),
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- The uniqueness key requested
    UNIQUE (student_name, session_number, parent_no)
);

-- 3) Copy distinct rows from the old table into the new table.
-- Keep the most recent row per uniqueness key (by created_at).
INSERT INTO session_records_new (
    student_id, student_name, parent_no, session_number, group_name, is_general_exam,
    lecture_name, exam_name, quiz_mark, admin_quiz_mark, start_time, finish_time,
    attendance, payment, homework_status, pokin, student_no, created_at, updated_at
)
SELECT DISTINCT ON (student_name, session_number, parent_no)
    student_id, student_name, parent_no, session_number, group_name, is_general_exam,
    lecture_name, exam_name, quiz_mark, admin_quiz_mark, start_time, finish_time,
    attendance, payment, homework_status, pokin, student_no, created_at, updated_at
FROM public.session_records
ORDER BY student_name, session_number, parent_no, created_at DESC;

-- 4) Rename tables: drop old and move new into place
DROP TABLE public.session_records;
ALTER TABLE session_records_new RENAME TO session_records;

-- 5) Recreate indexes and trigger for updated_at
CREATE INDEX IF NOT EXISTS idx_session_records_student_id ON session_records(student_id);
CREATE INDEX IF NOT EXISTS idx_session_records_session_group ON session_records(session_number, group_name, is_general_exam);
CREATE INDEX IF NOT EXISTS idx_session_records_parent_no ON session_records(parent_no);

-- Recreate the update_updated_at_column function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_session_records_updated_at ON session_records;
CREATE TRIGGER update_session_records_updated_at 
BEFORE UPDATE ON session_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Notes:
-- 1) This script backs up the original data to `session_records_backup`.
-- 2) The COPY step uses DISTINCT ON to keep the newest row for each uniqueness key.
-- 3) If you want a different conflict resolution (e.g., prefer oldest), adjust ORDER BY.
-- 4) Test on a staging DB before applying to production.
-- 5) If your DB lacks `gen_random_uuid()`, enable the pgcrypto extension or replace with uuid_generate_v4().
