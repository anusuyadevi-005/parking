import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CarFront, LayoutGrid, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStations } from '../services/api';

const formatLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(location.state?.preferredSlot?.slotNumber || '');
  const [stations, setStations] = useState([]);

  const [formData, setFormData] = useState({
    vehicleNumber: user?.numberPlate || '',
    drivingLicense: user?.licenseNumber || '',
    carModel: user?.vehicleModel || '',
    reservationDate: formatLocalDate(),
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
      const res = await getStations();
      if (res.data.success) {
        setStations(res.data.data.stations || []);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 2000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  useEffect(() => {
    if (!selectedSlot) return;

    const selectedStillAvailable = stations.some((station) =>
      station.slots.some((slot) => slot.slotNumber === selectedSlot && slot.isAvailable)
    );

    if (!selectedStillAvailable) {
      setSelectedSlot('');
      setError('That slot just became occupied. Please choose another available slot.');
    }
  }, [stations, selectedSlot]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getDurationHours = () => {
    if (!formData.timeFrom || !formData.timeTo) return 0;
    const [h1, m1] = formData.timeFrom.split(':').map(Number);
    const [h2, m2] = formData.timeTo.split(':').map(Number);
    let diff = h2 + m2 / 60 - (h1 + m1 / 60);
    if (diff <= 0) diff = 1;
    return diff;
  };

  const durationHours = getDurationHours();
  const durationStr = durationHours.toFixed(1).replace('.0', '');
  const ratePerHour = 5;
  const convenienceFee = 0.75;
  const subtotal = durationHours * ratePerHour;
  const total = subtotal + convenienceFee;
  const isMallFull = stations.length > 0 && stations.every((station) => station.free_count === 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSlot && !isMallFull) {
      setError('Please select a parking slot first.');
      return;
    }

    if (selectedSlot) {
      const selectedStillAvailable = stations.some((station) =>
        station.slots.some((slot) => slot.slotNumber === selectedSlot && slot.isAvailable)
      );

      if (!selectedStillAvailable) {
        setError('Selected slot is no longer available. Please pick another slot.');
        return;
      }
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
        durationHours,
        slotPreference: selectedSlot
      };

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/booking/create`, payload);
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

  return (
    <div className="booking-page-container animate-fade-in">
      <div className="booking-header">
        <h1 className="booking-title">Reserve Your Space</h1>
        <p className="booking-subtitle">A cleaner, faster reservation flow for premium parking operations.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isMallFull && (
        <div className="alert alert-warning overflow-alert">
          <div className="overflow-header">
            <div className="overflow-icon">!</div>
            <div>
              <strong>Mall Center Parking is full</strong>
              <p>We cannot accommodate more vehicles in the main basement right now.</p>
            </div>
          </div>
          <div className="overflow-box">
            <p>Nearby alternatives available</p>
            <div className="overflow-options">
              <span>Public School Overflow (200m)</span>
              <span>Engineering College Plot (450m)</span>
            </div>
          </div>
          <button className="overflow-book-btn" onClick={() => navigate('/overflow-book')}>
            View Nearby Parking <ArrowRight size={18} />
          </button>
        </div>
      )}

      <div className="booking-content">
        <form className="booking-forms" onSubmit={handleSubmit} id="bookingForm">
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
              <div className="form-group full-width">
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

          <div className="booking-card">
            <div className="booking-card-header">
              <LayoutGrid size={20} className="booking-card-icon" />
              Select Parking Slot
            </div>

            <div className="slot-legend">
              <div className="slot-legend-item">
                <div className="slot-legend-dot available"></div>
                Available
              </div>
              <div className="slot-legend-item">
                <div className="slot-legend-dot selected"></div>
                Selected
              </div>
              <div className="slot-legend-item">
                <div className="slot-legend-dot occupied"></div>
                Occupied
              </div>
            </div>

            {stations.length === 0 ? (
              <div className="empty-state">
                <p>No parking stations are online yet. Connected ESP32 nodes will appear here automatically.</p>
              </div>
            ) : (
              stations.map((station) => (
                <div key={station.station_id} className="slot-station-group">
                  <div className="slot-station-meta">
                    <span>{station.name}</span>
                    <span className="slot-availability-pill">
                      <span className={`status-dot ${station.status}`}></span>
                      {station.status}
                    </span>
                    <span>{station.free_count}/{station.slot_count} free</span>
                  </div>
                  <div className="slot-grid-inner">
                    {station.slots.map((slot) => {
                      const isOccupied = !slot.isAvailable;
                      const isSelected = selectedSlot === slot.slotNumber;
                      let className = `book-slot ${isOccupied ? 'occupied' : 'available'}`;

                      if (isSelected) {
                        className = 'book-slot selected';
                      }

                      return (
                        <div
                          key={slot.slot_index}
                          className={className}
                          onClick={() => !isOccupied && setSelectedSlot(slot.slotNumber)}
                          style={{ cursor: isOccupied ? 'not-allowed' : 'pointer' }}
                          title={`Slot ${slot.slot_index}: ${isOccupied ? 'Occupied' : 'Available'}`}
                        >
                          {isOccupied ? 'Busy' : `S${slot.slot_index}`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="booking-card">
            <div className="booking-card-header">
              <Clock size={20} className="booking-card-icon" />
              Date & Time
            </div>

            <div className="booking-form-grid compact-time-grid">
              <div className="form-group">
                <label className="form-label">Reservation Date</label>
                <input
                  type="date"
                  className="booking-input"
                  name="reservationDate"
                  value={formData.reservationDate}
                  onChange={handleChange}
                  min={formatLocalDate()}
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
          <div className="summary-card">
            <h2 className="summary-title">Booking Summary</h2>

            <div className="summary-row">
              <span className="summary-label">Selected Slot</span>
              <span className="summary-value">
                {selectedSlot || 'Not selected'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Rate per hour</span>
              <span className="summary-value">${ratePerHour.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Duration</span>
              <span className="summary-value">{durationStr} hour{durationStr === '1' ? '' : 's'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Parking subtotal</span>
              <span className="summary-value">${subtotal.toFixed(2)}</span>
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
              By clicking Book Now, you agree to our terms of service and parking policies.
            </p>
          </div>

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
          Secured by SmartPark Cloud
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
