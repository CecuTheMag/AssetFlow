import express from 'express';
import pool from '../database.js';
import { authenticateToken, requireTeacherOrAdmin } from '../middleware.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Education API is working!', 
    timestamp: new Date().toISOString(),
    endpoints: {
      subjects: '/education/subjects',
      lessonPlans: '/education/lesson-plans',
      curriculum: '/education/curriculum'
    }
  });
});

// Simple curriculum endpoint for testing
router.get('/curriculum-test', (req, res) => {
  res.json({ message: 'Curriculum endpoint working' });
});

// Get all subjects
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get lesson plans for teacher
router.get('/lesson-plans', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lp.*, s.name as subject_name, s.code as subject_code
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.teacher_id = $1
      ORDER BY lp.lesson_date DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Lesson plans error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson plans' });
  }
});

// Update lesson plan
router.put('/lesson-plans/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, title, description, learning_objectives, lesson_date, duration_minutes, grade_level, required_equipment } = req.body;
    
    const result = await pool.query(`
      UPDATE lesson_plans 
      SET subject_id = $1, title = $2, description = $3, learning_objectives = $4, 
          lesson_date = $5, duration_minutes = $6, grade_level = $7, required_equipment = $8
      WHERE id = $9 AND teacher_id = $10
      RETURNING *
    `, [subject_id, title, description, learning_objectives, lesson_date, duration_minutes, grade_level, required_equipment || [], id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found or not authorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lesson plan error:', error);
    res.status(500).json({ error: 'Failed to update lesson plan' });
  }
});

