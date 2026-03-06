-- Migration: Add no_quiz flag to session_records table
-- This migration adds a column to control whether quiz section should be shown

-- Add no_quiz column if it doesn't exist
ALTER TABLE session_records
ADD COLUMN IF NOT EXISTS no_quiz BOOLEAN DEFAULT FALSE;

-- Update the view to include the new column
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
    has_exam_grade,
    has_payment,
    has_time,
    no_quiz,
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