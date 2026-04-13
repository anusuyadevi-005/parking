import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CarFront, LayoutGrid, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedSlot, setSelectedSlot] = useState(location.state?.preferredSlot?.slotNumber || '');
  const [dbSlots, setDbSlots] = useState([]);
  
  const [formData, setFormData] = useState({
    vehicleNumber: user?.numberPlate || '',
    drivingLicense: user?.licenseNumber || '',
    carModel: user?.vehicleModel || '',
    reservationDate: new Date().toISOString().split('T')[0],
    timeFrom: (() => {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    })(),
    timeTo: (() => {
      const now = new Date();
      now.setHours(now.getHours() + 2);
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    })()
  });

  const fetchSlots = React.useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/booking/slots');
      if (res.data.success) {
        setDbSlots(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    // High-frequency polling (5s) for the booking grid to prevent double-booking
    const interval = setInterval(fetchSlots, 5000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Calculate duration
  const getDurationHours = () => {
    if (!formData.timeFrom || !formData.timeTo) return 0;
    const [h1, m1] = formData.timeFrom.split(':').map(Number);
    const [h2, m2] = formData.timeTo.split(':').map(Number);
    let diff = (h2 + m2/60) - (h1 + m1/60);
    if (diff <= 0) diff = 1; // minimum 1 hr if invalid or overnight
    return diff;
  };

  const durationStr = getDurationHours().toFixed(1).replace('.0', '');
  const ratePerHour = 5.00;
  const convenienceFee = 0.75;
  const total = (getDurationHours() * ratePerHour) + convenienceFee;

  const renderSlot = (slot) => {
    const isSelected = selectedSlot === slot.id;
    let cls = `book-slot ${slot.status}`;
    if (isSelected) cls = 'book-slot selected';

    return (
      <div 
        key={slot.id} 
        className={cls}
        onClick={() => handleSlotClick(slot.id, slot.status)}
        style={{ fontSize: slot.status === 'occupied' ? '1.2rem' : '0.8rem' }}
      >
        {slot.status === 'ev' ? <Zap size={18} className="lightning" /> : (slot.status === 'occupied' ? '🚗' : slot.id)}
      </div>
    );
  };

  const isMallFull = dbSlots.filter(s => s.location === 'FUNMALL').every(s => !s.isAvailable);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot && !isMallFull) {
      setError('Please select a parking slot first.');
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
        time: formData.timeFrom,
        durationHours: getDurationHours(),
        slotPreference: selectedSlot
      };

      const res = await axios.post('http://localhost:5000/api/booking/create', payload);
      if (res.data.success) {
        navigate('/confirmation', { state: { bookingInfo: res.data.data } });
      } else {
        setError(res.data.message || 'Booking failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during booking.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slotId, status) => {
    if (status !== 'occupied') {
      setSelectedSlot(slotId);
    }
  };

  const getSlotStatus = (id) => {
    const actual = dbSlots.find(s => s.slotNumber === id);
    if (actual) {
      return actual.isAvailable ? 'available' : 'occupied';
    }
    if (id.startsWith('EV')) return 'ev';
    return 'occupied';
  };

  const row1 = ['A1', 'A2', 'A3', 'A4', 'A5', 'EV1', 'A7', 'A8', 'A9'].map(id => ({ id, status: getSlotStatus(id) }));
  const row2 = ['A10', 'B1', 'B2', 'B3', 'B4', 'B5', 'EV2'].map(id => ({ id, status: getSlotStatus(id) }));

  const overflowSurcharge = isMallFull ? 10.00 : 0;
  const finalTotal = total + overflowSurcharge;

  return (
    <div className="booking-page-container animate-fade-in">
      <div className="booking-header">
        <h1 className="booking-title">Reserve Your Space</h1>
        <p className="booking-subtitle">Quick, secure, and contactless parking reservations.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      
      {isMallFull && (
        <div className="alert alert-warning animate-fade-in" style={{ marginBottom: '2rem', borderLeft: '4px solid #f59e0b', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🚫</span>
            <div>
              <strong style={{ fontSize: '1.2rem', display: 'block' }}>Mall Center Parking is FULL</strong>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '0.2rem' }}>
                We cannot accommodate more vehicles in the main basement. 
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Nearby Alternatives Available:</p>
            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', color: '#fcd34d' }}>
              <li>Public School Overflow (200m)</li>
              <li>Engineering College Plot (450m)</li>
            </ul>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: '800' }}
            onClick={() => navigate('/overflow-book')}
          >
            View & Book Nearby Parking <ArrowRight size={18} />
          </button>
        </div>
      )}

      <div className="booking-content">
        <form className="booking-forms" onSubmit={handleSubmit} id="bookingForm">
          {/* Card 1: Vehicle Details */}
          <div className="booking-card">
            <div className="booking-card-header">
              <CarFront size={20} className="booking-card-icon" />
              Vehicle Details
            </div>
            <div className="booking-form-grid">
              <div className="form-group">
                <label className="form-label">Vehicle Number</label>
                <input 
                  type="text" 
                  className="booking-input" 
                  name="vehicleNumber"
                  placeholder="e.g. ABC-1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Driving License</label>
                <input 
                  type="text" 
                  className="booking-input" 
                  name="drivingLicense"
                  placeholder="DL-XXXX-XXXX"
                  value={formData.drivingLicense}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Car Model</label>
                <select 
                  className="booking-input" 
                  name="carModel"
                  value={formData.carModel}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select your car model</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Truck">Truck</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Select Parking Slot */}
          <div className="booking-card">
            <div className="booking-card-header">
              <LayoutGrid size={20} className="booking-card-icon" />
              Select Parking Slot
            </div>
            
            <div className="slot-legend">
              <div className="slot-legend-item">
                <div className="slot-legend-dot" style={{ backgroundColor: '#4B5563' }}></div>
                Available
              </div>
              <div className="slot-legend-item">
                <div className="slot-legend-dot" style={{ backgroundColor: '#3B82F6' }}></div>
                Selected
              </div>
              <div className="slot-legend-item">
                <div className="slot-legend-dot" style={{ backgroundColor: '#374151' }}></div>
                Occupied
              </div>
              <div className="slot-legend-item">
                <div className="slot-legend-dot" style={{ border: '1px solid #10B981', backgroundColor: 'transparent' }}></div>
                EV Only
              </div>
            </div>

            <div className="slot-grid-inner" style={{ marginBottom: '0.75rem' }}>
              {row1.map(renderSlot)}
            </div>
            <div className="slot-grid-inner">
              {row2.map(renderSlot)}
            </div>
          </div>

          {/* Card 3: Date & Time */}
          <div className="booking-card">
            <div className="booking-card-header">
              <Clock size={20} className="booking-card-icon" />
              Date & Time
            </div>
            
            <div className="booking-form-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Reservation Date</label>
                <input 
                  type="date" 
                  className="booking-input" 
                  name="reservationDate"
                  value={formData.reservationDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">From</label>
                <input 
                  type="time" 
                  className="booking-input" 
                  name="timeFrom"
                  value={formData.timeFrom}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">To</label>
                <input 
                  type="time" 
                  className="booking-input" 
                  name="timeTo"
                  value={formData.timeTo}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
          </div>
        </form>

        <div className="booking-sidebar">
          {/* Summary Card */}
          <div className="summary-card">
            <h2 className="summary-title">Booking Summary</h2>
            
            <div className="summary-row">
              <span className="summary-label">Selected Slot</span>
              <span className="summary-value" style={{ color: '#fff' }}>
                {selectedSlot || 'None'} {selectedSlot.startsWith('EV') ? '(EV)' : '(Floor 1)'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Rate per hour</span>
              <span className="summary-value">${ratePerHour.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Duration</span>
              <span className="summary-value">{durationStr} Hours</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Convenience Fee</span>
              <span className="summary-value">${convenienceFee.toFixed(2)}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-total">
              <span className="summary-label">Total Price</span>
              <span className="summary-total-price">${total.toFixed(2)}</span>
            </div>
            
            <button type="submit" form="bookingForm" className="book-btn" disabled={loading}>
              {loading ? 'Processing...' : (
                <>
                  Book Now <ArrowRight size={20} />
                </>
              )}
            </button>
            <p className="terms-text">
              By clicking 'Book Now', you agree to our<br/>terms of service and parking policies.
            </p>
          </div>

          {/* Location Card */}
          <div className="location-card">
            <div className="pin-icon">
              <div className="pin-icon-inner">P</div>
            </div>
            <div className="loc-title">Downtown Multi-Storey</div>
            <div className="loc-subtitle">456 Parking Avenue, Metropolis</div>
          </div>
        </div>
      </div>

      <div className="booking-footer">
        <div className="footer-left">
          <ShieldCheck size={18} className="footer-shield" />
          Secured by ParkSmart Cloud © 2024
        </div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Support</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </div>
  );
};

export default Booking;
