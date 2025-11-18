import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { education } from '../api';
import { useAuth } from '../AuthContext';
import CreateLessonPlanModal from './CreateLessonPlanModal';
import AutoEquipmentRequestModal from './AutoEquipmentRequestModal';
import { useTranslation } from '../translations';

const EducationTab = () => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('lesson-plans');
  const [lessonPlans, setLessonPlans] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [curriculum, setCurriculum] = useState({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchEducationData();
  }, []);

  const fetchEducationData = async () => {
    try {
      const [lessonResponse, subjectsResponse, curriculumResponse] = await Promise.all([
        education.getLessonPlans().catch(() => ({ data: [] })),
        education.getSubjects().catch(() => ({ data: [] })),
        education.getCurriculum().catch(() => ({ data: { subjects: [], summary: {} } }))
      ]);

      setLessonPlans(lessonResponse.data || []);
      setSubjects(subjectsResponse.data || []);
      setCurriculum(curriculumResponse.data || { subjects: [], summary: {} });
    } catch (error) {
      console.error('Error fetching education data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEquipment = (lesson) => {
    setSelectedLesson(lesson);
    setShowRequestModal(true);
  };

  const handleModalSuccess = () => {
    fetchEducationData();
  };

  const LessonPlansSection = () => (
    <div style={{ 
      padding: isMobile ? '12px' : '32px',
      margin: '0',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        marginBottom: isMobile ? '16px' : '24px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: '#0f172a', 
          fontSize: isMobile ? '20px' : '24px', 
          fontWeight: '700',
          fontFamily: '"SF Pro Display", -apple-system, sans-serif'
        }}>
          {t('lessonPlans')}
        </h2>
        {['teacher', 'manager', 'admin'].includes(user?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: isMobile ? '10px 16px' : '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto',
              outline: 'none'
            }}
          >
            + {t('createLessonPlan')}
          </button>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gap: isMobile ? '12px' : '16px',
        width: '100%',
        maxWidth: '100%'
      }}>
        {lessonPlans.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '40px 20px' : '60px 24px',
            color: '#64748b',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              fontSize: isMobile ? '32px' : '48px',
              marginBottom: '16px'
            }}>📚</div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: isMobile ? '18px' : '20px', 
              color: '#0f172a', 
              fontWeight: '600'
            }}>
              {t('noLessonPlansYet')}
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '14px' : '16px',
              color: '#64748b'
            }}>
              {t('createFirstLessonPlan')}
            </p>
          </div>
        ) : (
          lessonPlans.map((lesson) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                width: '100%',
                maxWidth: isMobile ? 'calc(100vw - 24px)' : '100%',
                minWidth: 0,
                boxSizing: 'border-box'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'start', 
                marginBottom: '12px',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '12px' : '0'
              }}>
                <div style={{ width: isMobile ? '100%' : 'auto' }}>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#0f172a', 
                    fontSize: isMobile ? '16px' : '18px', 
                    fontWeight: '600',
                    fontFamily: '"SF Pro Display", -apple-system, sans-serif'
                  }}>
                    {lesson.title}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ 
                      background: '#dbeafe', 
                      color: '#1d4ed8', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '12px', 
                      fontWeight: '500' 
                    }}>
                      {lesson.subject_name}
                    </span>
                    {lesson.grade_level && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        {t('gradeLevel')} {lesson.grade_level}
                      </span>
                    )}
                    {lesson.duration_minutes && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        {lesson.duration_minutes} {t('minutes')}
                      </span>
                    )}
                  </div>
                </div>
                {!isMobile && (
                  <button 
                    onClick={() => handleRequestEquipment(lesson)}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {t('requestEquipment')}
                  </button>
                )}
              </div>
              
              {lesson.description && (
                <p style={{ 
                  margin: '0 0 16px 0', 
                  color: '#4b5563', 
                  lineHeight: '1.5',
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  {lesson.description}
                </p>
              )}

              {lesson.required_equipment && lesson.required_equipment.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '600' 
                  }}>
                    {t('requiredEquipment')}:
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {lesson.required_equipment.map((equipment, index) => (
                      <span key={index} style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
                <div style={{ marginBottom: isMobile ? '16px' : '0' }}>
                  <h4 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#374151', 
                    fontSize: '14px', 
                    fontWeight: '600' 
                  }}>
                    {t('learningObjectives')}:
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '20px', 
                    color: '#6b7280', 
                    fontSize: isMobile ? '13px' : '14px' 
                  }}>
                    {lesson.learning_objectives.map((objective, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {isMobile && (
                <button 
                  onClick={() => handleRequestEquipment(lesson)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    outline: 'none',
                    marginTop: '16px'
                  }}
                >
                  📋 {t('requestEquipment')}
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchRecommendations = async (subjectCode) => {
    setLoadingRecommendations(true);
    try {
      const response = await education.getCurriculumRecommendations(subjectCode);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const getCoverageColor = (status) => {
    switch (status) {
      case 'Covered': return '#10b981';
      case 'No Equipment': return '#ef4444';
      case 'No Available Equipment': return '#f59e0b';
      case 'No Lesson Plans': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getImpactColor = (score) => {
    if (score >= 4.5) return '#10b981';
    if (score >= 4.0) return '#3b82f6';
    if (score >= 3.5) return '#f59e0b';
    return '#ef4444';
  };

  const CurriculumSection = () => {
    if (!curriculum.subjects) return null;

    return (
      <div style={{ 
        padding: isMobile ? '12px' : '32px',
        margin: '0',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Header with Summary */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            margin: '0 0 16px 0', 
            color: '#0f172a', 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: '700',
            fontFamily: '"SF Pro Display", -apple-system, sans-serif'
          }}>
            {t('curriculumEquipmentIntegration')}
          </h2>
          
          {curriculum.summary && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {curriculum.summary.total_subjects}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{t('totalSubjects')}</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {curriculum.summary.subjects_with_fleets}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>With Fleets</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {curriculum.summary.subjects_with_lessons}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{t('withLessons')}</div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {curriculum.summary.total_equipment_mapped}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{t('equipmentItems')}</div>
              </div>
            </div>
          )}
        </div>



        {/* Subject Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: isMobile ? '16px' : '24px',
          width: '100%',
          maxWidth: '100%'
        }}>
          {curriculum.subjects.map((subject) => {
            const hasFleets = parseInt(subject.fleet_count) > 0;
            
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: `2px solid ${hasFleets ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Subject Header */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: '#0f172a', 
                      fontSize: '18px', 
                      fontWeight: '700',
                      fontFamily: '"SF Pro Display", -apple-system, sans-serif'
                    }}>
                      {subject.name}
                    </h3>

                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ 
                      background: '#dbeafe', 
                      color: '#1d4ed8', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '12px', 
                      fontWeight: '600' 
                    }}>
                      {subject.code}
                    </span>
                    {subject.grade_level && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        {t('grades')} {subject.grade_level}
                      </span>
                    )}
                    {subject.room && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        📍 {subject.room}
                      </span>
                    )}
                    {subject.teacher_name && (
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>
                        👨‍🏫 {subject.teacher_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Equipment Fleets Overview */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Equipment Fleets</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {subject.fleet_count} fleets • {subject.total_equipment} items
                    </span>
                  </div>
                  
                  {hasFleets ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {subject.fleets.slice(0, 4).map((fleet, idx) => (
                        <span key={idx} style={{
                          padding: '2px 6px',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '500'
                        }}>
                          {fleet.name} ({fleet.total_count})
                        </span>
                      ))}
                      {subject.fleets.length > 4 && (
                        <span style={{
                          padding: '2px 6px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          +{subject.fleets.length - 4} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fef2f2',
                      border: '1px dashed #fca5a5',
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#dc2626',
                      fontSize: '12px'
                    }}>
                      No equipment fleets assigned
                    </div>
                  )}
                </div>

                {/* Statistics Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: '#3b82f6' 
                    }}>
                      {subject.lesson_count || 0}
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {t('lessons')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: '#10b981' 
                    }}>
                      {subject.fleet_count || 0}
                    </div>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      Fleets
                    </div>
                  </div>
                </div>

                {/* Subject Description */}
                {subject.description && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ 
                      margin: 0, 
                      color: '#6b7280', 
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}>
                      {subject.description}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>


      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #0f172a',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#64748b', fontSize: '16px' }}>{t('loadingEducationalData')}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: isMobile ? '16px' : '32px',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        margin: '0',
        borderRadius: '0',
        textAlign: isMobile ? 'center' : 'left',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '800',
          color: '#0f172a',
          margin: '0 0 8px 0',
          fontFamily: '"SF Pro Display", -apple-system, sans-serif'
        }}>
          {t('educationalPlatform')}
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '500',
          margin: 0
        }}>
          {t('smartCurriculumIntegration')}
        </p>
      </div>

      {/* Navigation */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
        padding: isMobile ? '12px 16px' : '16px 32px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '8px' : '24px',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '4px' : '0'
        }}>
          {[
            { id: 'lesson-plans', label: isMobile ? t('plans') : t('lessonPlans') },
            { id: 'curriculum', label: isMobile ? t('curriculum') : t('curriculumIntegrationFull') }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                background: activeSection === section.id ? '#dbeafe' : 'transparent',
                color: activeSection === section.id ? '#1d4ed8' : '#6b7280',
                border: 'none',
                borderRadius: '8px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                outline: 'none',
                minWidth: isMobile ? 'auto' : 'fit-content'
              }}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeSection === 'lesson-plans' && <LessonPlansSection />}
      {activeSection === 'curriculum' && <CurriculumSection />}

      {/* Modals */}
      {showCreateModal && (
        <CreateLessonPlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
      
      {showRequestModal && selectedLesson && (
        <AutoEquipmentRequestModal
          lessonPlan={selectedLesson}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedLesson(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default EducationTab;