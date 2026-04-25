import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { LayoutDashboard, Users, ClipboardList, Settings, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [bookingsRes, slotsRes, statsRes] = await Promise.all([
        API.get('/booking/all-bookings'),
        API.get('/booking/slots'),
        API.get('/booking/stats')
      ]);
      setBookings(bookingsRes.data.data);
      setSlots(slotsRes.data.data);
      setStats(statsRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSlotStatus = async (slotId, currentStatus) => {
    // In a real app, we'd have a specific endpoint. 
    // For now, let's assume we can update slot status.
    alert('Slot management feature coming soon! (Endpoint needed)');
  };

  if (loading) return <div className="loader">Loading Admin Panel...</div>;

  return (
    <div className="admin-layout animate-fade-in">
      <div className="admin-sidebar">
        <div className="admin-brand">SmartPark Admin</div>
        <div className="admin-nav">
          <div className="admin-nav-item active"><LayoutDashboard size={20} /> Overview</div>
          <div className="admin-nav-item"><ClipboardList size={20} /> Manage Bookings</div>
          <div className="admin-nav-item"><Users size={20} /> Users</div>
          <div className="admin-nav-item"><Settings size={20} /> Settings</div>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header">
           <h1>System Overview</h1>
           <div className="admin-user-badge">Admin Mode</div>
        </header>

        <div className="admin-stats-grid">
           <div className="admin-stat-card">
              <div className="stat-label">Total Reservations</div>
              <div className="stat-value">{stats.totalBookings}</div>
           </div>
           <div className="admin-stat-card">
              <div className="stat-label">Total Slots</div>
              <div className="stat-value">{stats.totalSlots}</div>
           </div>
           <div className="admin-stat-card">
              <div className="stat-label">Current Occupancy</div>
              <div className="stat-value">{stats.occupancy}%</div>
           </div>
        </div>

        <div className="admin-content-section">
           <div className="section-header">
              <h2>Recent Reservations</h2>
              <button className="btn-small">View All</button>
           </div>
           <table className="admin-table">
              <thead>
                 <tr>
                    <th>User / Key</th>
                    <th>Slot</th>
                    <th>Time</th>
                    <th>Status</th>
                 </tr>
              </thead>
              <tbody>
                 {bookings.slice(0, 8).map(b => (
                    <tr key={b._id}>
                       <td>
                          <div className="table-main-text">{b.drivingLicense}</div>
                          <div className="table-sub-text">{b.uniqueKey}</div>
                       </td>
                       <td>{b.slotId?.slotNumber || 'N/A'}</td>
                       <td>{new Date(b.startTime).toLocaleTimeString()}</td>
                       <td>
                          <span className={`status-pill ${b.status.toLowerCase()}`}>
                             {b.status}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        <div className="admin-content-section">
           <div className="section-header">
              <h2>Slot Management</h2>
           </div>
           <div className="admin-slot-grid">
              {slots.map(s => (
                 <div key={s._id} className={`admin-slot-card ${s.isAvailable ? 'available' : 'occupied'}`}>
                    <span>{s.slotNumber}</span>
                    {s.isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
