import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="logo-icon">🧠</span>
          King Ice Quiz App
        </Link>

        <div 
          className={`navbar-toggle ${isMobileMenuOpen ? 'active' : ''}`} 
          onClick={toggleMobileMenu}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="navbar-nav">
            <Link 
              to="/" 
              className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            
            {!isAdmin && (
              <Link 
                to="/quizzes" 
                className={`nav-link ${isActiveLink('/quizzes') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Quizzes
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <Link 
                    to="/dashboard" 
                    className={`nav-link ${isActiveLink('/dashboard') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                )}
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`nav-link ${isActiveLink('/admin') ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Admin
                  </Link>
                )}
                
                <Link 
                  to="/profile" 
                  className={`nav-link ${isActiveLink('/profile') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Profile
                </Link>
              </>
            ) : null}
          </div>

          <div className="navbar-actions">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {isAuthenticated ? (
              <div className="user-menu">
                <span className="user-greeting">Hello, {user?.username}</span>
                {isAdmin && <span className="admin-badge">Admin</span>}
                <button 
                  className="btn btn-outline btn-sm logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to="/login" 
                  className="btn btn-outline btn-sm"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary btn-sm"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;