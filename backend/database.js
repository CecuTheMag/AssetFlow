// AssetFlow Database Configuration and Initialization
// Handles PostgreSQL connection, table creation, and sample data setup

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { createDefaultAdmin } from './utils/createAdmin.js';
import { createSampleData } from './utils/createSampleData.js';
import migrationRunner from './utils/migrationRunner.js';

// Load environment variables
dotenv.config();

/**
 * PostgreSQL Connection Pool Configuration
 * Optimized for high-performance concurrent connections
 */
const pool = new Pool({
  host: process.env.DB_HOST,           // Database server hostname
  port: process.env.DB_PORT,           // Database server port (default: 5432)
  user: process.env.DB_USER,           // Database username
  password: process.env.DB_PASSWORD,   // Database password
  database: process.env.DB_NAME,       // Database name
  
  // Connection pool optimization for enterprise scaling
  max: 20,                    // Maximum number of concurrent connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout for new connections (2 seconds)
  maxUses: 7500,              // Close and recreate connection after 7500 uses
});

/**
 * Database Initialization Function
 * Creates all required tables, indexes, and constraints
 * Sets up sample data and default admin account
 */
export const initDB = async () => {
  try {
    // ===== SCHOOLS TABLE =====
    // Multi-school district support
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        district_id INTEGER,
        address TEXT,
        principal_name VARCHAR(100),
        contact_email VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ===== SUBJECTS TABLE =====
    // Educational subjects for curriculum integration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE,
        description TEXT,
        grade_level VARCHAR(20),
        room VARCHAR(50),
        teacher_name VARCHAR(100),
        equipment_fleets TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist
    await pool.query(`
      ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS room VARCHAR(50),
      ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS equipment_fleets TEXT[]
    `);

    // ===== USERS TABLE =====
    // Enhanced user accounts with school association
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,                    -- Auto-incrementing user ID
        username VARCHAR(50) UNIQUE NOT NULL,     -- Unique username for login
        email VARCHAR(100) UNIQUE NOT NULL,       -- Unique email address
        password VARCHAR(255) NOT NULL,           -- Hashed password (bcrypt)
        role VARCHAR(20) DEFAULT 'student'        -- User role for permissions
          CHECK (role IN ('student', 'teacher', 'manager', 'admin', 'district_admin')),
        school_id INTEGER REFERENCES schools(id), -- School association
        grade_level VARCHAR(20),                  -- Student grade or teacher specialization
        subject_specialization VARCHAR(100),      -- Teacher subject area
        responsibility_score INTEGER DEFAULT 100, -- Student equipment responsibility score
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Account creation date
      )
    `);

    // ===== LESSON PLANS TABLE =====
    // Teacher lesson planning integration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_plans (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER REFERENCES users(id),
        subject_id INTEGER REFERENCES subjects(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        learning_objectives TEXT[],
        required_equipment TEXT[],
        suggested_equipment TEXT[],
        lesson_date DATE,
        start_date DATE,
        end_date DATE,
        duration_minutes INTEGER,
        grade_level VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist
    await pool.query(`
      ALTER TABLE lesson_plans 
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS end_date DATE
    `);

    // ===== EQUIPMENT TABLE =====
    // Enhanced equipment with educational metadata
    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,                    -- Auto-incrementing equipment ID
        name VARCHAR(100) NOT NULL,               -- Equipment name/title
        type VARCHAR(50) NOT NULL,                -- Category (projector, laptop, etc.)
        serial_number VARCHAR(100) UNIQUE,        -- Unique identifier for tracking
        condition VARCHAR(20) DEFAULT 'good'      -- Physical condition assessment
          CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
        status VARCHAR(20) DEFAULT 'available'    -- Availability status
          CHECK (status IN ('available', 'checked_out', 'under_repair', 'retired')),
        location VARCHAR(100),                    -- Physical storage location
        photo VARCHAR(255),                       -- Image URL for identification
        qr_code TEXT,                            -- QR code for mobile scanning
        requires_approval BOOLEAN DEFAULT false,  -- Admin approval required flag
        quantity INTEGER DEFAULT 1,              -- Stock quantity available
        stock_threshold INTEGER DEFAULT 2,       -- Low stock alert threshold
        documents TEXT[],                        -- Associated document filenames
        description TEXT,                        -- Equipment description
        school_id INTEGER REFERENCES schools(id), -- School ownership
        educational_subjects TEXT[],             -- Subjects this equipment supports
        learning_impact_score DECIMAL(3,2) DEFAULT 0, -- AI-calculated learning impact
        usage_analytics JSONB,                  -- Usage patterns and analytics
        maintenance_schedule JSONB,             -- Predictive maintenance data
        shareable_district BOOLEAN DEFAULT false, -- Can be shared across district
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Record creation date
      )
    `);

    // ===== EQUIPMENT USAGE ANALYTICS TABLE =====
    // Track equipment usage for learning analytics
    await pool.query(`
      CREATE TABLE IF NOT EXISTS equipment_usage_analytics (
        id SERIAL PRIMARY KEY,
        equipment_id INTEGER REFERENCES equipment(id),
        user_id INTEGER REFERENCES users(id),
        lesson_plan_id INTEGER REFERENCES lesson_plans(id),
        subject_id INTEGER REFERENCES subjects(id),
        usage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_minutes INTEGER,
        learning_outcome_rating INTEGER CHECK (learning_outcome_rating BETWEEN 1 AND 5),
        student_engagement_score INTEGER CHECK (student_engagement_score BETWEEN 1 AND 10),
        technical_issues_reported TEXT[],
        usage_effectiveness DECIMAL(3,2)
      )
    `);

    // ===== DISTRICT SHARING TABLE =====
    // Track inter-school equipment sharing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS district_sharing (
        id SERIAL PRIMARY KEY,
        equipment_id INTEGER REFERENCES equipment(id),
        owner_school_id INTEGER REFERENCES schools(id),
        borrower_school_id INTEGER REFERENCES schools(id),
        requested_by INTEGER REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'approved', 'in_transit', 'delivered', 'returned', 'rejected')),
        transport_method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns if they don't exist
    await pool.query(`
      ALTER TABLE equipment 
      ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS stock_threshold INTEGER DEFAULT 2,
      ADD COLUMN IF NOT EXISTS documents TEXT[],
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id),
      ADD COLUMN IF NOT EXISTS educational_subjects TEXT[],
      ADD COLUMN IF NOT EXISTS learning_impact_score DECIMAL(3,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS usage_analytics JSONB,
      ADD COLUMN IF NOT EXISTS maintenance_schedule JSONB,
      ADD COLUMN IF NOT EXISTS shareable_district BOOLEAN DEFAULT false
    `);

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id),
      ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20),
      ADD COLUMN IF NOT EXISTS subject_specialization VARCHAR(100),
      ADD COLUMN IF NOT EXISTS responsibility_score INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id)
    `);

    // Update qr_code column to TEXT
    await pool.query(`
      ALTER TABLE equipment 
      ALTER COLUMN qr_code TYPE TEXT
    `).catch(() => {});

    // ===== REQUESTS TABLE =====
    // Tracks equipment borrowing requests and approval workflow
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,                    -- Auto-incrementing request ID
        user_id INTEGER REFERENCES users(id),     -- Requesting user
        equipment_id INTEGER REFERENCES equipment(id), -- Requested equipment
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When request was made
        start_date TIMESTAMP NOT NULL,            -- Requested start date
        end_date TIMESTAMP NOT NULL,              -- Requested end date
        due_date TIMESTAMP,                       -- Actual due date (after approval)
        status VARCHAR(20) DEFAULT 'pending'      -- Request workflow status
          CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'early_returned')),
        manager_approved_by INTEGER REFERENCES users(id), -- Manager who approved
        manager_approved_at TIMESTAMP,            -- Manager approval timestamp
        approved_by INTEGER REFERENCES users(id), -- Final approver
        approved_at TIMESTAMP,                    -- Final approval timestamp
        returned_at TIMESTAMP,                    -- Equipment return timestamp
        return_condition VARCHAR(20)              -- Condition upon return
          CHECK (return_condition IN ('excellent', 'good', 'fair', 'poor')),
        notes TEXT                               -- Additional notes/comments
      )
    `);

    // Add due_date and reminder_sent columns if they don't exist
    await pool.query(`
      ALTER TABLE requests 
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reminder_sent TIMESTAMP,
      ADD COLUMN IF NOT EXISTS manager_approved_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP
    `);

    // Update status constraint to include early_returned
    try {
      await pool.query(`
        ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check
      `);
      await pool.query(`
        ALTER TABLE requests ADD CONSTRAINT requests_status_check 
        CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'early_returned'))
      `);
    } catch (constraintError) {
      console.log('Status constraint update:', constraintError.message);
    }

    // Update role constraint to include new roles
    try {
      // Drop any existing role constraints
      await pool.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
      `);
      await pool.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check1
      `);
      
      // Add the new constraint
      await pool.query(`
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('student', 'teacher', 'manager', 'admin'))
      `);
      
      console.log('Role constraint updated successfully');
    } catch (constraintError) {
      console.log('Role constraint update:', constraintError.message);
    }

    // ===== CONDITION LOGS TABLE =====
    // Audit trail for equipment condition changes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS condition_logs (
        id SERIAL PRIMARY KEY,                    -- Auto-incrementing log ID
        equipment_id INTEGER REFERENCES equipment(id), -- Equipment being logged
        user_id INTEGER REFERENCES users(id),     -- User making the change
        old_condition VARCHAR(20),                -- Previous condition
        new_condition VARCHAR(20),                -- New condition
        notes TEXT,                              -- Reason for condition change
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Log entry timestamp
      )
    `);



    // ===== PERFORMANCE INDEXES =====
    // Optimize database queries for high-traffic operations
    await pool.query('CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id)');         // User's request history
    await pool.query('CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id)'); // Equipment usage tracking
    await pool.query('CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)');           // Filter by request status
    await pool.query('CREATE INDEX IF NOT EXISTS idx_requests_due_date ON requests(due_date)');       // Overdue equipment alerts
    await pool.query('CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status)');         // Available equipment queries
    await pool.query('CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type)');             // Equipment category filtering
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');                    // Role-based access control
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');                  // Login authentication
    await pool.query('CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON lesson_plans(teacher_id)'); // Teacher's lesson plans
    await pool.query('CREATE INDEX IF NOT EXISTS idx_lesson_plans_dates ON lesson_plans(start_date, end_date)'); // Date range queries

    
    console.log('Database tables and indexes initialized successfully');
    
    // Run migrations
    await migrationRunner.runMigrations();
    
    // create default admin account
    await createDefaultAdmin();
    
    // create sample data
    await createSampleData();
    
    // create educational data
    const { createEducationalData } = await import('./utils/createEducationalData.js');
    await createEducationalData();
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export default pool;