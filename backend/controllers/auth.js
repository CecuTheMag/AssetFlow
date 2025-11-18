import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import pool from '../database.js';

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, email, password } = value;
    const role = 'student'; // Force student role for public registration
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );

    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    res.status(201).json({
      message: 'Student account created successfully',
      user: result.rows[0],
      token
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = value;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role, subject_id: user.subject_id },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

export const testDB = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
    const adminCount = result.rows[0].count;
    
    const allUsers = await pool.query('SELECT id, username, email, role FROM users LIMIT 5');
    
    res.json({ 
      message: 'Database connection working',
      adminCount: parseInt(adminCount),
      sampleUsers: allUsers.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
};