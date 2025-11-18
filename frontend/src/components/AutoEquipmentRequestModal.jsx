import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { equipment, education } from '../api';
import { toast } from './Toast';
import { useAuth } from '../AuthContext';

const AutoEquipmentRequestModal = ({ lessonPlan, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [availableFleetItems, setAvailableFleetItems] = useState([]);
  const [selectedFleet, setSelectedFleet] = useState('');
  const [loading, setLoading] = useState(false);
  const [nextAvailableItem, setNextAvailableItem] = useState(null);

  useEffect(() => {
    fetchAvailableFleetEquipment();
  }, [lessonPlan]);

  useEffect(() => {
    if (selectedFleet) {
      findNextAvailableItem();
    }
  }, [selectedFleet, availableFleetItems]);

  const fetchAvailableFleetEquipment = async () => {
    try {
      // Get subject details to find equipment fleets
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
          // Sort by serial number to ensure consistent ordering
          const sortedItems = items.sort((a, b) => a.serial_number.localeCompare(b.serial_number));
          
          fleetItems.push({
            fleetSerial,
            name: items[0].name,
            type: items[0].type,
            availableItems: sortedItems
          });
        }
      });
      
      setAvailableFleetItems(fleetItems);
    } catch (error) {
      console.error('Failed to fetch fleet equipment:', error);
    }
  };

  const findNextAvailableItem = async () => {
    if (!selectedFleet) {
      setNextAvailableItem(null);
      return;
    }

    try {
      const fleet = availableFleetItems.find(f => f.fleetSerial === selectedFleet);
      if (!fleet || fleet.availableItems.length === 0) {
        setNextAvailableItem(null);
        return;
      }

      // Check for existing requests in the date range to find truly available items
      const startDate = lessonPlan.start_date;
      const endDate = lessonPlan.end_date;
      
      // Find the first item that doesn't have conflicting requests
      for (const item of fleet.availableItems) {
        // This would ideally check against existing requests, but for now we'll use the first available
        setNextAvailableItem(item);
        break;
      }
    } catch (error) {
      console.error('Failed to find next available item:', error);
      setNextAvailableItem(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFleet || !nextAvailableItem) {
      toast.error('Please select an equipment type');
      return;
    }

    setLoading(true);
    try {
      await education.requestLessonEquipment(lessonPlan.id, {
        equipment_ids: [nextAvailableItem.id],
        start_date: lessonPlan.start_date,
        end_date: lessonPlan.end_date,
        notes: `Automatic equipment request for lesson: ${lessonPlan.title}`
      });
      
      toast.success(`Equipment ${nextAvailableItem.serial_number} requested successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to request equipment';
      if (errorMsg.includes('No more items available')) {
        toast.error('No more items available in this fleet. All items are currently in use.');
      } else {
        toast.error(errorMsg);
      }
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
          maxWidth: '600px',
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
                value={lessonPlan.start_date || ''}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f9fafb',
                  cursor: 'not-allowed',
                  color: '#000000'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                End Date
              </label>
              <input
                type="date"
                value={lessonPlan.end_date || ''}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f9fafb',
                  cursor: 'not-allowed',
                  color: '#000000'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#374151' }}>
              Select Equipment Type (One Item Will Be Automatically Assigned)
            </label>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px',
              backgroundColor: '#ffffff'
            }}>
              {availableFleetItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  No equipment fleets available for this lesson
                </p>
              ) : (
                availableFleetItems.map((fleet) => (
                  <div
                    key={fleet.fleetSerial}
                    onClick={() => setSelectedFleet(fleet.fleetSerial)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      margin: '4px 0',
                      backgroundColor: selectedFleet === fleet.fleetSerial ? '#dbeafe' : '#f9fafb',
                      border: selectedFleet === fleet.fleetSerial ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      checked={selectedFleet === fleet.fleetSerial}
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
            
            {nextAvailableItem && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
                  Next Available Item:
                </div>
                <div style={{ fontSize: '13px', color: '#374151' }}>
                  {nextAvailableItem.serial_number} - {nextAvailableItem.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Location: {nextAvailableItem.location || 'Not specified'}
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
              disabled={loading || !selectedFleet || !nextAvailableItem}
              style={{
                padding: '12px 24px',
                backgroundColor: loading || !selectedFleet || !nextAvailableItem ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || !selectedFleet || !nextAvailableItem ? 'not-allowed' : 'pointer'
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

export default AutoEquipmentRequestModal;