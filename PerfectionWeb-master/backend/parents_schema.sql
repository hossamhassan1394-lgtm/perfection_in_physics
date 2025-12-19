-- Parents Authentication Table for PerfectionWeb
-- Run this SQL in your Supabase SQL Editor

-- Create parents table for authentication
CREATE TABLE IF NOT EXISTS parents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    needs_password_reset BOOLEAN DEFAULT TRUE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create index for faster phone number lookups
CREATE INDEX IF NOT EXISTS idx_parents_phone_number ON parents(phone_number);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_parents_updated_at 
BEFORE UPDATE ON parents
FOR EACH ROW
EXECUTE FUNCTION update_parents_updated_at();

-- Function to hash password (simple MD5 for demo - use bcrypt in production)
-- For now, we'll store plain text "123456" and hash it in the application
-- In production, use proper password hashing like bcrypt

