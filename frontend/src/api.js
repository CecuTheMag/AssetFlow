// API Configuration - Centralized HTTP client for backend communication
// Handles authentication, request/response interceptors, and environment-specific routing

import axios from 'axios';

/**
 * Dynamic API URL configuration based on deployment environment
 * Production: Routes through nginx proxy at /api
 * Development: Direct connection to backend server on port 5000
 * 🔥 HOT RELOAD TEST - You should see this change instantly!
 */
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `${window.location.origin}/api`        // Production: nginx proxy routing
  : `http://${window.location.hostname}:5000`; // Development: direct backend connection

/**
 * Create axios instance with centralized configuration
 * All API calls use this instance for consistent behavior
 */
const api = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Request interceptor - automatically adds JWT authentication to all requests
 * Retrieves token from localStorage and adds to Authorization header
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // JWT Bearer token format
  }
  return config;
});

/**
 * Authentication API endpoints
 * Handles user login, registration, and logout operations
 */
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),    // User authentication
  register: (userData) => api.post('/auth/register', userData),    // New user registration
  logout: () => api.get('/auth/logout'),                          // Session termination
};

/**
 * Equipment management API endpoints
 * Handles CRUD operations, bulk actions, and equipment tracking
 */
export const equipment = {
  getAll: (params) => api.get('/equipment', { params }),           // Get all with filtering/search
  getById: (id) => api.get(`/equipment/${id}`),                   // Get specific equipment details
  create: (data) => api.post('/equipment', data),                 // Create new equipment (supports bulk)
  update: (id, data) => api.put(`/equipment/${id}`, data),        // Update equipment details
  delete: (id) => api.delete(`/equipment/${id}`),                 // Remove equipment from system
  updateRepair: (data) => api.put('/equipment/repair', data),     // Mark items as under repair
  completeRepair: (data) => api.put('/equipment/repair-complete', data), // Complete repair process
  retireFleet: (data) => api.put('/equipment/retire-fleet', data), // Bulk retire equipment
  getGroups: () => api.get('/equipment/groups'),                  // Get equipment grouped by type
  getLowStock: () => api.get('/equipment/low-stock'),             // Get low stock alerts
  searchIndividual: (serial) => api.get(`/equipment/search/${encodeURIComponent(serial)}`), // QR code search
};

/**
 * Equipment request/borrowing API endpoints
 * Manages the complete request lifecycle from submission to return
 */
export const requests = {
  create: (data) => api.post('/request', data),                   // Submit new borrowing request
  getUserRequests: () => api.get('/request'),                    // Get current user's requests
  getAllRequests: () => api.get('/request/manager'),             // Admin: view all system requests
  approve: (id) => api.put(`/request/${id}/approve`),            // Admin: approve pending request
  reject: (id) => api.put(`/request/${id}/reject`),              // Admin: reject pending request
  return: (id, data) => api.put(`/request/${id}/return`, data),  // Process equipment return
  earlyReturn: (id, data) => api.put(`/request/${id}/early-return`, data), // Handle early returns
};

// Dashboard statistics API endpoints
export const dashboard = {
  getStats: () => api.get('/dashboard/stats'), // Overview statistics
  getActivity: () => api.get('/dashboard/activity'), // Recent activity
  getAlerts: () => api.get('/dashboard/alerts'), // System alerts
};

// Alert management API endpoints
export const alerts = {
  getLowStock: () => api.get('/equipment/low-stock'), // Low stock items
  getOverdue: () => api.get('/alerts/overdue'), // Overdue equipment
  updateThreshold: (baseSerial, threshold) => api.put(`/alerts/threshold/${encodeURIComponent(baseSerial)}`, { stock_threshold: threshold }) // Update stock threshold
};

export const documents = {
  upload: (equipmentId, file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(`/documents/upload/${equipmentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getByEquipment: (equipmentId) => api.get(`/documents/equipment/${equipmentId}`),
  getFile: (filename) => api.get(`/documents/file/${filename}`, { responseType: 'blob' }),
  delete: (equipmentId, filename) => api.delete(`/documents/${equipmentId}/${filename}`)
};

export const users = {
  getAll: () => api.get('/users'),
  create: (userData) => api.post('/users', userData),
  updateRole: (id, data) => api.put(`/users/${id}/role`, typeof data === 'string' ? { role: data } : data),
  updateSubject: (id, subject_id) => api.put(`/users/${id}/subject`, { subject_id }),
  updateProfile: (id, data) => api.put(`/users/${id}/profile`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getActivity: (id) => api.get(`/users/${id}/activity`)
};

export const reports = {
  getUsage: () => api.get('/reports/usage'),
  getHistory: (params) => api.get('/reports/history', { params }),
  export: (type, format = 'csv') => api.get('/reports/export', {
    params: { type, format },
    responseType: 'blob'
  })
};

// Educational features API endpoints
export const education = {
  getSubjects: () => api.get('/education/subjects'),
  createSubject: (data) => api.post('/education/subjects', data),
  updateSubject: (id, data) => api.put(`/education/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/education/subjects/${id}`),
  getLessonPlans: () => api.get('/education/lesson-plans'),
  createLessonPlan: (data) => api.post('/education/lesson-plans', data),
  deleteLessonPlan: (id) => api.delete(`/education/lesson-plans/${id}`),
  getCurriculum: () => api.get('/education/curriculum'),
  getCurriculumRecommendations: (subjectCode) => api.get(`/education/curriculum/${subjectCode}/recommendations`),
  requestLessonEquipment: (lessonId, data) => api.post(`/education/lesson-plans/${lessonId}/request-equipment`, data)
};

export default api;

// 🎓 EDUCATIONAL PLATFORM FEATURES:
// - Curriculum integration with equipment booking
// - Lesson plan management and equipment requests
// - Multi-school district resource sharing
// - Teacher workflow optimization
// - Student responsibility tracking