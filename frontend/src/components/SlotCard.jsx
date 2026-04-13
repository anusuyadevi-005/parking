import React from 'react';

const SlotCard = ({ slot, onBook }) => {
  return (
    <div className="glass-panel slot-card">
      <div className="slot-header">
        <div className="slot-number">{slot.slotNumber}</div>
        <span className={`badge ${slot.isAvailable ? 'badge-available' : 'badge-full'}`}>
          {slot.isAvailable ? 'Available' : 'Booked'}
        </span>
      </div>
      
      <div className="slot-location">
        <span>📍 {slot.location === 'FUNMALL' ? 'Fun Mall Main Parking' : 'Nearby Alternative Parking'}</span>
      </div>

      <button 
        className={`btn ${slot.isAvailable ? 'btn-primary' : 'btn-outline'}`}
        disabled={!slot.isAvailable}
        onClick={() => onBook(slot)}
        style={{ width: '100%', marginTop: 'auto' }}
      >
        {slot.isAvailable ? 'Book This Slot' : 'Slot Unavailable'}
      </button>
    </div>
  );
};

export default SlotCard;
