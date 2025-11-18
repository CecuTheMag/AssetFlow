import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { education, equipment } from '../api';
import { toast } from './Toast';

const CreateLessonPlanModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    grade_level: '',
    duration_minutes: 45,
    lesson_date: '',
    start_date: '',
    end_date: '',
    learning_objectives: [''],
    required_equipment: []
  });
  const [subjects, setSubjects] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchAvailableEquipment();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.equipment-dropdown')) {
        setShowEquipmentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await education.getSubjects();
      setSubjects(response.data); // Backend now handles filtering
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchAvailableEquipment = async () => {
    try {
      const response = await equipment.getAll();
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      let availableItems = response.data.filter(item => 
        item.status === 'available' && item.serial_number
      );
      
      // If teacher, filter equipment by their subject's fleets
      if (currentUser?.role === 'teacher' && currentUser?.subject_id) {
        try {
          // Get all subjects to find teacher's subject with fleets
          const curriculumResponse = await education.getCurriculum();
          const teacherSubject = curriculumResponse.data.subjects.find(s => s.id === currentUser.subject_id);
          
          if (teacherSubject?.equipment_fleets?.length > 0) {
            availableItems = availableItems.filter(item => {
              const baseSerial = item.serial_number.replace(/\d{3}$/, '');
              return teacherSubject.equipment_fleets.includes(baseSerial);
            });
          } else {
            // If no fleets assigned, show no equipment
            availableItems = [];
          }
        } catch (error) {
          console.error('Failed to get teacher subject fleets:', error);
          availableItems = [];
        }
      }
      
      setAvailableEquipment(availableItems);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates for equipment requests');
      return;
    }
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
        required_equipment: formData.required_equipment.map(eq => eq.name)
      };

      const response = await education.createLessonPlan(submitData);
      
      toast.success('Lesson plan created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to create lesson plan');
    } finally {
      setLoading(false);
    }
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, '']
    }));
  };

  const removeObjective = (index) => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.filter((_, i) => i !== index)
    }));
  };

  const updateObjective = (index, value) => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: prev.learning_objectives.map((obj, i) => i === index ? value : obj)
    }));
  };

  const addEquipment = (equipmentItem) => {
    if (!formData.required_equipment.find(eq => eq.id === equipmentItem.id)) {
      setFormData(prev => ({
        ...prev,
        required_equipment: [...prev.required_equipment, equipmentItem]
      }));
    }
    setEquipmentSearch('');
    setShowEquipmentDropdown(false);
  };

  const removeEquipment = (equipmentId) => {
    setFormData(prev => ({
      ...prev,
      required_equipment: prev.required_equipment.filter(eq => eq.id !== equipmentId)
    }));
  };

  const filteredEquipment = availableEquipment.filter(item =>
    item.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    item.serial_number.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    item.type.toLowerCase().includes(equipmentSearch.toLowerCase())
  ).slice(0, 10);

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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
            Create Lesson Plan
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
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
              Subject *
            </label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                color: '#374151',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Grade Level
              </label>
              <input
                type="text"
                value={formData.grade_level}
                onChange={(e) => setFormData(prev => ({ ...prev, grade_level: e.target.value }))}
                placeholder="e.g., 8"
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
                Duration (min)
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
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
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Lesson Date
            </label>
            <input
              type="date"
              value={formData.lesson_date}
              onChange={(e) => setFormData(prev => ({ ...prev, lesson_date: e.target.value }))}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Equipment Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
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
                Equipment End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
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
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Description
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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: '600', color: '#374151' }}>Learning Objectives</label>
              <button
                type="button"
                onClick={addObjective}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                + Add
              </button>
            </div>
            {formData.learning_objectives.map((objective, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder="Learning objective"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {formData.learning_objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    style={{
                      padding: '8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="equipment-dropdown" style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Required Equipment ({formData.required_equipment.length} selected)
            </label>
            
            <input
              type="text"
              value={equipmentSearch}
              onChange={(e) => {
                setEquipmentSearch(e.target.value);
                setShowEquipmentDropdown(true);
              }}
              onFocus={() => setShowEquipmentDropdown(true)}
              placeholder="Search equipment by name, type, or serial number..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            
            {showEquipmentDropdown && equipmentSearch && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000
              }}>
                {filteredEquipment.length === 0 ? (
                  <div style={{ padding: '12px', color: '#6b7280', textAlign: 'center' }}>
                    No available equipment found
                  </div>
                ) : (
                  filteredEquipment.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addEquipment(item)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.type} • {item.serial_number}
                        </div>
                      </div>
                      <div style={{
                        padding: '2px 6px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                        Available
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {formData.required_equipment.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Selected Equipment:
                </div>
                {formData.required_equipment.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '6px',
                    marginBottom: '4px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {item.type} • {item.serial_number}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEquipment(item.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              Cancel
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
              {loading ? 'Creating...' : 'Create Lesson Plan'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateLessonPlanModal;