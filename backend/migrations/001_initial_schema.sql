-- Migration: 001_initial_schema
-- Description: Create initial database schema for SIMS
-- Created: 2025-01-01

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'manager', 'admin')),
  subject_id INTEGER REFERENCES subjects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  serial_number VARCHAR(100) UNIQUE,
  condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'checked_out', 'under_repair', 'retired')),
  location VARCHAR(100),
  photo VARCHAR(255),
  qr_code TEXT,
  requires_approval BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  stock_threshold INTEGER DEFAULT 2,
  documents TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  equipment_id INTEGER REFERENCES equipment(id),
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'early_returned')),
  manager_approved_by INTEGER REFERENCES users(id),
  manager_approved_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  returned_at TIMESTAMP,
  return_condition VARCHAR(20) CHECK (return_condition IN ('excellent', 'good', 'fair', 'poor')),
  reminder_sent TIMESTAMP,
  notes TEXT
);

-- Condition logs table
CREATE TABLE IF NOT EXISTS condition_logs (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER REFERENCES equipment(id),
  user_id INTEGER REFERENCES users(id),
  old_condition VARCHAR(20),
  new_condition VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id),
  subject_id INTEGER,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  learning_objectives TEXT[],
  required_equipment TEXT[],
  lesson_date DATE,
  start_date DATE,
  end_date DATE,
  duration_minutes INTEGER DEFAULT 45,
  grade_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  grade_level VARCHAR(50),
  room VARCHAR(50),
  teacher_name VARCHAR(100),
  equipment_fleets TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_due_date ON requests(due_date);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_dates ON lesson_plans(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);