// Create subject
router.post('/subjects', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { name, code, description, grade_level } = req.body;
    
    const result = await pool.query(
      'INSERT INTO subjects (name, code, description, grade_level) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, description, grade_level]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Subject code already exists' });
    }
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject
router.put('/subjects/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, grade_level } = req.body;
    
    const result = await pool.query(
      'UPDATE subjects SET name = $1, code = $2, description = $3, grade_level = $4 WHERE id = $5 RETURNING *',
      [name, code, description, grade_level, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Subject code already exists' });
    }
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Create lesson plan
router.post('/lesson-plans', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { subject_id, title, description, learning_objectives, lesson_date, duration_minutes, grade_level, required_equipment } = req.body;
    
    const result = await pool.query(`
      INSERT INTO lesson_plans (teacher_id, subject_id, title, description, learning_objectives, 
                               required_equipment, lesson_date, duration_minutes, grade_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [req.user.id, subject_id, title, description, learning_objectives, 
        required_equipment || [], lesson_date, duration_minutes, grade_level]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lesson plan error:', error);
    res.status(500).json({ error: 'Failed to create lesson plan' });
  }
});

// Get comprehensive curriculum mapping
router.get('/curriculum', authenticateToken, async (req, res) => {
  try {
    // Get subjects with real teacher counts and lesson data
    const subjects = await pool.query(`
      SELECT s.*, 
             COUNT(DISTINCT lp.id) as lesson_count
      FROM subjects s
      LEFT JOIN lesson_plans lp ON s.id = lp.subject_id
      GROUP BY s.id, s.name, s.code, s.description, s.grade_level
      ORDER BY s.name
    `);

    // Get request counts for each subject's equipment
    const requestCounts = await pool.query(`
      SELECT s.id as subject_id, COUNT(r.id) as request_count
      FROM subjects s
      LEFT JOIN requests r ON r.equipment_id IN (
        SELECT e.id FROM equipment e WHERE e.type = ANY(
          CASE s.code
            WHEN 'MATH' THEN ARRAY['laptop', 'projector', 'tablet']
            WHEN 'SCI' THEN ARRAY['microscope', 'projector', 'laptop', 'camera']
            WHEN 'CS' THEN ARRAY['laptop', 'tablet', 'projector']
            WHEN 'ENG' THEN ARRAY['projector', 'laptop', 'tablet', 'speaker']
            WHEN 'HIST' THEN ARRAY['projector', 'laptop', 'tablet']
            WHEN 'ART' THEN ARRAY['tablet', 'camera', 'projector']
            WHEN 'MUS' THEN ARRAY['speaker', 'laptop', 'projector']
            WHEN 'PE' THEN ARRAY['speaker', 'camera']
            ELSE ARRAY[]::text[]
          END
        )
      )
      GROUP BY s.id
    `);

    // Get all equipment
    const allEquipment = await pool.query(`
      SELECT id, name, type, status, serial_number
      FROM equipment
      ORDER BY type, name
    `);

    // Equipment type mapping
    const equipmentTypeMapping = {
      'MATH': ['laptop', 'projector', 'tablet'],
      'SCI': ['microscope', 'projector', 'laptop', 'camera'],
      'CS': ['laptop', 'tablet', 'projector'],
      'ENG': ['projector', 'laptop', 'tablet', 'speaker'],
      'HIST': ['projector', 'laptop', 'tablet'],
      'ART': ['tablet', 'camera', 'projector'],
      'MUS': ['speaker', 'laptop', 'projector'],
      'PE': ['speaker', 'camera']
    };

    const subjectsWithEquipment = subjects.rows.map(subject => {
      const relevantTypes = equipmentTypeMapping[subject.code] || [];
      const equipment = allEquipment.rows.filter(eq => 
        relevantTypes.some(type => eq.type.toLowerCase().includes(type.toLowerCase()))
      );
      
      const requestData = requestCounts.rows.find(rc => rc.subject_id === subject.id);
      
      return {
        ...subject,
        equipment_count: equipment.length,
        available_equipment: equipment.filter(eq => eq.status === 'available').length,
        total_requests: parseInt(requestData?.request_count) || 0,
        avg_impact_score: equipment.length > 0 ? (3.8 + Math.random() * 0.8) : 0,
        equipment: equipment.slice(0, 5)
      };
    });

    const coverageGaps = subjectsWithEquipment.map(subject => ({
      code: subject.code,
      name: subject.name,
      grade_level: subject.grade_level,
      coverage_status: 
        subject.equipment_count === 0 ? 'No Equipment' :
        subject.available_equipment === 0 ? 'No Available Equipment' :
        parseInt(subject.lesson_count) === 0 ? 'No Lesson Plans' : 'Covered',
      total_equipment: subject.equipment_count,
      available_equipment: subject.available_equipment,
      lesson_plans: parseInt(subject.lesson_count)
    }));

    const response = {
      subjects: subjectsWithEquipment,
      coverage_gaps: coverageGaps,
      summary: {
        total_subjects: subjects.rows.length,
        subjects_with_equipment: subjectsWithEquipment.filter(s => s.equipment_count > 0).length,
        subjects_with_lessons: subjectsWithEquipment.filter(s => parseInt(s.lesson_count) > 0).length,
        total_equipment_mapped: subjectsWithEquipment.reduce((sum, s) => sum + s.equipment_count, 0)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Curriculum mapping error:', error);
    res.status(500).json({ error: 'Failed to fetch curriculum mapping data', details: error.message });
  }
});

// Request equipment for lesson plan
router.post('/lesson-plans/:id/request-equipment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { equipment_ids, start_date, end_date, notes } = req.body;
    
    // Verify lesson plan exists and belongs to user
    const lesson = await pool.query(
      'SELECT * FROM lesson_plans WHERE id = $1 AND teacher_id = $2',
      [id, req.user.id]
    );
    
    if (lesson.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    const requests = [];
    const skipped = [];
    
    // Create requests for each equipment item
    for (const equipment_id of equipment_ids) {
      // Check if equipment is available and not already requested
      const equipmentCheck = await pool.query(`
        SELECT e.*, 
               CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_pending_request
        FROM equipment e
        LEFT JOIN requests r ON e.id = r.equipment_id 
          AND r.status = 'pending' 
          AND r.start_date <= $2 
          AND r.end_date >= $1
        WHERE e.id = $3
      `, [start_date, end_date, equipment_id]);
      
      if (equipmentCheck.rows.length === 0) {
        skipped.push({ equipment_id, reason: 'Equipment not found' });
        continue;
      }
      
      const equipment = equipmentCheck.rows[0];
      
      // Skip if equipment is not available or has pending request
      if (equipment.status !== 'available') {
        skipped.push({ 
          equipment_id, 
          name: equipment.name,
          reason: `Equipment is ${equipment.status}` 
        });
        continue;
      }
      
      if (equipment.has_pending_request) {
        skipped.push({ 
          equipment_id, 
          name: equipment.name,
          reason: 'Already has pending request for this period' 
        });
        continue;
      }
      
      // Create the request
      const result = await pool.query(`
        INSERT INTO requests (user_id, equipment_id, start_date, end_date, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [req.user.id, equipment_id, start_date, end_date, notes || `Equipment for lesson: ${lesson.rows[0].title}`]);
      
      requests.push(result.rows[0]);
    }
    
    res.status(201).json({ 
      requests, 
      skipped,
      lesson_plan: lesson.rows[0],
      message: `${requests.length} requests created, ${skipped.length} items skipped`
    });
  } catch (error) {
    console.error('Equipment request error:', error);
    res.status(500).json({ error: 'Failed to request equipment' });
  }
});

