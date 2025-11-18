import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { users, education } from '../api';
import { toast } from './Toast';
import { useTranslation } from '../translations';

const EditUserModal = ({ user, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    role: user?.role || 'student',
    subject_id: user?.subject_id || ''
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      // Get curriculum data which shows all subjects
      const response = await education.getCurriculum();
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        role: formData.role,
        subject_id: formData.role === 'teacher' ? formData.subject_id : null
      };
      
      await users.updateRole(user.id, updateData);
      toast.success('User updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '20px' : '0'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'white',
          borderRadius: '20px',
          padding: '0',
          width: isMobile ? '100%' : '400px',
          maxWidth: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: isMobile ? '20px' : '24px 32px',
          color: 'white',
          marginBottom: '24px'
        }}>
          <h2 id="modal-title" style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', fontWeight: '700' }}>
            {t('editUser')}: {user?.username}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '0 20px 20px' : '0 32px 32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a' }}>
              {t('role')}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            >
              <option value="student">{t('student')}</option>
              <option value="teacher">{t('teacher')}</option>
              <option value="manager">{t('manager')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>

          {formData.role === 'teacher' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0f172a' }}>
                {t('subject')}
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              >
                <option value="">{t('selectSubject')}</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {loading ? t('updating') : t('updateUser')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditUserModal;