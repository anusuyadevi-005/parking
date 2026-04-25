import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, BarChart3, ArrowRight, MousePointer2, Waves, Clock3 } from 'lucide-react';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    locations: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/booking/stats`);
        if (res.data && res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Landing stats error:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Poll once per minute for landing stats
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} className="hero-badge-icon" />
            Premium Mobility Intelligence
          </div>
          <h1 className="hero-title">
            Parking management for
            <br />
            <span className="accent-text">high-traffic destinations.</span>
          </h1>
          <p className="hero-subtitle">
            Deliver a calmer arrival experience with live occupancy visibility,
            elegant digital reservations, and instant access verification from a single interface.
          </p>
          <div className="hero-actions-container">
            <div className="search-location-box">
              <input 
                type="text" 
                placeholder="Where do you want to park?" 
                className="location-search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate('/dashboard', { state: { search: e.target.value } });
                }}
              />
              <button className="search-btn" onClick={() => navigate('/dashboard')}>
                Find Parking
              </button>
            </div>
            <div className="hero-button-row">
              <button className="primary-btn pulse-btn" onClick={() => navigate('/dashboard')}>
                Explore Locations <ArrowRight size={20} />
              </button>
              <button className="secondary-btn" onClick={() => navigate('/book')}>
                Quick Reserve <MousePointer2 size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="hero-preview">
          <div className="preview-card-float primary">
            <BarChart3 size={40} className="preview-icon" />
            <h3>Live operations</h3>
            <p>System telemetry updating continuously</p>
          </div>
          <div className="preview-image-container">
            <div className="preview-image-bg"></div>
            <div className="preview-grid-overlay"></div>
            <div className="preview-card-float secondary">
              <div className="mini-label">Average arrival</div>
              <div className="mini-value">02:14</div>
              <p>Optimized gate-to-slot journey time</p>
            </div>
            <div className="preview-track">
              <div className="preview-slot active"></div>
              <div className="preview-slot busy"></div>
              <div className="preview-slot active"></div>
              <div className="preview-slot"></div>
              <div className="preview-slot active"></div>
              <div className="preview-slot busy"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Real Data */}
      <section className="landing-stats-grid">
        <div className="landing-stat">
          <div className="stat-num">{stats.totalBookings || '0'}</div>
          <div className="stat-label">Reservations Managed</div>
        </div>
        <div className="landing-stat">
          <div className="stat-num">{stats.locations?.length || '0'}</div>
          <div className="stat-label">Live Locations</div>
        </div>
        <div className="landing-stat">
          <div className="stat-num">100%</div>
          <div className="stat-label">Contactless Entry</div>
        </div>
        <div className="landing-stat">
          <div className="stat-num">24/7</div>
          <div className="stat-label">Operations Visibility</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Core <span className="accent-text">Features</span></h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box blue">
              <BarChart3 size={24} />
            </div>
            <h3>Real-time Tracking</h3>
            <p>Monitor occupancy with live lane awareness, richer telemetry, and confident staffing decisions.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-box green">
              <ShieldCheck size={24} />
            </div>
            <h3>Secure Verification</h3>
            <p>Give approved drivers a smooth, trust-building entry flow with secure reservation validation.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-box yellow">
              <Zap size={24} />
            </div>
            <h3>Instant Reservations</h3>
            <p>Move from discovery to confirmation quickly with a reservation flow designed for peak-hour speed.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
        <div className="how-grid">
          <div className="how-text">
            <h2>How it <span className="accent-text">Works</span></h2>
            <div className="step-item">
              <div className="step-num">01</div>
              <div>
                <h4>Discover availability</h4>
                <p>Check the live dashboard to review station health, floor plans, and availability in real time.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">02</div>
              <div>
                <h4>Reserve with confidence</h4>
                <p>Select your preferred time window and lock in a slot with a friction-light booking flow.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-num">03</div>
              <div>
                <h4>Arrive and verify</h4>
                <p>Use your digital confirmation to speed through access control and head straight to your space.</p>
              </div>
            </div>
          </div>

          <aside className="how-aside">
            <div className="hero-badge">
              <Waves size={14} />
              Concierge-grade flow
            </div>
            <h3>Built for busy venues</h3>
            <p>
              From malls to mixed-use campuses, SmartPark keeps the front-of-house experience polished during peak demand.
            </p>
            <ul>
              <li><Clock3 size={16} className="aside-list-icon" />Faster throughput during arrival surges</li>
              <li><ShieldCheck size={16} className="aside-list-icon" />Clearer reservation validation at the gate</li>
              <li><BarChart3 size={16} className="aside-list-icon" />Better visibility for operators and guests</li>
            </ul>
          </aside>
        </div>
      </section>

      <footer className="landing-footer">
         <div className="footer-line"></div>
         <div className="footer-content">
            <div className="footer-brand">SmartPark Cloud</div>
            <div className="footer-links">
               <a href="#">Security</a>
               <a href="#">Privacy</a>
               <a href="#">Documentation</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default Home;
