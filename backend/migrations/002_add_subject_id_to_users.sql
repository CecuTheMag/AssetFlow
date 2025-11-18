-- Migration: 002_add_subject_id_to_users
-- Description: Add subject_id column to users table for teacher subject assignment
-- Created: 2025-01-01

-- Add subject_id column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subject_id') THEN
        ALTER TABLE users ADD COLUMN subject_id INTEGER REFERENCES subjects(id);
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_subject_id ON users(subject_id);