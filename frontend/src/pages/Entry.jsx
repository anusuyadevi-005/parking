import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getStations, verifyToken as verifyNodeToken } from '../services/api';

const Entry = () => {
  const [uniqueKey, setUniqueKey] = useState('');
  const [status, setStatus] = useState(null); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [entryData, setEntryData] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const navigate = useNavigate();

  // Fetch registered ESP32 stations on mount so the user can pick which gate they're at
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await getStations();
        const stationsData = res.data?.data?.stations || [];
        setStations(stationsData);
        if (stationsData.length > 0) {
          setSelectedNodeId(stationsData[0].node_id);
        }
      } catch (err) {
        console.error('Failed to load stations:', err);
      }
    };
    fetchStations();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!uniqueKey.trim()) return;

    setStatus('loading');
    setMessage('');
    setEntryData(null);

    try {
      // If a station is selected, use the node-scoped verify endpoint
      if (selectedNodeId) {
        const res = await verifyNodeToken(selectedNodeId, uniqueKey.trim());
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'Access granted');
          setEntryData({
            slotNumber: res.data.data?.slotNumber,
            location: 'FUNMALL',
            vehicleNumber: res.data.data?.vehicleNumber,
          });
          return;
        }
      }

      // Fallback to legacy booking verification
      const res = await axios.post('http://localhost:5000/api/booking/verify', { uniqueKey: uniqueKey.trim() });
      if (res.data.success) {
        setStatus('success');
        setMessage(res.data.message);
        setEntryData(res.data.data);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Gate <span className="gradient-text">Verification</span></h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Enter your unique key to open the gate and proceed to your slot.
        </p>
      </div>

      {stations.length > 0 && (
        <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Select Gate Station</label>
          <select
            className="form-input"
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            style={{ padding: '0.75rem', fontSize: '1rem' }}
          >
            {stations.map(s => (
              <option key={s.node_id} value={s.node_id}>
                {s.name} ({s.status === 'online' ? 'Online' : 'Offline'}) — {s.free_count}/{s.slot_count} free
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleVerify} style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ textAlign: 'left' }}>
          <label className="form-label" style={{ textAlign: 'center' }}>Enter Alphanumeric Key</label>
          <input
            type="text"
            className="form-input"
            value={uniqueKey}
            onChange={(e) => setUniqueKey(e.target.value.toUpperCase())}
            placeholder="e.g. A7F9K2X"
            style={{
              fontSize: '2rem',
              textAlign: 'center',
              letterSpacing: '0.2em',
              fontFamily: 'monospace',
              padding: '1.5rem'
            }}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Verifying...' : 'Verify & Open Gate'}
        </button>
      </form>

      {status === 'success' && (
        <div className="alert alert-success animate-fade-in" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{message}</h3>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '1.5rem',
            borderRadius: '12px',
            width: '100%',
            marginTop: '1rem'
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {entryData?.location === 'FUNMALL' ? 'Proceed to Slot' : 'Park Anywhere in Zone'}
            </p>
            <div style={{ fontSize: '3.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>
              {entryData?.slotNumber}
            </div>
            <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>
              {entryData?.location === 'FUNMALL' ? 'Fun Mall Main Parking' :
               entryData?.location === 'SCHOOL' ? 'School Overflow Area' :
               entryData?.location === 'COLLEGE' ? 'College Overflow Area' : 'Alternative Parking'}
            </p>
            <button
              className="btn btn-outline"
              style={{ marginTop: '1.5rem', width: '100%' }}
              onClick={() => {
                navigate('/simulation', { state: { slot: entryData?.slotNumber, key: uniqueKey, parkLocation: entryData?.location } });
              }}
            >
              See Simulation
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="alert alert-error animate-fade-in" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>❌</span> {message}
        </div>
      )}

    </div>
  );
};

export default Entry;
