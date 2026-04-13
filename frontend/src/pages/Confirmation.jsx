import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingInfo = location.state?.bookingInfo;

  if (!bookingInfo) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>No Booking Found</h2>
        <p>Please go back to the home page and select a slot to book.</p>
        <button className="btn btn-outline" onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
          Back to Home
        </button>
      </div>
    );
  }

  const startDate = new Date(bookingInfo.startTime).toLocaleString();
  const endDate = new Date(bookingInfo.endTime).toLocaleString();

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontSize: '2.5rem' }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
          Your parking slot has been successfully reserved.
        </p>
      </div>

      <div className="key-display-box">
        <label className="form-label">Your Unique Entry Key</label>
        <div className="key-value">{bookingInfo.uniqueKey}</div>
        <div style={{ 
          marginTop: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          color: 'var(--success)',
          fontSize: '0.9rem',
          fontWeight: '600',
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '0.5rem 1rem',
          borderRadius: '20px'
        }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
          SMS & App Notification Sent
        </div>
        <p style={{ color: 'var(--warning)', fontSize: '0.9rem', marginTop: '1rem' }}>
          ⚠️ Save this key! You will need it to enter the parking lot. Do not share it.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Slot Details</label>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
            {bookingInfo.slotNumber}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {bookingInfo.location === 'FUNMALL' ? 'Fun Mall Main Parking' : 
             bookingInfo.location === 'SCHOOL' ? 'School Overflow Parking' : 
             bookingInfo.location === 'COLLEGE' ? 'College Overflow Parking' : 'Alternative Parking'}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Time</label>
          <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--success)' }}>In:</span> {startDate}
          </div>
          <div style={{ fontWeight: '500', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--danger)' }}>Out:</span> {endDate}
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        borderRadius: '12px', 
        background: 'rgba(59, 130, 246, 0.1)', 
        border: '1px solid rgba(59, 130, 246, 0.2)',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Amount Paid: </span>
        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>${bookingInfo.totalAmount?.toFixed(2)}</span>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          Return to Home
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/simulation', { state: { slot: bookingInfo.slotNumber, key: bookingInfo.uniqueKey, parkLocation: bookingInfo.location } })}
        >
          Try Simulation
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
