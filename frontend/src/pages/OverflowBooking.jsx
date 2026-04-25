import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { School, Landmark, CarFront, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OverflowBooking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(''); // 'SCHOOL' or 'COLLEGE'
  
  const [formData, setFormData] = useState({
    vehicleNumber: user?.numberPlate || '',
    drivingLicense: user?.licenseNumber || '',
    carModel: user?.vehicleModel || '',
    reservationDate: new Date().toISOString().split('T')[0],
    durationHours: 2
  });

  const locations = [
    {
      id: 'SCHOOL',
      name: 'Public School Overflow',
      icon: <School size={32} />,
      distance: '200m away',
      price: '$15.00',
      totalCost: 15.00,
      description: 'Main gate entry only. Secured school grounds parking area.'
    },
    {
      id: 'COLLEGE',
      name: 'Engineering College Plot',
      icon: <Landmark size={32} />,
      distance: '450m away',
      price: '$12.00',
      totalCost: 12.00,
      description: 'Open campus parking with security surveillance.'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError('Please select a parking location first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        drivingLicense: formData.drivingLicense,
        vehicleModel: formData.carModel,
        numberPlate: formData.vehicleNumber,
        date: formData.reservationDate,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        durationHours: formData.durationHours,
        locationPreference: selectedLocation
      };

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/booking/create`, payload);
      if (res.data.success) {
        navigate('/confirmation', { state: { bookingInfo: res.data.data } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page-container animate-fade-in" style={{ paddingBottom: '5rem' }}>
      <div className="booking-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="booking-title">Alternative <span className="gradient-text">Overflow</span> Parking</h1>
        <p className="booking-subtitle">Primary parking is full. Please select a nearby secured location.</p>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {error && <div className="alert alert-error" style={{ marginBottom: '2rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          {locations.map(loc => (
            <div 
              key={loc.id} 
              className={`glass-panel overflow-card ${selectedLocation === loc.id ? 'active' : ''}`}
              onClick={() => setSelectedLocation(loc.id)}
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: selectedLocation === loc.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ color: selectedLocation === loc.id ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {loc.icon}
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{loc.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{loc.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px' }}>{loc.distance}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>{loc.price}</span>
              </div>

              {selectedLocation === loc.id && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--primary)' }}>
                  <CheckCircle2 size={24} />
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Vehicle Registration Number</label>
              <input 
                type="text" 
                className="booking-input" 
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                placeholder="e.g. TN-01-AB-1234"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (Hours)</label>
              <input 
                type="number" 
                className="booking-input" 
                value={formData.durationHours}
                onChange={(e) => setFormData({...formData, durationHours: parseInt(e.target.value)})}
                min="1"
                required 
              />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selected Location Fee</p>
              <h2 style={{ fontSize: '2rem' }}>{selectedLocation ? (locations.find(l => l.id === selectedLocation).price) : '$0.00'}</h2>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}
              disabled={loading || !selectedLocation}
            >
              {loading ? 'Processing...' : 'Confirm & Pay'} <ArrowRight size={20} style={{ marginLeft: '10px' }} />
            </button>
          </div>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
          * These locations feature Main Gate verification only. No individual slot numbers are assigned. Simply show your unique key at the entrance.
        </p>
      </div>

      <style>{`
        .overflow-card:hover {
          background: rgba(255,255,255,0.03);
          transform: translateY(-5px);
        }
        .overflow-card.active {
          background: rgba(59, 130, 246, 0.05);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};

export default OverflowBooking;
