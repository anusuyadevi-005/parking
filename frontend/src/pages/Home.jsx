import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, BarChart3, ArrowRight, MousePointer2 } from 'lucide-react';
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
        const res = await axios.get('http://localhost:5000/api/booking/stats');
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
            Empowering Modern Mobility
          </div>
          <h1 className="hero-title">
            Parking Management <br/> 
            <span className="accent-text">Redefined.</span>
          </h1>
          <p className="hero-subtitle">
            Experience the future of urban parking with real-time occupancy tracking, 
            instant digital reservations, and automated entry verification.
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
                Search
              </button>
            </div>
            <div className="hero-button-row">
              <button className="primary-btn pulse-btn" onClick={() => navigate('/dashboard')}>
                Explore Locations <ArrowRight size={20} />
              </button>
              <button className="secondary-btn" onClick={() => navigate('/book')}>
                Quick Book <MousePointer2 size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="hero-preview">
          <div className="preview-card-float">
            <BarChart3 size={40} className="preview-icon" />
            <h3>Real-time</h3>
            <p>Live system stats active</p>
          </div>
          <div className="preview-image-container">
             <div className="preview-image-bg"></div>
          </div>
        </div>
      </section>

      {/* Stats Section with Real Data */}
      <section className="landing-stats-grid">
        <div className="landing-stat">
          <div className="stat-num">{stats.totalBookings || '0'}</div>
          <div className="stat-label">Total Reservations</div>
        </div>
        <div className="landing-stat">
          <div className="stat-num">{stats.locations?.length || '0'}</div>
          <div className="stat-label">Active Locations</div>
        </div>
        <div className="landing-stat">
          <div className="stat-num">100%</div>
          <div className="stat-label">Contactless</div>
        </div>
        <div className="landing-stat">
          <div className="stat-num">24/7</div>
          <div className="stat-label">System Monitoring</div>
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
            <p>Monitor parking occupancy with second-by-second updates and predictive modeling.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-box green">
              <ShieldCheck size={24} />
            </div>
            <h3>Secure Verification</h3>
            <p>Unique alphanumeric keys ensure only valid bookings gain access to premium slots.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-box yellow">
              <Zap size={24} />
            </div>
            <h3>Instant Reservations</h3>
            <p>Book your preferred parking spot in under 30 seconds with our streamlined UI.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works">
         <div className="how-text">
            <h2>How it <span className="accent-text">Works</span></h2>
            <div className="step-item">
               <div className="step-num">01</div>
               <div>
                  <h4>Discover availability</h4>
                  <p>Check the live dashboard to see real-time floor plans and occupancy levels.</p>
               </div>
            </div>
            <div className="step-item">
               <div className="step-num">02</div>
               <div>
                  <h4>Secure your spot</h4>
                  <p>Input your vehicle details and select your preferred parking time and slot.</p>
               </div>
            </div>
            <div className="step-item">
               <div className="step-num">03</div>
               <div>
                  <h4>Verify & Park</h4>
                  <p>Use your unique secure key to gain entry and enjoy hassle-free parking.</p>
               </div>
            </div>
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
