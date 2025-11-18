import pool from '../database.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.subject_id,
        s.name as subject_name,
        s.code as subject_code,
        u.created_at,
        COUNT(r.id) as total_requests,
        COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_requests
      FROM users u
      LEFT JOIN requests r ON u.id = r.user_id
      LEFT JOIN subjects s ON u.subject_id = s.id
      GROUP BY u.id, u.username, u.email, u.role, u.subject_id, s.name, u.created_at
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, subject_id } = req.body;
    
    if (!['student', 'teacher', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1, subject_id = $2 WHERE id = $3 RETURNING id, username, email, role, subject_id',
      [role, subject_id || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has active requests
    const activeRequests = await pool.query(
      'SELECT COUNT(*) FROM requests WHERE user_id = $1 AND status IN ($2, $3)',
      [id, 'pending', 'approved']
    );
    
    if (parseInt(activeRequests.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with active requests' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: `User ${result.rows[0].username} deleted successfully` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'student' } = req.body;
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, hashedPassword, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        r.id,
        e.name as equipment_name,
        r.request_date,
        r.start_date,
        r.end_date,
        r.status,
        r.return_condition,
        r.notes
      FROM requests r
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.user_id = $1
      ORDER BY r.request_date DESC
      LIMIT 50
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};