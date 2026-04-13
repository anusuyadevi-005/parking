import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Landmark, ParkingSquare } from 'lucide-react';

const Dashboard = () => {
  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState({
    totalSlots: 0,
    freeSlots: 0,
    occupancy: 0,
    locations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchData = React.useCallback(async () => {
    try {
      const [slotsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/booking/slots'),
        axios.get('http://localhost:5000/api/booking/stats')
      ]);

      if (slotsRes.data && slotsRes.data.data) {
        setSlots(slotsRes.data.data);
      }
      if (statsRes.data && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      if (slots.length === 0) {
        setError('Connection lost. Retrying...');
      }
      setLoading(false);
    }
  }, [slots.length]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleBook = () => {
    navigate('/book');
  };

  const funMallSlots = slots.filter(s => s.location === 'FUNMALL');
  
  const getSlotStatus = (label) => {
    const actualSlot = funMallSlots.find(s => s.slotNumber === label);
    if (actualSlot) return actualSlot.isAvailable ? 'available' : 'occupied';
    return 'occupied'; // Default to occupied if not in DB
  };

  const rowA = Array.from({ length: 12 }, (_, i) => `A${i + 1}`);
  const rowB = Array.from({ length: 12 }, (_, i) => `B${i + 1}`);
  const rowC = Array.from({ length: 10 }, (_, i) => `C${i + 1}`);

  if (loading && slots.length === 0) {
    return (
      <div className="loader-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const alternativeLocations = stats.locations?.filter(loc => !loc.isMain) || [];

  const locationState = location.state;
  const searchLocation = locationState?.search || '';

  return (
    <div className="dashboard-layout animate-fade-in">
      <div className="dashboard-main">
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        
        {searchLocation && (
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            padding: '1rem', 
            borderRadius: '12px', 
            marginBottom: '1.5rem',
            border: '1px solid var(--primary-glow)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Showing results for: <strong>{searchLocation}</strong></span>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard', { state: {} })}>Clear View</button>
          </div>
        )}

        <div className="dashboard-header">
          <div className="header-title-box">
            <div className="capacity-badge">
              <div className="capacity-dot" style={{ backgroundColor: stats.occupancy > 80 ? '#ef4444' : '#10b981' }}></div>
              {stats.occupancy > 80 ? 'NEAR CAPACITY' : 'OPTIMAL CAPACITY'}
            </div>
            <h1 className="dashboard-title">Mall Center<br/>Parking</h1>
            <p className="dashboard-subtitle">
              Real-time availability dashboard &<br/>management
            </p>
          </div>
          
          <div className="dashboard-stats">
            <div className="stat-card wide">
              <div className="stat-title">Total Slots</div>
              <div className="stat-value">{stats.totalSlots}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Free Slots</div>
              <div className="stat-value blue">
                {stats.freeSlots}
                <span className="stat-change negative">LIVE SYNC</span>
              </div>
            </div>
            <div className="stat-card wide">
              <div className="stat-title">Occupancy</div>
              <div className="stat-value">
                {stats.occupancy}%
                <span className="stat-change positive">DYNAMIC</span>
              </div>
            </div>
          </div>
        </div>

        <div className="floor-plan-section">
          <div className="floor-plan-header">
            <div className="floor-plan-title">Live Floor Plan</div>
            <div className="floor-plan-legend">
              <div className="legend-item">
                <div className="legend-box available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-box occupied"></div>
                <span>Occupied</span>
              </div>
            </div>
          </div>
          
          <div className="floor-plan-container">
            <div className="slot-row">
              {rowA.map(slot => {
                const status = getSlotStatus(slot);
                return (
                  <div key={slot} className={`parking-slot ${status}`}>
                    {status === 'occupied' ? '🚗' : slot}
                  </div>
                );
              })}
            </div>
            <div className="row-divider"></div>
            <div className="slot-row">
              {rowB.map(slot => {
                const status = getSlotStatus(slot);
                return (
                  <div key={slot} className={`parking-slot ${status}`}>
                    {status === 'occupied' ? '🚗' : slot}
                  </div>
                );
              })}
            </div>
            <div className="slot-row" style={{ marginTop: '0.25rem' }}>
              {rowC.map(slot => {
                const status = getSlotStatus(slot);
                return (
                  <div key={slot} className={`parking-slot ${status}`}>
                    {status === 'occupied' ? '🚗' : slot}
                  </div>
                );
              })}
            </div>
            <button className="reserve-btn" onClick={handleBook}>
              Reserve Slot Now
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-sidebar">
        <h2 className="sidebar-title">Nearby Alternatives</h2>
        <p className="sidebar-subtitle">Live availability across our parking network</p>
        
        <div className="alternatives-list">
          {alternativeLocations.length > 0 ? alternativeLocations.map(loc => (
            <div key={loc.name} className="alternative-card">
              <div className="alt-icon-box" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                {loc.name.includes('Garage') ? <Landmark size={20} /> : <ParkingSquare size={20} />}
              </div>
              <div className="alt-details">
                <div className="alt-name">{loc.fullName}</div>
                <div className="alt-distance">Real-time dynamic data</div>
              </div>
              <div className="alt-stats">
                <div className="alt-free">{loc.free} Free</div>
                <div className="alt-price">ACTIVE</div>
              </div>
            </div>
          )) : (
            <div style={{ color: '#6B7280', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
              No nearby alternatives listed in database.
            </div>
          )}
        </div>

        <div className="support-card">
          <div className="support-title">Need help?</div>
          <div className="support-desc">
            Contact mall security or check our automated valet options for priority access.
          </div>
          <button className="support-btn" onClick={() => window.open('tel:1234567890')}>
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
