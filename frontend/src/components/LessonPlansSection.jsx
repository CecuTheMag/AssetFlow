import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../translations';
import { AuthContext } from '../AuthContext';
import AutoEquipmentRequestModal from './AutoEquipmentRequestModal';

const LessonPlansSection = ({ lessonPlans, isMobile, onDelete, onRefresh }) => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleRequestEquipment = (lesson) => {
    setSelectedLesson(lesson);
    setShowRequestModal(true);
  };

  const handleRequestSuccess = () => {
    if (onRefresh) onRefresh();
  };
  return (
    <div style={{ padding: isMobile ? '12px' : '32px' }}>
      <h2 style={{ 
        margin: '0 0 24px 0', 
        color: '#0f172a', 
        fontSize: isMobile ? '20px' : '24px', 
        fontWeight: '700' 
      }}>
        {t('lessonPlanManagement')}
      </h2>

      {lessonPlans.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: '#64748b',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px'
        }}>
          <h3>{t('noLessonPlans')}</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {lessonPlans.map((lesson) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '12px' : '0'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                    {lesson.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                      margin: '8px 0 0 0', 
                      color: '#4b5563', 
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      {lesson.description}
                    </p>
                  )}
                  {lesson.start_date && lesson.end_date && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      Equipment Period: {new Date(lesson.start_date).toLocaleDateString()} - {new Date(lesson.end_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                  {user?.role === 'student' && lesson.start_date && lesson.end_date && (
                    <button
                      onClick={() => handleRequestEquipment(lesson)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Request Equipment
                    </button>
                  )}
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <button
                      onClick={() => onDelete(lesson.id, 'lesson')}
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
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {showRequestModal && selectedLesson && (
        <AutoEquipmentRequestModal
          lessonPlan={selectedLesson}
          onClose={() => setShowRequestModal(false)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};

export default LessonPlansSection;