import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand" onClick={closeMenu}>
        <div className="logo-icon">P</div>
        <span>SmartPark</span>
      </NavLink>

      <button className="mobile-menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>
      
      <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="nav-links">
          {token && (
            <NavLink 
              to="/dashboard" 
              className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>
          )}
          {token && (
            <NavLink 
              to="/bookings" 
              className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
              onClick={closeMenu}
            >
              My Bookings
            </NavLink>
          )}
          <NavLink 
            to="/simulation" 
            className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
            onClick={closeMenu}
          >
            Simulation
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink 
              to="/admin" 
              className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
              onClick={closeMenu}
            >
              Admin Panel
            </NavLink>
          )}
        </div>

        <div className="nav-right-section">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search locations" />
          </div>
          
          <button className="nav-icon-btn" title="Notifications">
            <Bell size={20} />
          </button>

          {token ? (
            <div className="user-profile-nav">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <div 
                className="user-avatar-container" 
                onClick={() => { navigate('/profile'); closeMenu(); }}
                title="View Profile"
              >
                 <UserIcon size={20} />
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-btns">
              <NavLink to="/login" className="nav-login-btn" onClick={closeMenu}>Login</NavLink>
              <NavLink to="/signup" className="nav-signup-btn" onClick={closeMenu}>Sign Up</NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
