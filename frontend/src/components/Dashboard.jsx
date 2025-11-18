// Dashboard Component - Main application interface
// Handles equipment display, search/filtering, statistics, and user interactions
// Supports responsive design and role-based access control

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { equipment, dashboard } from '../api';
import { useAuth } from '../AuthContext';
import { toast } from './Toast';
import Pagination from './Pagination';
import Sidebar from './Sidebar';
import StatsCard from './StatsCard';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import EquipmentCard from './EquipmentCard';
import { useTranslation } from '../translations';

import EquipmentTab from './EquipmentTab';
import RequestsTab from './RequestsTab';
import AnalyticsTab from './AnalyticsTab';
import ReportsTab from './ReportsTab';
import AlertsTab from './AlertsTab';
import UsersTab from './UsersTab';
import EducationTab from './EducationTab';
import ManagementTab from './ManagementTab';
import SettingsTab from './SettingsTab';
import QRScanner from './QRScanner';
import EquipmentDetailsModal from './EquipmentDetailsModal';
import RequestEquipmentModal from './RequestEquipmentModal';
import AddEquipmentModal from './AddEquipmentModal';
import LoadingSpinner from './LoadingSpinner';
import Footer from './Footer';

/**
 * Main Dashboard Component
 * Provides comprehensive equipment management interface with:
 * - Real-time statistics and analytics
 * - Advanced search and filtering capabilities
 * - Responsive grid/list view modes
 * - QR code scanning integration
 * - Role-based feature access
 */
