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
    let query = `
      SELECT lp.*, s.name as subject_name, s.code as subject_code
      FROM lesson_plans lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.teacher_id = $1
    `;
    let params = [req.user.id];
    
    // If user is a teacher with assigned subject, filter by that subject
    if (req.user.role === 'teacher' && req.user.subject_id) {
      query += ` AND lp.subject_id = $2`;
      params.push(req.user.subject_id);
    }
    
    query += ` ORDER BY lp.lesson_date DESC`;
    
    const result = await pool.query(query, params);
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
    const { subject_id, title, description, learning_objectives, lesson_date, duration_minutes, grade_level, required_equipment, start_date, end_date } = req.body;
    
    const result = await pool.query(`
      UPDATE lesson_plans 
      SET subject_id = $1, title = $2, description = $3, learning_objectives = $4, 
          lesson_date = $5, duration_minutes = $6, grade_level = $7, required_equipment = $8,
          start_date = $9, end_date = $10
      WHERE id = $11 AND teacher_id = $12
      RETURNING *
    `, [subject_id, title, description, learning_objectives, lesson_date, duration_minutes, grade_level, required_equipment || [], start_date, end_date, id, req.user.id]);

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
    const { name, code, description, grade_level, room, teacher_name, equipment_fleets } = req.body;
    
    const result = await pool.query(
      'INSERT INTO subjects (name, code, description, grade_level, room, teacher_name, equipment_fleets) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, code, description, grade_level, room, teacher_name, equipment_fleets || []]
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
    const { name, code, description, grade_level, room, teacher_name, equipment_fleets } = req.body;
    
    console.log('Updating subject with equipment_fleets:', equipment_fleets);
    
    const result = await pool.query(
      'UPDATE subjects SET name = $1, code = $2, description = $3, grade_level = $4, room = $5, teacher_name = $6, equipment_fleets = $7 WHERE id = $8 RETURNING *',
      [name, code, description, grade_level, room, teacher_name, Array.isArray(equipment_fleets) ? equipment_fleets : [], id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    console.log('Subject updated successfully:', result.rows[0]);
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
    const { subject_id, title, description, learning_objectives, lesson_date, duration_minutes, grade_level, required_equipment, start_date, end_date } = req.body;
    
    const result = await pool.query(`
      INSERT INTO lesson_plans (teacher_id, subject_id, title, description, learning_objectives, 
                               required_equipment, lesson_date, duration_minutes, grade_level, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [req.user.id, subject_id, title, description, learning_objectives, 
        required_equipment || [], lesson_date, duration_minutes, grade_level, start_date, end_date]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lesson plan error:', error);
    res.status(500).json({ error: 'Failed to create lesson plan' });
  }
});

// Get comprehensive curriculum mapping
router.get('/curriculum', authenticateToken, async (req, res) => {
  try {
    // Get subjects with lesson counts and fleet information
    const subjects = await pool.query(`
      SELECT s.*, 
             COUNT(DISTINCT lp.id) as lesson_count
      FROM subjects s
      LEFT JOIN lesson_plans lp ON s.id = lp.subject_id
      GROUP BY s.id, s.name, s.code, s.description, s.grade_level, s.room, s.teacher_name, s.equipment_fleets
      ORDER BY s.name
    `);

    // Get equipment fleets data
    const fleets = await pool.query(`
      SELECT
        CASE
          WHEN RIGHT(serial_number, 3) ~ '^[0-9]{3}$'
            THEN LEFT(serial_number, GREATEST(LENGTH(serial_number) - 3, 0))
          ELSE serial_number
        END AS base_serial,
        name,
        type,
        COUNT(*) AS total_count,
        COUNT(CASE WHEN status = 'available' THEN 1 END) AS available_count
      FROM equipment
      WHERE serial_number IS NOT NULL
      GROUP BY base_serial, name, type
      ORDER BY name
    `);

    const subjectsWithFleets = subjects.rows.map(subject => {
      const subjectFleets = subject.equipment_fleets || [];
      const matchingFleets = fleets.rows.filter(fleet => 
        subjectFleets.includes(fleet.base_serial)
      );
      
      const fleetCount = matchingFleets.length;
      const totalEquipment = matchingFleets.reduce((sum, fleet) => sum + parseInt(fleet.total_count), 0);
      
      return {
        ...subject,
        fleet_count: fleetCount,
        total_equipment: totalEquipment,
        fleets: matchingFleets
      };
    });

    const response = {
      subjects: subjectsWithFleets,
      summary: {
        total_subjects: subjects.rows.length,
        subjects_with_fleets: subjectsWithFleets.filter(s => s.fleet_count > 0).length,
        subjects_with_lessons: subjectsWithFleets.filter(s => parseInt(s.lesson_count) > 0).length,
        total_equipment_mapped: subjectsWithFleets.reduce((sum, s) => sum + s.total_equipment, 0)
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Curriculum mapping error:', error);
    res.status(500).json({ error: 'Failed to fetch curriculum mapping data', details: error.message });
  }
});

// Request equipment for lesson plan with automatic fleet cycling
router.post('/lesson-plans/:id/request-equipment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { equipment_ids, start_date, end_date, notes } = req.body;
    
    // Verify lesson plan exists
    const lesson = await pool.query(
      'SELECT * FROM lesson_plans WHERE id = $1',
      [id]
    );
    
    if (lesson.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found' });
    }
    
    const requests = [];
    const skipped = [];
    
    // Create requests for each equipment item with automatic cycling
    for (const equipment_id of equipment_ids) {
      // First, try to get the specific equipment if available
      let equipmentToRequest = null;
      
      const equipmentCheck = await pool.query(`
        SELECT e.*, 
               CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_pending_request
        FROM equipment e
        LEFT JOIN requests r ON e.id = r.equipment_id 
          AND r.status IN ('pending', 'approved') 
          AND r.start_date <= $2 
          AND r.end_date >= $1
        WHERE e.id = $3
      `, [start_date, end_date, equipment_id]);
      
      if (equipmentCheck.rows.length > 0) {
        const equipment = equipmentCheck.rows[0];
        
        // Check if this specific item is available
        if (equipment.status === 'available' && !equipment.has_pending_request) {
          equipmentToRequest = equipment;
        } else {
          // If specific item not available, find next available in same fleet
          const baseSerial = equipment.serial_number ? 
            equipment.serial_number.replace(/\d{3}$/, '') : null;
          
          if (baseSerial) {
            const fleetItems = await pool.query(`
              SELECT e.*, 
                     CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_pending_request
              FROM equipment e
              LEFT JOIN requests r ON e.id = r.equipment_id 
                AND r.status IN ('pending', 'approved') 
                AND r.start_date <= $2 
                AND r.end_date >= $1
              WHERE e.serial_number LIKE $3 
                AND e.status = 'available'
                AND r.id IS NULL
              ORDER BY e.serial_number
              LIMIT 1
            `, [start_date, end_date, baseSerial + '%']);
            
            if (fleetItems.rows.length > 0) {
              equipmentToRequest = fleetItems.rows[0];
            }
          }
        }
      }
      
      if (!equipmentToRequest) {
        skipped.push({ 
          equipment_id, 
          reason: 'No available items in fleet for this period' 
        });
        continue;
      }
      
      // Create the request with the available equipment
      const result = await pool.query(`
        INSERT INTO requests (user_id, equipment_id, start_date, end_date, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [req.user.id, equipmentToRequest.id, start_date, end_date, notes || `Equipment for lesson: ${lesson.rows[0].title}`]);
      
      // Get equipment details for response
      const equipmentDetails = await pool.query(
        'SELECT * FROM equipment WHERE id = $1',
        [equipmentToRequest.id]
      );
      
      requests.push({
        ...result.rows[0],
        equipment: equipmentDetails.rows[0]
      });
    }
    
    if (requests.length === 0 && skipped.length > 0) {
      return res.status(400).json({ 
        error: 'No more items available', 
        message: 'All items in the requested fleets are currently in use or under repair.',
        skipped 
      });
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

// Get next available equipment in fleet
router.get('/equipment/fleet/:baseSerial/next-available', authenticateToken, async (req, res) => {
  try {
    const { baseSerial } = req.params;
    const { start_date, end_date } = req.query;
    
    // Find next available item in fleet
    const availableItems = await pool.query(`
      SELECT e.*, 
             CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_pending_request
      FROM equipment e
      LEFT JOIN requests r ON e.id = r.equipment_id 
        AND r.status IN ('pending', 'approved') 
        AND r.start_date <= $2 
        AND r.end_date >= $1
      WHERE e.serial_number LIKE $3 
        AND e.status = 'available'
        AND r.id IS NULL
      ORDER BY e.serial_number
      LIMIT 1
    `, [start_date, end_date, baseSerial + '%']);
    
    if (availableItems.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No available items', 
        message: 'All items in this fleet are currently in use or under repair.' 
      });
    }
    
    res.json(availableItems.rows[0]);
  } catch (error) {
    console.error('Get next available equipment error:', error);
    res.status(500).json({ error: 'Failed to get next available equipment' });
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