import pool from '../database.js';

const assignTeacherToSubject = async () => {
  try {
    // Find a teacher user
    const teacherResult = await pool.query("SELECT id, username FROM users WHERE role = 'teacher' LIMIT 1");
    
    if (teacherResult.rows.length === 0) {
      console.log('No teacher found. Creating a teacher user...');
      
      // Create a teacher user
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('teacher123', 12);
      
      const newTeacher = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username',
        ['teacher1', 'teacher@test.com', hashedPassword, 'teacher']
      );
      
      console.log('Created teacher:', newTeacher.rows[0]);
    }
    
    // Get teacher
    const teacher = teacherResult.rows[0] || (await pool.query("SELECT id, username FROM users WHERE role = 'teacher' LIMIT 1")).rows[0];
    
    // Find a subject (preferably Computer Science)
    const subjectResult = await pool.query("SELECT id, name, code FROM subjects WHERE code = 'CS' LIMIT 1");
    
    if (subjectResult.rows.length === 0) {
      console.log('No Computer Science subject found. Please create subjects first.');
      return;
    }
    
    const subject = subjectResult.rows[0];
    
    // Assign teacher to subject
    await pool.query(
      'UPDATE users SET subject_id = $1 WHERE id = $2',
      [subject.id, teacher.id]
    );
    
    console.log(`✅ Assigned teacher "${teacher.username}" to subject "${subject.name}" (${subject.code})`);
    
    // Also assign some equipment fleets to the subject
    const equipmentFleets = await pool.query(`
      SELECT DISTINCT 
        CASE
          WHEN RIGHT(serial_number, 3) ~ '^[0-9]{3}$'
            THEN LEFT(serial_number, GREATEST(LENGTH(serial_number) - 3, 0))
          ELSE serial_number
        END AS base_serial
      FROM equipment 
      WHERE serial_number IS NOT NULL 
      AND type IN ('laptop', 'projector', 'tablet')
      LIMIT 3
    `);
    
    if (equipmentFleets.rows.length > 0) {
      const fleetSerials = equipmentFleets.rows.map(row => row.base_serial);
      
      await pool.query(
        'UPDATE subjects SET equipment_fleets = $1 WHERE id = $2',
        [fleetSerials, subject.id]
      );
      
      console.log(`✅ Assigned equipment fleets to subject: ${fleetSerials.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error assigning teacher to subject:', error);
  } finally {
    process.exit(0);
  }
};

assignTeacherToSubject();