const Dashboard = () => {
  const { t } = useTranslation();
  // Core data state
  const [equipmentList, setEquipmentList] = useState([]);     // All equipment items
  const [dashboardStats, setDashboardStats] = useState(null); // Statistics from API
  const [loading, setLoading] = useState(true);               // Initial loading state
  
  // UI interaction state
  const [searchTerm, setSearchTerm] = useState('');           // Search query
  const [activeFilters, setActiveFilters] = useState([]);     // Status filters
  const [activeTab, setActiveTab] = useState('dashboard');    // Current tab
  const [viewMode, setViewMode] = useState('grid');           // Grid or list view
  
  // Modal and selection state
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Responsive and pagination state
  const [isMobile, setIsMobile] = useState(false);            // Mobile breakpoint detection
  const [error, setError] = useState(null);                   // Error handling
  const [currentPage, setCurrentPage] = useState(1);          // Pagination
  const [itemsPerPage] = useState(12);                        // Items per page
  
  // Individual item search (QR code results)
  const [individualItem, setIndividualItem] = useState(null);
  const [showingIndividual, setShowingIndividual] = useState(false);
  
  const { user } = useAuth();
  
  // Role-based access control
  const hasLimitedAccess = user?.role === 'student';

  /**
   * Responsive breakpoint detection
   * Monitors window size changes to adjust UI layout
   */
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Initial data loading with error handling and fallback
   * Fetches equipment list and dashboard statistics concurrently
   * Provides graceful degradation if statistics API fails
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        // Parallel API calls for better performance
        const [equipmentResponse, statsResponse] = await Promise.all([
          equipment.getAll(),
          dashboard.getStats().catch(() => ({ data: null })) // Non-blocking stats failure
        ]);
        setEquipmentList(equipmentResponse.data);
        setDashboardStats(statsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
        
        // Fallback: try to load equipment list only
        try {
          const equipmentResponse = await equipment.getAll();
          setEquipmentList(equipmentResponse.data);
        } catch (equipmentError) {
          console.error('Failed to fetch equipment:', equipmentError);
          setError('Failed to load equipment data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * Equipment filtering logic
   * Combines search term matching (name, type, serial) with status filters
   * Provides real-time filtering as user types or selects filters
   */
  const filteredEquipment = equipmentList.filter(item => {
    // Multi-field search: name, type, and serial number
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filtering: show all if no filters, otherwise match selected statuses
    const matchesFilters = activeFilters.length === 0 || activeFilters.includes(item.status);
    
    return matchesSearch && matchesFilters;
  });

  /**
   * Individual item search for QR code scanning
   * Debounced search that looks for specific serial numbers
   * Triggered when search term is longer than 3 characters
   */
  useEffect(() => {
    const searchIndividualItem = async () => {
      if (searchTerm.length > 3) {
        try {
          // Search for exact serial number matches (QR code scanning)
          const response = await equipment.searchIndividual(searchTerm);
          setIndividualItem(response.data);
          setShowingIndividual(true);
        } catch (error) {
          // No individual item found, continue with normal search
          setIndividualItem(null);
          setShowingIndividual(false);
        }
      } else {
        setIndividualItem(null);
        setShowingIndividual(false);
      }
    };

    // Debounce search to avoid excessive API calls
    const timeoutId = setTimeout(searchIndividualItem, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  /**
   * Pagination calculations
   * Splits filtered equipment into pages for better performance
   */
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEquipment = filteredEquipment.slice(startIndex, startIndex + itemsPerPage);

  /**
   * Reset pagination when search or filters change
   * Ensures user sees results from the beginning
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  /**
   * Statistics calculation with fallback
   * Uses API data when available, otherwise calculates from equipment list
   * Provides real-time statistics for dashboard cards
   */
  const stats = dashboardStats ? {
    // Use API statistics (more accurate, includes historical data)
    total: parseInt(dashboardStats.equipment.total_equipment) || 0,
    available: parseInt(dashboardStats.equipment.available) || 0,
    checkedOut: parseInt(dashboardStats.equipment.checked_out) || 0,
    underRepair: parseInt(dashboardStats.equipment.under_repair) || 0
  } : {
    // Fallback: calculate from current equipment list
    total: equipmentList.length,
    available: equipmentList.filter(item => item.status === 'available').length,
    checkedOut: equipmentList.filter(item => item.status === 'checked_out').length,
    underRepair: equipmentList.filter(item => item.status === 'under_repair').length
  };

  const filters = [
    { key: 'available', label: t('availableFilter'), color: '#10b981' },
    { key: 'checked_out', label: t('checkedOutFilter'), color: '#f59e0b' },
    { key: 'under_repair', label: t('underRepairFilter'), color: '#ef4444' },
    { key: 'retired', label: t('retiredFilter'), color: '#6b7280' }
  ];

  const handleFilterChange = (filterKey) => {
    setActiveFilters(prev => 
      prev.includes(filterKey) 
        ? prev.filter(f => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  const handleViewDetails = (item) => {
    setSelectedEquipment(item);
    setShowDetailsModal(true);
  };

  const handleRequest = (item) => {
    setSelectedEquipment(item);
    setShowRequestModal(true);
  };

  const handleAddEquipment = () => {
    setShowAddModal(true);
  };

  const handleModalSuccess = () => {
    // Refresh data after successful action
    const fetchData = async () => {
      try {
        const [equipmentResponse, statsResponse] = await Promise.all([
          equipment.getAll(),
          dashboard.getStats().catch(() => ({ data: null }))
        ]);
        setEquipmentList(equipmentResponse.data);
        setDashboardStats(statsResponse.data);
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    };
    fetchData();
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: '24px',
          fontFamily: '"SF Pro Display", -apple-system, sans-serif'
        }}
      >
        <LoadingSpinner size={64} />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: 'center' }}
        >
          <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Loading AssetFlow</h2>
          <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500', margin: 0 }}>Preparing your dashboard...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: '"SF Pro Display", -apple-system, sans-serif',
      display: 'flex',
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        user={user}
      />
      
      <div style={{
        flex: 1,
        marginLeft: isMobile ? '0' : 'var(--sidebar-width, 300px)',
        marginTop: isMobile ? '70px' : '0',
        minHeight: isMobile ? 'calc(100vh - 70px)' : '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        width: isMobile ? '100%' : 'calc(100% - var(--sidebar-width, 300px))',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        display: isMobile ? 'flex' : 'block',
        flexDirection: isMobile ? 'column' : 'initial'
      }}>
        {activeTab === 'dashboard' ? (
          <>
            {/* Header */}
            <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: isMobile ? '12px' : '40px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          margin: '0',
          borderRadius: '0',
          width: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : '0',
            marginBottom: '24px'
          }}>
            <div style={{ width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'left' }}>
              <h1 style={{
                fontSize: isMobile ? '28px' : 'var(--font-3xl, 32px)',
                fontWeight: '800',
                color: '#0f172a',
                margin: '0 0 8px 0',
                fontFamily: '"SF Pro Display", -apple-system, sans-serif'
              }}>
                {t('dashboardTitle')}
              </h1>
              <p style={{
                color: '#64748b',
                fontSize: isMobile ? '16px' : 'var(--font-base, 16px)',
                fontWeight: '500',
                margin: 0
              }}>
                {t('dashboardSubtitle')}
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '8px' : '12px', 
              alignItems: 'center',
              flexWrap: 'wrap',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '16px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: '"SF Pro Text", -apple-system, sans-serif',
                  minWidth: isMobile ? '120px' : 'auto'
                }}
              >
                {viewMode === 'grid' ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M3,5H21V7H3V5M3,13V11H21V13H3M3,19V17H21V19H3Z"/>
                    </svg>
                    {t('list')}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
                      <path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3"/>
                    </svg>
                    {t('grid')}
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setShowQRScanner(true)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '16px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                  fontFamily: '"SF Pro Text", -apple-system, sans-serif',
                  minWidth: isMobile ? '120px' : 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,11H5V13H3V11M11,5H13V9H11V5M9,11H13V15H9V11M15,11H17V13H15V11M19,11H21V13H19V11M5,7H9V11H5V7M3,5H5V7H3V5M3,13H5V15H3V13M7,5H9V7H7V5M3,19H5V21H3V19M7,19H9V21H7V19M11,19H13V21H11V19M15,19H17V21H15V19M19,19H21V21H19V19M15,5H17V7H15V5M19,5H21V7H19V5M15,7H17V9H15V7M19,7H21V9H19V7M15,13H17V15H15V13M19,13H21V15H19V13M15,15H17V17H15V15M19,15H21V17H19V15M15,17H17V19H15V17M19,17H21V19H19V17Z"/>
                </svg>
                {t('scanQR')}
              </button>
              
              {['teacher', 'manager', 'admin'].includes(user?.role) && (
                <button 
                  onClick={handleAddEquipment}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: isMobile ? '16px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    fontFamily: '"SF Pro Text", -apple-system, sans-serif',
                    minWidth: isMobile ? '100px' : 'auto'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  + {t('addEquipmentButton')}
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '8px' : '24px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: isMobile ? '0' : '10px 0 20px 0'
          }}>
            <StatsCard 
              title={t('totalEquipmentTitle')} 
              value={stats.total} 
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
                </svg>
              }
              color="#0f172a" 
              trend={null}
              delay={0}
              onClick={() => setActiveFilters([])}
              isMobile={isMobile}
            />
            <StatsCard 
              title={t('availableTitle')} 
              value={stats.available} 
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                </svg>
              }
              color="#10b981" 
              trend={null}
              delay={200}
              onClick={() => handleFilterChange('available')}
              isMobile={isMobile}
            />
            <StatsCard 
              title={t('checkedOutTitle')} 
              value={stats.checkedOut} 
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5,17H19V19H5V17M12,5A4,4 0 0,1 16,9C16,10.88 14.88,12.53 13.25,13.31L15,22H9L10.75,13.31C9.13,12.53 8,10.88 8,9A4,4 0 0,1 12,5Z"/>
                </svg>
              }
              color="#f59e0b" 
              trend={null}
              delay={400}
              onClick={() => handleFilterChange('checked_out')}
              isMobile={isMobile}
            />
            <StatsCard 
              title={t('underRepairTitle')} 
              value={stats.underRepair} 
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                </svg>
              }
              color="#ef4444" 
              trend={null}
              delay={600}
              onClick={() => handleFilterChange('under_repair')}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Controls */}
        <div style={{
          padding: isMobile ? '12px' : '32px 40px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          margin: '0',
          width: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '24px',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between'
          }}>
            <SearchBar 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm}
              placeholder={isMobile ? t('searchPlaceholder') : t('searchEquipmentByName')}
            />
            
            <FilterBar 
              filters={filters}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          padding: isMobile ? '12px' : '40px 60px',
          margin: '0',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'visible'
        }}>
          {showingIndividual && individualItem ? (
            <div>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h3 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  {t('individualItemFound')}
                </h3>
                <button
                  onClick={() => {
                    setShowingIndividual(false);
                    setIndividualItem(null);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {t('backToEquipmentList')}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: '500px', width: '100%' }}>
                  <EquipmentCard
                    item={individualItem}
                    onViewDetails={handleViewDetails}
                    onRequest={handleRequest}
                    user={user}
                    isMobile={isMobile}
                  />
                </div>
              </div>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '40px 20px' : '80px 24px',
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{
                width: isMobile ? '80px' : '120px',
                height: isMobile ? '80px' : '120px',
                backgroundColor: '#f1f5f9',
                borderRadius: '50%',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width={isMobile ? '32' : '48'} height={isMobile ? '32' : '48'} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                </svg>
              </div>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                fontSize: isMobile ? '20px' : '28px', 
                color: '#0f172a', 
                fontWeight: '700',
                fontFamily: '"SF Pro Display", -apple-system, sans-serif'
              }}>
                {t('noEquipmentFound')}
              </h3>
              <p style={{ 
                margin: '0 0 20px 0', 
                fontSize: isMobile ? '14px' : '16px',
                maxWidth: '400px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: '1.6'
              }}>
                {t('tryAdjustingSearch')}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilters([]);
                }}
                style={{
                  padding: isMobile ? '10px 20px' : '12px 24px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: isMobile ? '14px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: '"SF Pro Text", -apple-system, sans-serif'
                }}
              >
                {t('clearSearch')}
              </button>
            </div>
          ) : (
            <motion.div
              layout
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile 
                  ? '1fr' 
                  : viewMode === 'grid' 
                    ? 'repeat(auto-fill, minmax(320px, 1fr))'
                    : '1fr',
                gap: isMobile ? '12px' : '24px',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'visible'
              }}
            >
              <AnimatePresence>
                {paginatedEquipment.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                  >
                    <EquipmentCard
                      item={item}
                      onViewDetails={handleViewDetails}
                      onRequest={handleRequest}
                      user={user}
                      isMobile={isMobile}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* Pagination */}
          {!isMobile && filteredEquipment.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredEquipment.length}
            />
          )}
        </div>
        <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'equipment' ? (
          <>
            <EquipmentTab />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'requests' ? (
          <>
            <RequestsTab />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'analytics' ? (
          <>
            <AnalyticsTab />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'reports' ? (
          <>
            <ReportsTab />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'alerts' ? (
          <>
            <AlertsTab />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'users' ? (
          <>
            <UsersTab />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'education' ? (
          <>
            <EducationTab />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'management' ? (
          <>
            <ManagementTab userRole={user?.role} />
            <Footer isMobile={isMobile} />
          </>
        ) : activeTab === 'settings' ? (
          <>
            <SettingsTab />
            <Footer isMobile={isMobile} />
          </>
        ) : null}
        
        {/* Modals */}
        {showDetailsModal && (
          <EquipmentDetailsModal
            equipment={selectedEquipment}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedEquipment(null);
            }}
          />
        )}
        
        {showRequestModal && (
          <RequestEquipmentModal
            equipment={selectedEquipment}
            onClose={() => {
              setShowRequestModal(false);
              setSelectedEquipment(null);
            }}
            onSuccess={handleModalSuccess}
          />
        )}
        
        {showAddModal && (
          <AddEquipmentModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleModalSuccess}
          />
        )}
        
        {showQRScanner && (
          <QRScanner
            onClose={() => setShowQRScanner(false)}
            onEquipmentFound={(serialNumber) => {
              setSearchTerm(serialNumber);
              setShowQRScanner(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;