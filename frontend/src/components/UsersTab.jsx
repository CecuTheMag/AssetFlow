import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { users } from '../api';
import { useAuth } from '../AuthContext';
import ConfirmDialog from './ConfirmDialog';
import EditUserModal from './EditUserModal';
import { toast } from './Toast';
import { useFormValidation, validationRules } from '../hooks/useFormValidation';
import { useTranslation } from '../translations';

const UsersTab = () => {
  const { t } = useTranslation();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [userActivity, setUserActivity] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const { user } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await users.getAll();
      setUsersList(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const currentUser = usersList.find(u => u.id === userId);
      await users.updateRole(userId, {
        role: newRole,
        subject_id: newRole === 'teacher' ? currentUser?.subject_id : null
      });
      await fetchUsers();
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = (userId, username) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${username}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await users.delete(userId);
          await fetchUsers();
          toast.success('User deleted successfully');
        } catch (error) {
          console.error('Failed to delete user:', error);
          toast.error('Failed to delete user');
        }
        setConfirmDialog({ isOpen: false });
      },
      onCancel: () => setConfirmDialog({ isOpen: false })
    });
  };

  const handleEditUser = (userItem) => {
    setSelectedUser(userItem);
    setShowEditModal(true);
  };

  const handleViewActivity = async (userId) => {
    try {
      const response = await users.getActivity(userId);
      setUserActivity(response.data);
      setSelectedUser(usersList.find(u => u.id === userId));
      setShowActivityModal(true);
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'manager': return '#8b5cf6';
      case 'teacher': return '#f59e0b';
      case 'student': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Only administrators can manage users.</p>
      </div>
    );
  }

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
          {t('userManagement')}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
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
          + {t('createNewUser')}
        </button>
      </div>

      <div>
        {isMobile ? (
          // Mobile Card Layout
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {usersList.map((userItem) => (
              <UserCard 
                key={userItem.id} 
                userItem={userItem} 
                currentUser={user}
                onRoleChange={handleRoleChange}
                onEditUser={handleEditUser}
                onViewActivity={handleViewActivity}
                onDeleteUser={handleDeleteUser}
                getRoleBadgeColor={getRoleBadgeColor}
              />
            ))}
          </div>
        ) : (
          // Desktop Table Layout
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.05)',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.5)'
                }}>
                  <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>User</th>
                  <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>{t('role')}</th>
                  <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Subject</th>
                  <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Requests</th>
                  <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#0f172a' }}>Joined</th>
                  <th style={{ padding: '20px', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((userItem) => (
                  <tr key={userItem.id} style={{
                    borderBottom: '1px solid rgba(226, 232, 240, 0.3)'
                  }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {userItem.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>
                            {userItem.username}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {userItem.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <select
                        value={userItem.role}
                        onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: getRoleBadgeColor(userItem.role),
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}
                      >
                        <option value="student">{t('student')}</option>
                        <option value="teacher">{t('teacher')}</option>
                        <option value="manager">{t('manager')}</option>
                        <option value="admin">{t('admin')}</option>
                      </select>
                    </td>
                    <td style={{ padding: '20px' }}>
                      {userItem.role === 'teacher' && userItem.subject_name ? (
                        <div style={{ fontSize: '14px' }}>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{userItem.subject_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>({userItem.subject_code})</div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>
                        <div>{t('totalRequests')}: {userItem.total_requests}</div>
                        <div>Pending: {userItem.pending_requests}</div>
                        <div>Approved: {userItem.approved_requests}</div>
                      </div>
                    </td>
                    <td style={{ padding: '20px', fontSize: '14px', color: '#64748b' }}>
                      {new Date(userItem.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditUser(userItem)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#10b981',
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
                          onClick={() => handleViewActivity(userItem.id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {t('activity')}
                        </button>
                        {userItem.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(userItem.id, userItem.username)}
                            style={{
                              padding: '8px 12px',
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
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <UserActivityModal
          user={selectedUser}
          activity={userActivity}
          onClose={() => setShowActivityModal(false)}
        />
      )}
      
      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog} />
    </div>
  );
};

const UserCard = ({ userItem, currentUser, onRoleChange, onEditUser, onViewActivity, onDeleteUser, getRoleBadgeColor }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(226, 232, 240, 0.3)'
      }}
    >
      {/* User Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px'
          }}>
            {userItem.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px' }}>
              {userItem.username}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {userItem.email}
            </div>
          </div>
        </div>
        
        {/* Actions Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#64748b'
            }}
          >
            ⋮
          </button>
          
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '45px',
                  right: '0',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #e2e8f0',
                  minWidth: '150px',
                  zIndex: 10,
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => {
                    onEditUser(userItem);
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                    <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
                  </svg>
                  Edit User
                </button>
                <button
                  onClick={() => {
                    onViewActivity(userItem.id);
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#374151',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                    <path d="M16,11V3H8V9H2V21H22V11H16M10,5H14V19H10V5M4,11H8V19H4V11M18,13H20V19H18V13Z"/>
                  </svg>
                  View Activity
                </button>
                {userItem.id !== currentUser.id && (
                  <button
                    onClick={() => {
                      onDeleteUser(userItem.id, userItem.username);
                      setShowDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#ef4444'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                    Delete User
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Role Badge */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={userItem.role}
            onChange={(e) => onRoleChange(userItem.id, e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: getRoleBadgeColor(userItem.role),
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              textTransform: 'capitalize',
              cursor: 'pointer'
            }}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          {userItem.role === 'teacher' && userItem.subject_name && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {userItem.subject_name} ({userItem.subject_code})
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
            {userItem.total_requests}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
            Total Requests
          </div>
        </div>
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
            {userItem.pending_requests}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
            Pending
          </div>
        </div>
      </div>
      
      {/* Join Date */}
      <div style={{
        fontSize: '14px',
        color: '#64748b',
        textAlign: 'center',
        padding: '8px',
        background: 'rgba(15, 23, 42, 0.05)',
        borderRadius: '8px'
      }}>
        Joined {new Date(userItem.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </div>
    </motion.div>
  );
};

const CreateUserModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const validation = useFormValidation(
    { username: '', email: '', password: '', role: 'student' },
    {
      username: [validationRules.required, validationRules.minLength(3)],
      email: [validationRules.required, validationRules.email],
      password: [validationRules.required, validationRules.password],
      role: [validationRules.required]
    }
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validation.validateAll()) {
      toast.error('Please fix the errors below');
      return;
    }
    
    setLoading(true);
    
    try {
      await users.create(validation.values);
      toast.success('User created successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '20px',
          padding: '0',
          width: isMobile ? '100%' : '400px',
          maxWidth: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
        <div style={{
          background: 'rgba(248, 250, 252, 0.95)',
          padding: isMobile ? '20px' : '24px 32px',
          color: '#0f172a',
          marginBottom: '24px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h2 id="modal-title" style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', fontWeight: '700' }}>{t('createNewUser')}</h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '0 20px 20px' : '0 32px 32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#0f172a' }}>
              {t('username')}
            </label>
            <input
              id="username"
              type="text"
              value={validation.values.username}
              onChange={(e) => validation.handleChange('username', e.target.value)}
              onBlur={() => validation.handleBlur('username')}
              aria-invalid={validation.errors.username ? 'true' : 'false'}
              aria-describedby={validation.errors.username ? 'username-error' : undefined}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${validation.errors.username ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
            {validation.errors.username && validation.touched.username && (
              <div id="username-error" role="alert" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {validation.errors.username}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#0f172a' }}>
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              value={validation.values.email}
              onChange={(e) => validation.handleChange('email', e.target.value)}
              onBlur={() => validation.handleBlur('email')}
              aria-invalid={validation.errors.email ? 'true' : 'false'}
              aria-describedby={validation.errors.email ? 'email-error' : undefined}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${validation.errors.email ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
            {validation.errors.email && validation.touched.email && (
              <div id="email-error" role="alert" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {validation.errors.email}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#0f172a' }}>
              {t('password')}
            </label>
            <input
              type="password"
              value={validation.values.password}
              onChange={(e) => validation.handleChange('password', e.target.value)}
              onBlur={() => validation.handleBlur('password')}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${validation.errors.password ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            />
            {validation.errors.password && validation.touched.password && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {validation.errors.password}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#0f172a' }}>
              {t('role')}
            </label>
            <select
              value={validation.values.role}
              onChange={(e) => validation.handleChange('role', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            >
              <option value="student">{t('student')}</option>
              <option value="teacher">{t('teacher')}</option>
              <option value="manager">{t('manager')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>
          
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
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? t('creating') : t('createNewUser')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UserActivityModal = ({ user, activity, onClose }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'pending': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'returned': return { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '0',
          width: isMobile ? '100%' : '900px',
          maxWidth: '100%',
          maxHeight: isMobile ? '100%' : '85%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          margin: isMobile ? '20px' : '0'
        }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700' }}>
                {user?.username}{t('userActivity')}
              </h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                {activity.length} {t('totalRequests')}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: isMobile ? '16px 20px' : '24px 32px', maxHeight: isMobile ? '70vh' : '500px', overflowY: 'auto' }}>
          {activity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#9ca3af">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17Z"/>
                </svg>
              </div>
              <h3 style={{ color: '#6b7280', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                {t('noActivityFound')}
              </h3>
              <p style={{ color: '#9ca3af', margin: 0 }}>
                {t('noActivityMessage')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activity.map((item) => {
                const statusStyle = getStatusColor(item.status);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          margin: '0 0 8px 0', 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#111827' 
                        }}>
                          {item.equipment_name}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📅 {t('requested')}: {new Date(item.request_date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          {item.start_date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>⏰ {t('period')}: {new Date(item.start_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })} - {new Date(item.end_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                        textTransform: 'capitalize',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>
                        {item.status}
                      </div>
                    </div>
                    
                    {item.return_condition && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>{t('returnCondition')}:</span>
                        <span style={{ color: '#6b7280', marginLeft: '8px', textTransform: 'capitalize' }}>
                          {item.return_condition}
                        </span>
                      </div>
                    )}
                    
                    {item.notes && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #e0f2fe',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                          📝 {t('notes')}
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UsersTab;