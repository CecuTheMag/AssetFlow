import jwt from 'jsonwebtoken';
import pool from './database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, username, email, role, subject_id FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireTeacherOrAdmin = (req, res, next) => {
  if (!['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Teacher or Admin access required' });
  }
  next();
};

export const requireManagerOrAdmin = (req, res, next) => {
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Manager or Admin access required' });
  }
  next();
};

export const requireManagerTeacherOrAdmin = (req, res, next) => {
  if (!['teacher', 'manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Teacher, Manager or Admin access required' });
  }
  next();
};