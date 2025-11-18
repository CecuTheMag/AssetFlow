import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { education } from '../api';
import { toast } from './Toast';
import CreateLessonPlanModal from './CreateLessonPlanModal';
import { useTranslation } from '../translations';

const LessonPlanManagement = () => {
  const { t } = useTranslation();
  const [lessonPlans, setLessonPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchLessonPlans();
  }, []);

  const fetchLessonPlans = async () => {
    try {
      const response = await education.getLessonPlans();
      setLessonPlans(response.data || []);
    } catch (error) {
      console.error('Failed to fetch lesson plans:', error);
      toast.error('Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLessonPlan = async (id) => {
    if (!window.confirm(t('confirmDeleteLessonPlan'))) return;
    
    try {
      await education.deleteLessonPlan(id);
      toast.success('Lesson plan deleted successfully');
      fetchLessonPlans();
    } catch (error) {
      toast.error('Failed to delete lesson plan');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #0f172a',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: 0,
          color: '#0f172a',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          {t('myLessonPlans')}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {t('createLessonPlan')}
        </button>
      </div>

      {lessonPlans.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: '#64748b',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px'
        }}>
          <h3>{t('noLessonPlans')}</h3>
          <p>{t('createFirstLessonPlan')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {lessonPlans.map((lesson) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#0f172a'
                  }}>
                    {lesson.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: '12px'
                  }}>
                    <span style={{
                      background: '#dbeafe',
                      color: '#1d4ed8',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      {lesson.subject_name}
                    </span>
                    {lesson.grade_level && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        {t('grade')} {lesson.grade_level}
                      </span>
                    )}
                    {lesson.duration_minutes && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        {lesson.duration_minutes} min
                      </span>
                    )}
                  </div>
                  {lesson.description && (
                    <p style={{
                      margin: 0,
                      color: '#4b5563',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      {lesson.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteLessonPlan(lesson.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateLessonPlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchLessonPlans();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default LessonPlanManagement;