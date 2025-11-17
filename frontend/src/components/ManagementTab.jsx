import { useState, useEffect } from 'react';
import { equipment, education } from '../api';
import { toast } from './Toast';
import ConfirmDialog from './ConfirmDialog';
import SubjectModal from './SubjectModal';
import UsersTab from './UsersTab';
import EquipmentFleetSection from './EquipmentFleetSection';
import LessonPlansSection from './LessonPlansSection';
import CurriculumSection from './CurriculumSection';
import LessonPlanManagement from './LessonPlanManagement';
import { useTranslation } from '../translations';

const ManagementTab = ({ userRole }) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState(userRole === 'teacher' ? 'lessons' : 'equipment');
  const [equipmentFleets, setEquipmentFleets] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fleetsResponse, lessonsResponse, subjectsResponse] = await Promise.all([
        equipment.getGroups().catch(() => ({ data: [] })),
        education.getLessonPlans().catch(() => ({ data: [] })),
        education.getSubjects().catch(() => ({ data: [] }))
      ]);

      setEquipmentFleets(fleetsResponse.data || []);
      setLessonPlans(lessonsResponse.data || []);
      setSubjects(subjectsResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFleet = async (baseSerial) => {
    try {
      const fleet = equipmentFleets.find(f => f.base_serial === baseSerial);
      if (!fleet) return;

      for (const item of fleet.items) {
        await equipment.delete(item.id);
      }
      
      toast.success(`Fleet ${baseSerial} deleted successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete fleet');
    }
  };

  const handleDeleteItem = async (id, type) => {
    try {
      if (type === 'equipment') {
        await equipment.delete(id);
        toast.success('Equipment deleted successfully');
      } else if (type === 'lesson') {
        await education.deleteLessonPlan(id);
        toast.success('Lesson plan deleted successfully');
      } else if (type === 'subject') {
        await education.deleteSubject(id);
        toast.success('Subject deleted successfully');
      }
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.error || `Failed to delete ${type}`;
      toast.error(errorMsg);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'checked_out': return '#f59e0b';
      case 'under_repair': return '#ef4444';
      case 'retired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };



  const handleConfirmDelete = async () => {
    try {
      if (deleteType === 'fleet') {
        await handleDeleteFleet(selectedItems[0]);
      } else {
        await handleDeleteItem(selectedItems[0], deleteType);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
    setShowDeleteDialog(false);
    setSelectedItems([]);
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
        <p style={{ color: '#64748b', fontSize: '16px' }}>{t('loadingManagementData')}</p>
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
        textAlign: isMobile ? 'center' : 'left'
      }}>
        <h1 style={{
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: '800',
          color: '#0f172a',
          margin: '0 0 8px 0'
        }}>
          {t('systemManagement')}
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: '500',
          margin: 0
        }}>
          {t('manageEquipmentFleets')}
        </p>
      </div>

      {/* Navigation */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
        padding: isMobile ? '12px 16px' : '16px 32px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '8px' : '24px',
          overflowX: isMobile ? 'auto' : 'visible',
          paddingBottom: isMobile ? '4px' : '0'
        }}>
          {(
            userRole === 'teacher' 
              ? [{ id: 'lessons', label: isMobile ? t('lessons') : t('lessonPlans') }]
              : [
                  { id: 'equipment', label: isMobile ? t('equipment') : t('equipmentFleet') },
                  { id: 'lessons', label: isMobile ? t('lessons') : t('lessonPlans') },
                  { id: 'curriculum', label: t('curriculum') },
                  { id: 'users', label: t('users') }
                ]
          ).map((section) => (
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
                whiteSpace: 'nowrap'
              }}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {userRole === 'teacher' ? (
        <div style={{ padding: isMobile ? '16px' : '32px' }}>
          <LessonPlanManagement />
        </div>
      ) : (
        <>
          {activeSection === 'equipment' && (
            <EquipmentFleetSection 
              equipmentFleets={equipmentFleets}
              isMobile={isMobile}
              onDelete={(id, type) => {
                setSelectedItems([id]);
                setDeleteType(type);
                setShowDeleteDialog(true);
              }}
            />
          )}
          {activeSection === 'lessons' && (
            <LessonPlansSection 
              lessonPlans={lessonPlans}
              isMobile={isMobile}
              onDelete={(id, type) => {
                setSelectedItems([id]);
                setDeleteType(type);
                setShowDeleteDialog(true);
              }}
            />
          )}
          {activeSection === 'curriculum' && (
            <CurriculumSection 
              subjects={subjects}
              isMobile={isMobile}
              onDelete={(id, type) => {
                setSelectedItems([id]);
                setDeleteType(type);
                setShowDeleteDialog(true);
              }}
              onEdit={(subject) => {
                setEditingSubject(subject);
                setShowSubjectModal(true);
              }}
              onAdd={() => {
                setEditingSubject(null);
                setShowSubjectModal(true);
              }}
            />
          )}
          {activeSection === 'users' && <UsersTab />}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title={`${t('delete')} ${deleteType === 'fleet' ? t('deleteFleet') : deleteType}`}
          message={`${t('deleteConfirmMessage')} ${deleteType}? ${t('deleteCannotBeUndone')}`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedItems([]);
          }}
          confirmText={t('delete')}
          cancelText={t('cancel')}
        />
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <SubjectModal
          subject={editingSubject}
          onClose={() => {
            setShowSubjectModal(false);
            setEditingSubject(null);
          }}
          onSuccess={() => {
            fetchData();
            setShowSubjectModal(false);
            setEditingSubject(null);
          }}
        />
      )}
    </div>
  );
};

export default ManagementTab;