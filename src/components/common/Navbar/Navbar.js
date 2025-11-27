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

  // FIXED: Proper click handler for mobile links
  const handleMobileLinkClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    closeMobileMenu();
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // Contact information for social links
  const contactInfo = {
    email: 'olubiyiisaacanu@gmail.com',
    whatsappUrl: 'https://wa.me/2348145659286',
    twitterUrl: 'https://x.com/kingicequiz?s=09'
  };

  const NavigationLinks = ({ mobile = false }) => (
    <div className={`navbar-nav ${mobile ? 'mobile-nav' : 'sidebar-nav'}`}>
      <Link 
        to="/" 
        className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
        onClick={mobile ? handleMobileLinkClick : undefined}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-text">Home</span>
      </Link>
      
      {!isAdmin && (
        <Link 
          to="/quizzes" 
          className={`nav-link ${isActiveLink('/quizzes') ? 'active' : ''}`}
          onClick={mobile ? handleMobileLinkClick : undefined}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-text">Quizzes</span>
        </Link>
      )}
      
      {/* Chat Link - Always visible */}
      <Link 
        to="/chat" 
        className={`nav-link ${isActiveLink('/chat') ? 'active' : ''}`}
        onClick={mobile ? handleMobileLinkClick : undefined}
      >
        <span className="nav-icon">💬</span>
        <span className="nav-text">Chat</span>
      </Link>

      {isAuthenticated ? (
        <>
          {!isAdmin && (
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActiveLink('/dashboard') ? 'active' : ''}`}
              onClick={mobile ? handleMobileLinkClick : undefined}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>
          )}
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className={`nav-link ${isActiveLink('/admin') ? 'active' : ''}`}
              onClick={mobile ? handleMobileLinkClick : undefined}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Admin</span>
            </Link>
          )}
          
          <Link 
            to="/profile" 
            className={`nav-link ${isActiveLink('/profile') ? 'active' : ''}`}
            onClick={mobile ? handleMobileLinkClick : undefined}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </Link>
        </>
      ) : (
        <>
          <Link 
            to="/login" 
            className={`nav-link ${isActiveLink('/login') ? 'active' : ''}`}
            onClick={mobile ? handleMobileLinkClick : undefined}
          >
            <span className="nav-icon">🔐</span>
            <span className="nav-text">Login</span>
          </Link>
          <Link 
            to="/register" 
            className={`nav-link ${isActiveLink('/register') ? 'active' : ''}`}
            onClick={mobile ? handleMobileLinkClick : undefined}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-text">Sign Up</span>
          </Link>
        </>
      )}
    </div>
  );

  const SocialLinks = ({ mobile = false }) => (
    <div className={`social-section ${mobile ? 'mobile-social' : 'sidebar-social'}`}>
      <h4 className="social-title">Follow Us</h4>
      <div className="social-links">
        <a 
          href={contactInfo.whatsappUrl}
          aria-label="WhatsApp" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-link whatsapp"
          title="Chat with us on WhatsApp"
          onClick={mobile ? handleMobileLinkClick : undefined}
        >
          {/* WhatsApp SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="social-icon whatsapp">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0.16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.248-6.189-3.515-8.452"/>
          </svg>
          <span className="social-text">WhatsApp</span>
        </a>
        <a 
          href={contactInfo.twitterUrl}
          aria-label="Twitter" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-link twitter"
          title="Follow us on Twitter"
          onClick={mobile ? handleMobileLinkClick : undefined}
        >
          {/* Twitter (X) SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="social-icon twitter">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          <span className="social-text">Twitter</span>
        </a>
        <a 
          href={`mailto:${contactInfo.email}`}
          aria-label="Email" 
          className="social-link email"
          title="Send us an email"
          onClick={mobile ? handleMobileLinkClick : undefined}
        >
          {/* Email SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="social-icon email">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          <span className="social-text">Gmail</span>
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <nav className="navbar mobile-navbar">
        <div className="navbar-container">
          <div className="navbar-header">
            <button 
              className="sidebar-toggle mobile-only"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>
            
            <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
              <span className="logo-icon">🧠</span>
              <span className="logo-text">King Ice Quiz</span>
            </Link>

            <button 
              className="theme-toggle mobile-theme"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
            <div className="mobile-menu-content">
              <NavigationLinks mobile={true} />
              
              <div className="mobile-auth-section">
                {isAuthenticated ? (
                  <div className="user-menu-mobile">
                    <div className="user-info-mobile">
                      <span className="user-greeting">Hello, {user?.username}</span>
                    </div>
                    <button 
                      className="btn btn-outline btn-sm logout-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                        closeMobileMenu();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="auth-buttons-mobile">
                    <Link 
                      to="/login" 
                      className="btn btn-outline btn-sm"
                      onClick={handleMobileLinkClick}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      className="btn btn-primary btn-sm"
                      onClick={handleMobileLinkClick}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              <div className="mobile-social-section">
                <SocialLinks mobile={true} />
              </div>
            </div>
            
            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
              <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar - Always expanded */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="logo-icon">🧠</span>
            <span className="logo-text">King Ice Quiz</span>
          </Link>
        </div>

        <div className="sidebar-content">
          <NavigationLinks />
          
          <div className="sidebar-actions">
            <button 
              className="theme-toggle sidebar-theme"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="theme-icon">{isDark ? '☀️' : '🌙'}</span>
              <span className="theme-text">
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {isAuthenticated ? (
              <div className="user-menu-sidebar">
                <div className="user-info-sidebar">
                  <div className="user-details">
                    <span className="user-name">{user?.username}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-outline btn-sm logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons-sidebar">
                <Link 
                  to="/login" 
                  className="btn btn-outline btn-sm"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary btn-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <SocialLinks />
        </div>
      </aside>
    </>
  );
};

export default Navbar;