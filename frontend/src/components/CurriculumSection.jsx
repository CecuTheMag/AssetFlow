import { motion } from 'framer-motion';
import { useTranslation } from '../translations';

const CurriculumSection = ({ subjects, isMobile, onDelete, onEdit, onAdd }) => {
  const { t } = useTranslation();
  return (
    <div style={{ padding: isMobile ? '12px' : '32px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: '#0f172a', 
          fontSize: isMobile ? '20px' : '24px', 
          fontWeight: '700' 
        }}>
          {t('curriculumManagement')}
        </h2>
        <button
          onClick={onAdd}
          style={{
            padding: '12px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          + {t('addSubject')}
        </button>
      </div>

      {subjects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: '#64748b',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px'
        }}>
          <h3>{t('noSubjects')}</h3>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px' 
        }}>
          {subjects.map((subject) => (
            <motion.div
              key={subject.id}
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
                marginBottom: '12px'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                    {subject.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ 
                      background: '#e0f2fe', 
                      color: '#0369a1', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '12px' 
                    }}>
                      {subject.code}
                    </span>
                    {subject.grade_level && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        {t('grades')} {subject.grade_level}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onEdit(subject)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => onDelete(subject.id, 'subject')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
              
              {subject.description && (
                <p style={{ 
                  margin: '8px 0 0 0', 
                  color: '#4b5563', 
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {subject.description}
                </p>
              )}
              
              {/* Subject Details */}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>Room: </span>
                    <span style={{ color: '#374151', fontWeight: '500' }}>{subject.room || 'Not assigned'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Teacher: </span>
                    <span style={{ color: '#374151', fontWeight: '500' }}>{subject.teacher_name || 'Not assigned'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Equipment Fleets: </span>
                    <span style={{ color: '#374151', fontWeight: '500' }}>{subject.fleet_count || 0}</span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Total Items: </span>
                    <span style={{ color: '#374151', fontWeight: '500' }}>{subject.total_equipment || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurriculumSection;