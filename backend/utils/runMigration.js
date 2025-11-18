import fs from 'fs';
import path from 'path';
import pool from '../database.js';

const runMigration = async (migrationFile) => {
  try {
    const migrationPath = path.join(process.cwd(), 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`Running migration: ${migrationFile}`);
    await pool.query(migrationSQL);
    console.log(`✅ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    throw error;
  }
};

// Run the subject_id migration
runMigration('002_add_subject_id_to_users.sql')
  .then(() => {
    console.log('All migrations completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });