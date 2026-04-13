import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
import '../Auth.css';
import heroImage from '../assets/parking-hero.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(username, password);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-side-image">
        <img src={heroImage} alt="Smart Parking Garage" />
        <div className="auth-image-overlay"></div>
        <div className="auth-side-content">
          <h1>Experience the Future of <span className="gradient-text">Urban Parking</span></h1>
          <p>Secure, smart, and seamless parking solutions at your fingertips. Join the community today.</p>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="auth-glass-card">
          <div className="auth-brand-mobile">SmartPark</div>
          
          <div className="auth-header-enhanced">
            <h2>Welcome Back</h2>
            <p>Please enter your details to sign in</p>
          </div>

          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="enhanced-form">
            <div className="input-group-enhanced">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon-enhanced" />
                <input 
                  id="username"
                  type="text" 
                  placeholder="Enter your username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group-enhanced">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon-enhanced" />
                <input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="submit-btn-enhanced" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="admin-badge-enhanced">
            <ShieldAlert size={18} /> 
            <span>Demo? Use <strong>admin</strong> / <strong>adminpassword</strong></span>
          </div>

          <div className="auth-footer-enhanced">
            Don't have an account? <Link to="/signup">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
