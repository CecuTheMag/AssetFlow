import pool from '../database.js';

export const createEducationalData = async () => {
  try {
    console.log('🏫 Creating educational sample data...');

    // Clear existing lesson plans
    await pool.query('DELETE FROM lesson_plans');
    console.log('Cleared existing lesson plans');

    // Create sample schools
    const schools = [
      { name: 'Tech Academy High School', district_id: 1, address: 'Sofia, Bulgaria', principal_name: 'Dr. Maria Petrova', contact_email: 'principal@techacademy.bg', phone: '+359 2 123 4567' },
      { name: 'Innovation Middle School', district_id: 1, address: 'Plovdiv, Bulgaria', principal_name: 'Prof. Ivan Georgiev', contact_email: 'principal@innovation.bg', phone: '+359 32 123 456' },
      { name: 'Future Leaders Elementary', district_id: 1, address: 'Varna, Bulgaria', principal_name: 'Ms. Elena Dimitrova', contact_email: 'principal@futureleaders.bg', phone: '+359 52 123 456' }
    ];

    for (const school of schools) {
      await pool.query(
        'INSERT INTO schools (name, district_id, address, principal_name, contact_email, phone) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [school.name, school.district_id, school.address, school.principal_name, school.contact_email, school.phone]
      );
    }

    // Create subjects
    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Mathematical concepts and problem solving', grade_level: '6-12' },
      { name: 'Science', code: 'SCI', description: 'Physics, Chemistry, Biology', grade_level: '6-12' },
      { name: 'Computer Science', code: 'CS', description: 'Programming and digital literacy', grade_level: '8-12' },
      { name: 'English Language', code: 'ENG', description: 'Language arts and literature', grade_level: '6-12' },
      { name: 'History', code: 'HIST', description: 'World and national history', grade_level: '6-12' },
      { name: 'Art', code: 'ART', description: 'Visual and digital arts', grade_level: '6-12' },
      { name: 'Music', code: 'MUS', description: 'Music theory and performance', grade_level: '6-12' },
      { name: 'Physical Education', code: 'PE', description: 'Physical fitness and sports', grade_level: '6-12' }
    ];

    for (const subject of subjects) {
      await pool.query(
        'INSERT INTO subjects (name, code, description, grade_level) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING',
        [subject.name, subject.code, subject.description, subject.grade_level]
      );
    }

    // Update existing equipment with educational metadata
    const educationalEquipment = [
      { type: 'projector', subjects: ['MATH', 'SCI', 'CS', 'ENG', 'HIST'], impact_score: 4.5 },
      { type: 'laptop', subjects: ['CS', 'MATH', 'SCI', 'ENG', 'ART'], impact_score: 4.8 },
      { type: 'tablet', subjects: ['ART', 'CS', 'MATH', 'ENG'], impact_score: 4.2 },
      { type: 'microscope', subjects: ['SCI'], impact_score: 4.9 },
      { type: 'camera', subjects: ['ART', 'CS', 'SCI'], impact_score: 4.1 },
      { type: 'speaker', subjects: ['MUS', 'ENG', 'HIST'], impact_score: 3.8 },
      { type: 'smartboard', subjects: ['MATH', 'SCI', 'CS', 'ENG', 'HIST'], impact_score: 4.7 }
    ];

    for (const eq of educationalEquipment) {
      try {
        await pool.query(
          'UPDATE equipment SET educational_subjects = $1, learning_impact_score = $2 WHERE type ILIKE $3',
          [eq.subjects, eq.impact_score, `%${eq.type}%`]
        );
      } catch (error) {
        console.log(`Could not update equipment type ${eq.type}:`, error.message);
      }
    }



    console.log('✅ Educational sample data created successfully (no lesson plans)');
  } catch (error) {
    console.error('❌ Error creating educational data:', error);
  }
};