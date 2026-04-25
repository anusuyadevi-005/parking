import React, { useState, useEffect } from 'react';
import { getStations, exitToken as exitNodeToken } from '../services/api';
import API from '../services/api';

const Exit = () => {
  const [uniqueKey, setUniqueKey] = useState('');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [exitData, setExitData] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');

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

  const handleExit = async (e) => {
    e.preventDefault();
    if (!uniqueKey.trim()) return;

    setStatus('loading');
    setMessage('');
    setExitData(null);

    try {
      let res = null;

      if (selectedNodeId) {
        try {
          res = await exitNodeToken(selectedNodeId, uniqueKey.trim());
        } catch {
          // station-scoped exit failed, fall through to legacy checkout
        }
      }

      if (!res?.data?.success) {
        res = await API.post('/booking/checkout', { uniqueKey: uniqueKey.trim() });
      }

      setStatus('success');
      setMessage(res.data.message || 'Exit granted. Slot is now free.');
      setExitData(res.data.data || null);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Exit <span className="gradient-text">Gate</span></h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Enter your unique key to open the exit gate and free your slot.
        </p>
      </div>

      {stations.length > 0 && (
        <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Select Exit Station</label>
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

      <form onSubmit={handleExit} style={{ marginBottom: '2rem' }}>
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
          {status === 'loading' ? 'Verifying...' : 'Verify & Open Exit Gate'}
        </button>
      </form>

      {status === 'success' && (
        <div className="alert alert-success animate-fade-in" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{message}</h3>
          {exitData && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '1.5rem',
              borderRadius: '12px',
              width: '100%',
              marginTop: '1rem'
            }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Slot Released</p>
              <div style={{ fontSize: '3.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>
                {exitData.slotNumber}
              </div>
              <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>Vehicle: {exitData.vehicleNumber}</p>
            </div>
          )}
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

export default Exit;
