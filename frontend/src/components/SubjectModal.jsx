import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { education, equipment } from '../api';
import { toast } from './Toast';
import { useTranslation } from '../translations';
import axios from 'axios';

const SubjectModal = ({ subject, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    grade_level: '',
    room: '',
    teacher_id: '',
    equipment_fleets: []
  });
  const [equipmentFleets, setEquipmentFleets] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!subject;

  useEffect(() => {
    if (subject) {
      // Find teacher assigned to this subject
      const assignedTeacher = teachers.find(t => t.subject_id === subject.id);
      
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        grade_level: subject.grade_level || '',
        room: subject.room || '',
        teacher_id: assignedTeacher?.id || '',
        equipment_fleets: subject.equipment_fleets || []
      });
    }
    fetchEquipmentFleets();
    fetchTeachers();
  }, [subject, teachers]);

  const fetchEquipmentFleets = async () => {
    try {
      const response = await equipment.getGroups();
      setEquipmentFleets(response.data || []);
    } catch (error) {
      console.error('Failed to fetch equipment fleets:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const users = Array.isArray(response.data) ? response.data : [];
      const teacherUsers = users.filter(user => user.role === 'teacher');
      setTeachers(teacherUsers);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      setTeachers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await education.updateSubject(subject.id, formData);
        toast.success('Subject updated successfully!');
      } else {
        await education.createSubject(formData);
        toast.success('Subject created successfully!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} subject`;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
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
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
            {isEdit ? t('editSubject') : t('addSubject')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              {t('subjectName')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              {t('subjectCode')} *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              required
              placeholder={t('subjectCodePlaceholder')}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              {t('gradeLevel')}
            </label>
            <input
              type="text"
              value={formData.grade_level}
              onChange={(e) => setFormData(prev => ({ ...prev, grade_level: e.target.value }))}
              placeholder={t('gradeLevelPlaceholder')}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Room
            </label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
              placeholder="e.g., Room 101, Lab A"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              {t('assignedTeacher')}
            </label>
            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">{t('noTeacherAssigned')}</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.username} ({teacher.email})
                </option>
              ))}
            </select>
          </div>



          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Equipment Fleets
            </label>
            <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px', backgroundColor: '#ffffff' }}>
              {equipmentFleets.map((fleet) => (
                <label key={fleet.base_serial} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.equipment_fleets.includes(fleet.base_serial)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, equipment_fleets: [...prev.equipment_fleets, fleet.base_serial] }));
                      } else {
                        setFormData(prev => ({ ...prev, equipment_fleets: prev.equipment_fleets.filter(f => f !== fleet.base_serial) }));
                      }
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#000000' }}>{fleet.name} ({fleet.items?.length || 0} items)</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              {t('description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
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
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (isEdit ? t('updating') : t('creating')) : (isEdit ? t('updateSubject') : t('createSubject'))}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SubjectModal;