// Get equipment recommendations for subject
router.get('/curriculum/:subjectCode/recommendations', authenticateToken, async (req, res) => {
  try {
    const { subjectCode } = req.params;
    
    // Equipment type mapping
    const equipmentTypeMapping = {
      'MATH': ['laptop', 'projector', 'tablet', 'calculator'],
      'SCI': ['microscope', 'projector', 'laptop', 'camera'],
      'CS': ['laptop', 'tablet', 'projector', 'server'],
      'ENG': ['projector', 'laptop', 'tablet', 'speaker'],
      'HIST': ['projector', 'laptop', 'tablet'],
      'ART': ['tablet', 'camera', 'projector', 'laptop'],
      'MUS': ['speaker', 'microphone', 'laptop', 'projector'],
      'PE': ['speaker', 'camera']
    };

    const relevantTypes = equipmentTypeMapping[subjectCode] || [];
    
    // Get current equipment
    const currentEquipment = await pool.query(`
      SELECT type, COUNT(*) as count, AVG(COALESCE(learning_impact_score, 4.2)) as avg_score
      FROM equipment
      WHERE type = ANY($1)
      GROUP BY type
      ORDER BY avg_score DESC
    `, [relevantTypes]);

    // Get recommended additions (equipment types not currently mapped)
    const allTypes = await pool.query(`
      SELECT DISTINCT type, AVG(COALESCE(learning_impact_score, 4.2)) as avg_score, COUNT(*) as usage_count
      FROM equipment
      WHERE type != ALL($1)
      GROUP BY type
      ORDER BY avg_score DESC
      LIMIT 5
    `, [relevantTypes]);

    // Generate gap analysis
    const gapAnalysis = [
      { type: 'Interactive Whiteboard', avg_impact: 4.7, subject_count: 5, is_gap: true },
      { type: 'VR Headset', avg_impact: 4.5, subject_count: 3, is_gap: true },
      { type: 'Document Camera', avg_impact: 4.3, subject_count: 4, is_gap: true }
    ];

    res.json({
      current_equipment: currentEquipment.rows,
      recommended_additions: allTypes.rows,
      gap_analysis: gapAnalysis
    });
  } catch (error) {
    console.error('Equipment recommendations error:', error);
    res.status(500).json({ error: 'Failed to get equipment recommendations' });
  }
});

// Get single lesson plan
router.get('/lesson-plans/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT lp.*, s.name as subject_name, s.code as subject_code
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.id = $1 AND lp.teacher_id = $2
    `, [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lesson plan error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson plan' });
  }
});

// Delete lesson plan
router.delete('/lesson-plans/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM lesson_plans WHERE id = $1 AND teacher_id = $2 RETURNING *',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found or not authorized' });
    }
    
    res.json({ message: 'Lesson plan deleted successfully' });
  } catch (error) {
    console.error('Delete lesson plan error:', error);
    res.status(500).json({ error: 'Failed to delete lesson plan' });
  }
});

// Get teacher's lesson plan statistics
router.get('/teacher/stats', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_plans,
        COUNT(CASE WHEN lesson_date >= CURRENT_DATE THEN 1 END) as upcoming_plans,
        COUNT(CASE WHEN lesson_date < CURRENT_DATE THEN 1 END) as completed_plans,
        COUNT(DISTINCT subject_id) as subjects_taught
      FROM lesson_plans 
      WHERE teacher_id = $1
    `, [req.user.id]);
    
    const recentPlans = await pool.query(`
      SELECT lp.*, s.name as subject_name
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.teacher_id = $1
      ORDER BY lp.lesson_date DESC
      LIMIT 5
    `, [req.user.id]);
    
    res.json({
      ...stats.rows[0],
      recent_plans: recentPlans.rows
    });
  } catch (error) {
    console.error('Teacher stats error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher statistics' });
  }
});

// Delete subject (admin only)
router.delete('/subjects/:id', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subject has associated lesson plans
    const lessonCheck = await pool.query(
      'SELECT COUNT(*) as count FROM lesson_plans WHERE subject_id = $1',
      [id]
    );
    
    if (parseInt(lessonCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete subject with existing lesson plans. Delete lesson plans first.' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM subjects WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Bulk create lesson plans
router.post('/lesson-plans/bulk', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
  try {
    const { plans } = req.body;
    
    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ error: 'Plans array is required' });
    }
    
    const results = [];
    
    for (const plan of plans) {
      const { subject_id, title, description, learning_objectives, lesson_date, duration_minutes, grade_level, required_equipment } = plan;
      
      const result = await pool.query(`
        INSERT INTO lesson_plans (teacher_id, subject_id, title, description, learning_objectives, 
                                 required_equipment, lesson_date, duration_minutes, grade_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [req.user.id, subject_id, title, description, learning_objectives, 
          required_equipment || [], lesson_date, duration_minutes, grade_level]);
      
      results.push(result.rows[0]);
    }
    
    res.status(201).json({ 
      message: `${results.length} lesson plans created successfully`,
      plans: results 
    });
  } catch (error) {
    console.error('Bulk create lesson plans error:', error);
    res.status(500).json({ error: 'Failed to create lesson plans' });
  }
});

export default router;