import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ShieldCheck, Car, User, Phone, Lock, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import '../Auth.css';
import heroImage from '../assets/parking-hero.png';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    licenseNumber: '',
    vehicleModel: '',
    numberPlate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signup(formData);
      if (res.success) {
        navigate('/login', { state: { message: 'Account created! Please login.' } });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Signup failed. Please check your connection.');
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
          <h1>Smart Parking Made <span className="gradient-text">Simple</span></h1>
          <p>Join thousands of drivers who have already simplified their daily commute with SmartPark.</p>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="auth-glass-card">
          <div className="auth-brand-mobile">SmartPark</div>
          
          <div className="auth-header-enhanced">
            <h2>Create Account</h2>
            <p>Join us for a seamless parking experience</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="enhanced-form">
            <div className="signup-scroll-area">
              <div className="form-section-title">Personal Details</div>
              <div className="form-row-enhanced">
                <div className="input-group-enhanced">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon-enhanced" />
                    <input type="text" name="name" placeholder="John Doe" onChange={handleChange} required />
                  </div>
                </div>
                <div className="input-group-enhanced">
                  <label>Phone Number</label>
                  <div className="input-wrapper">
                    <Phone size={18} className="input-icon-enhanced" />
                    <input type="text" name="phone" placeholder="9876543210" onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="form-row-enhanced">
                <div className="input-group-enhanced">
                  <label>Username</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon-enhanced" />
                    <input type="text" name="username" placeholder="johndoe123" onChange={handleChange} required />
                  </div>
                </div>
                <div className="input-group-enhanced">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon-enhanced" />
                    <input type="password" name="password" placeholder="••••••••" onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="form-section-title">Vehicle & License</div>
              <div className="input-group-enhanced">
                <label>License Number</label>
                <div className="input-wrapper">
                  <ShieldCheck size={18} className="input-icon-enhanced" />
                  <input type="text" name="licenseNumber" placeholder="DL-1234567890" onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row-enhanced">
                <div className="input-group-enhanced">
                  <label>Vehicle Model</label>
                  <div className="input-wrapper">
                    <Car size={18} className="input-icon-enhanced" />
                    <input type="text" name="vehicleModel" placeholder="Tesla Model 3" onChange={handleChange} required />
                  </div>
                </div>
                <div className="input-group-enhanced">
                  <label>Number Plate</label>
                  <div className="input-wrapper">
                    <CreditCard size={18} className="input-icon-enhanced" />
                    <input type="text" name="numberPlate" placeholder="KA-01-AB-1234" onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn-enhanced" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Get Started
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-enhanced">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
