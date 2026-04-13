import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  CheckCircle, 
  Clock, 
  LogOut, 
  Settings, 
  ShoppingBag,
  CreditCard,
  Key
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    history: 0
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/booking/all-bookings');
        if (res.data && res.data.success) {
          const bookings = res.data.data;
          setStats({
            total: bookings.length,
            active: bookings.filter(b => b.status === 'ACTIVE').length,
            history: bookings.filter(b => b.status === 'COMPLETED').length
          });
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }
    };
    fetchUserStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return <div className="loader-container"><div className="spinner"></div></div>;

  const getInitials = (name) => {
     return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {getInitials(user.name)}
        </div>
        <div className="profile-title-section">
          <div className="profile-status-badge">
            <CheckCircle size={14} /> Ready to Park
          </div>
          <h1>{user.name}</h1>
          <p className="text-muted">Member since {new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="profile-grid-container">
        <div className="info-section">
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <User size={20} className="text-primary" /> Personal Information
            </h3>
            <div className="info-group">
              <div className="info-item">
                <span className="info-item-label">Full Name</span>
                <span className="info-item-value">{user.name}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Username</span>
                <span className="info-item-value">@{user.username}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Phone Number</span>
                <span className="info-item-value">{user.phone || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">License Number</span>
                <span className="info-item-value">{user.licenseNumber}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Car size={20} className="text-accent" /> Vehicle Details
            </h3>
            <div className="info-group">
              <div className="info-item">
                <span className="info-item-label">Model</span>
                <span className="info-item-value">{user.vehicleModel}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Number Plate</span>
                <span className="info-item-value" style={{ letterSpacing: '2px', fontWeight: '800' }}>
                  {user.numberPlate}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-stats-panel">
          <div className="stat-mini-card">
            <div className="stat-mini-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)' }}>
              <ShoppingBag size={24} />
            </div>
            <div className="stat-mini-info">
              <span className="stat-mini-count">{stats.total}</span>
              <span className="stat-mini-label">Total Bookings</span>
            </div>
          </div>

          <div className="stat-mini-card">
            <div className="stat-mini-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
              <Clock size={24} />
            </div>
            <div className="stat-mini-info">
              <span className="stat-mini-count">{stats.active}</span>
              <span className="stat-mini-label">Active Parking</span>
            </div>
          </div>

          <div className="stat-mini-card">
            <div className="stat-mini-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent)' }}>
              <CreditCard size={24} />
            </div>
            <div className="stat-mini-info">
              <span className="stat-mini-count">Level 1</span>
              <span className="stat-mini-label">Member Tier</span>
            </div>
          </div>

          <button className="btn btn-outline" style={{ marginTop: 'auto', width: '100%' }} onClick={() => navigate('/bookings')}>
             View All Activity
          </button>
        </div>
      </div>

      <div className="profile-actions">
        <button className="btn btn-primary">
          <Settings size={18} /> Edit Profile
        </button>
        <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
