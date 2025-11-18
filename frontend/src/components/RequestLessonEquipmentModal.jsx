import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { equipment, education } from '../api';
import { toast } from './Toast';
import { useAuth } from '../AuthContext';

const RequestLessonEquipmentModal = ({ lessonPlan, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [formData, setFormData] = useState({
    start_date: lessonPlan.start_date || '',
    end_date: lessonPlan.end_date || '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [requestedItem, setRequestedItem] = useState(null);
  const [availableFleetItems, setAvailableFleetItems] = useState([]);

  useEffect(() => {
    fetchAvailableFleetEquipment();
    setFormData(prev => ({
      ...prev,
      start_date: lessonPlan.start_date || '',
      end_date: lessonPlan.end_date || '',
      notes: `Equipment request for lesson: ${lessonPlan.title}`
    }));
  }, [lessonPlan]);

  const fetchAvailableFleetEquipment = async () => {
    try {
      // Get equipment fleets from lesson plan's subject
      const subjectResponse = await education.getSubjects();
      const subject = subjectResponse.data.find(s => s.id === lessonPlan.subject_id);
      
      if (!subject || !subject.equipment_fleets || subject.equipment_fleets.length === 0) {
        setAvailableFleetItems([]);
        return;
      }

      // Get all equipment and filter by fleet
      const equipmentResponse = await equipment.getAll();
      const allEquipment = equipmentResponse.data;
      
      // Group equipment by fleet base serial
      const fleetItems = [];
      subject.equipment_fleets.forEach(fleetSerial => {
        const items = allEquipment.filter(item => 
          item.serial_number && 
          item.serial_number.startsWith(fleetSerial) &&
          item.status === 'available'
        );
        if (items.length > 0) {
          fleetItems.push({
            fleetSerial,
            name: items[0].name,
            type: items[0].type,
            availableItems: items.sort((a, b) => a.serial_number.localeCompare(b.serial_number))
          });
        }
      });
      
      setAvailableFleetItems(fleetItems);
    } catch (error) {
      console.error('Failed to fetch fleet equipment:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestedItem) {
      toast.error('Please select an equipment type to request');
      return;
    }

    setLoading(true);
    try {
      // Find next available item in the fleet
      const fleet = availableFleetItems.find(f => f.fleetSerial === requestedItem);
      if (!fleet || fleet.availableItems.length === 0) {
        toast.error('No more items available in this fleet');
        return;
      }

      const nextItem = fleet.availableItems[0]; // Get first available item
      
      await education.requestLessonEquipment(lessonPlan.id, {
        equipment_ids: [nextItem.id],
        ...formData
      });
      
      toast.success(`Equipment ${nextItem.serial_number} requested successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to request equipment');
    } finally {
      setLoading(false);
    }
  };

  const selectFleet = (fleetSerial) => {
    setRequestedItem(fleetSerial);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'checked_out': return '#f59e0b';
      case 'under_repair': return '#ef4444';
      default: return '#6b7280';
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
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
              Request Equipment
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
              For lesson: {lessonPlan.title}
            </p>
          </div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                readOnly={user?.role === 'student'}
                onChange={user?.role !== 'student' ? (e) => setFormData(prev => ({ ...prev, start_date: e.target.value })) : undefined}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: user?.role === 'student' ? '#f9fafb' : '#ffffff',
                  cursor: user?.role === 'student' ? 'not-allowed' : 'text'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                readOnly={user?.role === 'student'}
                onChange={user?.role !== 'student' ? (e) => setFormData(prev => ({ ...prev, end_date: e.target.value })) : undefined}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: user?.role === 'student' ? '#f9fafb' : '#ffffff',
                  cursor: user?.role === 'student' ? 'not-allowed' : 'text'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
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
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>
              Select Equipment Type (One Item Per Request)
            </label>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px'
            }}>
              {availableFleetItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  No equipment fleets available for this lesson
                </p>
              ) : (
                availableFleetItems.map((fleet) => (
                  <div
                    key={fleet.fleetSerial}
                    onClick={() => selectFleet(fleet.fleetSerial)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      margin: '4px 0',
                      backgroundColor: requestedItem === fleet.fleetSerial ? '#dbeafe' : '#f9fafb',
                      border: requestedItem === fleet.fleetSerial ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      checked={requestedItem === fleet.fleetSerial}
                      onChange={() => {}}
                      style={{ marginRight: '12px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                        {fleet.name}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>
                        {fleet.type} • Fleet: {fleet.fleetSerial}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: fleet.availableItems.length > 0 ? '#10b981' : '#ef4444',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {fleet.availableItems.length > 0 ? `${fleet.availableItems.length} Available` : 'None Available'}
                    </div>
                  </div>
                ))
              )}
            </div>
            {requestedItem && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                  Next Available Item:
                </div>
                <div style={{ fontSize: '13px', color: '#374151' }}>
                  {(() => {
                    const fleet = availableFleetItems.find(f => f.fleetSerial === requestedItem);
                    const nextItem = fleet?.availableItems[0];
                    return nextItem ? `${nextItem.serial_number} - ${nextItem.name}` : 'No items available';
                  })()}
                </div>
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
              disabled={loading || !requestedItem}
              style={{
                padding: '12px 24px',
                backgroundColor: loading || !requestedItem ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || !requestedItem ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Requesting...' : 'Request Next Available Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RequestLessonEquipmentModal;