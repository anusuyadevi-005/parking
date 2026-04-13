import React, { useState, useEffect } from 'react';
import { Clock, MapPin, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/booking/all-bookings');
        if (res.data.success) {
          setBookings(res.data.data);
        } else {
          setError('Failed to load bookings.');
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Could not connect to server. Using demo data.');
        // Fallback mock data for visual demo if server is down
        setBookings([
          {
            _id: 'demo1',
            uniqueKey: 'DEMO-X9R',
            numberPlate: 'TN-01-AB-1234',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 7200000).toISOString(),
            durationHours: 2,
            status: 'BOOKED',
            slotId: { slotNumber: 'A4', location: 'FUNMALL' }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
    // Poll every 30 seconds for reservation history updates
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      month: months[d.getMonth()],
      day: d.getDate(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="loader-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="booking-page-container animate-fade-in" style={{ padding: '2.5rem 5%' }}>
      <div className="booking-header">
        <h1 className="booking-title">My Bookings</h1>
        <p className="booking-subtitle">Manage your recent and upcoming parking reservations.</p>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ maxWidth: '900px', margin: '0 auto 2rem auto', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="ticket-list" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
            <p>No parking reservations found.</p>
            <button 
              className="reserve-btn" 
              style={{ marginTop: '1.5rem' }}
              onClick={() => navigate('/book')}
            >
              Book Your First Slot
            </button>
          </div>
        ) : (
          bookings.map((booking) => {
            const start = formatDate(booking.startTime);
            const end = formatDate(booking.endTime);
            const isActive = booking.status === 'BOOKED' || booking.status === 'CHECKED_IN';
            
            return (
              <div className="ticket-card" key={booking._id}>
                <div className="ticket-left">
                  <div className="ticket-date-box">
                    <div className="ticket-date-month">{start.month}</div>
                    <div className="ticket-date-day">{start.day}</div>
                  </div>
                  <div className="ticket-details">
                    <div className="ticket-title">Slot {booking.slotId?.slotNumber || '---'} Parking</div>
                    <div className="ticket-meta">
                      <span><Clock size={16} /> {start.time} - {end.time} ({booking.durationHours}h)</span>
                      <span><MapPin size={16} /> {booking.slotId?.location === 'FUNMALL' ? 'Mall Center Parking' : 'Nearby Alternative'}</span>
                    </div>
                    <div className="ticket-meta" style={{ marginTop: '0.2rem' }}>
                      <span><KeyRound size={16} /> Key: <strong style={{ color: '#fff', letterSpacing: '1px' }}>{booking.uniqueKey}</strong></span>
                      <span style={{ marginLeft: '1rem' }}>🚘 {booking.numberPlate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="ticket-right">
                  <div className={`ticket-status ${isActive ? 'active' : 'completed'}`} 
                       style={!isActive ? { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#9CA3AF', borderColor: 'rgba(107, 114, 128, 0.3)' } : {}}>
                    {isActive ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div className="capacity-dot" style={{ backgroundColor: '#10B981' }}></div> 
                        {booking.status}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={14} /> {booking.status}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <button 
                      className="ticket-action" 
                      onClick={() => navigate('/entry', { state: { bookingKey: booking.uniqueKey } })}
                    >
                      Verify Entry
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Bookings;
