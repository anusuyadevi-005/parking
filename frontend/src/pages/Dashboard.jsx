import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStations } from '../services/api';

const Dashboard = () => {
  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState({
    totalSlots: 0,
    freeSlots: 0,
    occupancy: 0,
    totalStations: 0,
    onlineStations: 0,
    locations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchData = React.useCallback(async () => {
    try {
      const stationsRes = await getStations();

      if (stationsRes.data && stationsRes.data.data) {
        const stationsData = stationsRes.data.data.stations || [];
        setStations(stationsData);

        const totalSlots = stationsData.reduce((sum, station) => sum + station.slot_count, 0);
        const freeSlots = stationsData.reduce((sum, station) => sum + station.free_count, 0);
        const totalStations = stationsData.length;
        const onlineStations = stationsData.filter((station) => station.status === 'online').length;

        setStats((prev) => ({
          ...prev,
          totalSlots,
          freeSlots,
          occupancy: totalSlots > 0 ? Math.round((1 - freeSlots / totalSlots) * 100) : 0,
          totalStations,
          onlineStations,
        }));
      }

      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      if (stations.length === 0) {
        setError('Connection lost. Retrying...');
      }
      setLoading(false);
    }
  }, [stations.length]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && stations.length === 0) {
    return (
      <div className="loader-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const locationState = location.state;
  const searchLocation = locationState?.search || '';

  return (
    <div className="dashboard-layout animate-fade-in">
      <div className="dashboard-main">
        {error && <div className="alert alert-error">{error}</div>}

        {searchLocation && (
          <div className="search-results-banner">
            <span>
              Showing results for: <strong>{searchLocation}</strong>
            </span>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard', { state: {} })}>
              Clear View
            </button>
          </div>
        )}

        <div className="dashboard-header">
          <div className="header-title-box">
            <div className="capacity-badge">
              <div
                className="capacity-dot"
                style={{ backgroundColor: stats.occupancy > 80 ? '#a14644' : '#2e7d5b' }}
              ></div>
              {stats.occupancy > 80 ? 'Near Capacity' : 'Optimal Capacity'}
            </div>
            <h1 className="dashboard-title">SmartPark Dashboard</h1>
            <p className="dashboard-subtitle">
              A live command view of station health, slot availability, and overall occupancy.
            </p>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card wide">
              <div className="stat-title">Total Stations</div>
              <div className="stat-value">{stats.totalStations}</div>
            </div>
            <div className="stat-card wide">
              <div className="stat-title">Online</div>
              <div className="stat-value blue">{stats.onlineStations}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Free Slots</div>
              <div className="stat-value blue">
                {stats.freeSlots}
                <span className="stat-change negative">Live Sync</span>
              </div>
            </div>
            <div className="stat-card wide">
              <div className="stat-title">Occupancy</div>
              <div className="stat-value">
                {stats.occupancy}%
                <span className="stat-change positive">Dynamic</span>
              </div>
            </div>
          </div>
        </div>

        <div className="floor-plan-section">
          <div className="floor-plan-header">
            <div className="floor-plan-title">Live Station Map</div>
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

          {stations.length > 0 ? (
            <div className="stations-container">
              {stations.map((station) => (
                <div key={station.station_id} className="station-card">
                  <div className="station-header">
                    <div className="station-info">
                      <h3 className="station-name">{station.name}</h3>
                      <span className={`station-status ${station.status}`}>
                        <span className={`status-dot ${station.status}`}></span>
                        {station.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="station-stats">
                      <span>{station.free_count}/{station.slot_count} available</span>
                      <span>{station.occupancy_percent}% occupied</span>
                    </div>
                  </div>

                  <div className="station-slots-grid">
                    {station.slots.map((slot) => {
                      const status = slot.isAvailable ? 'available' : 'occupied';
                      return (
                        <div
                          key={slot.slot_index}
                          className={`parking-slot ${status}`}
                          title={`Slot ${slot.slotNumber}: ${status}`}
                        >
                          {status === 'occupied' ? 'Busy' : slot.slotNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-stations-message">
              <div className="empty-state">
                <h2>No Parking Stations Registered</h2>
                <p>ESP32 nodes will automatically register when they connect to the network.</p>
                <p>
                  Make sure your ESP32 firmware calls <code>POST /api/register-node</code> on boot.
                </p>
              </div>
            </div>
          )}

          {stations.length > 0 && (
            <button className="reserve-btn" onClick={() => navigate('/book')}>
              Reserve Slot Now
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-sidebar">
        <h2 className="sidebar-title">System Overview</h2>
        <p className="sidebar-subtitle">ESP32 network status in one glance.</p>

        <div className="support-card">
          <div className="support-title">Station Health</div>
          <div className="support-desc">
            {stats.onlineStations} of {stats.totalStations} stations are currently online.
          </div>
          <div className="support-meta">
            Total Capacity: {stats.totalSlots} slots
            <br />
            Available Right Now: {stats.freeSlots} slots
          </div>
        </div>

        <div className="support-card">
          <div className="support-title">Need help?</div>
          <div className="support-desc">
            Reach the support desk or route drivers to overflow parking when demand spikes.
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
