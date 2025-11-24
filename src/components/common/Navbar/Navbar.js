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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // Contact information for social links
  const contactInfo = {
    email: 'olubiyiisaacanu@gmail.com',
    whatsappUrl: 'https://wa.me/2348145659286',
    twitterUrl: 'https://x.com/KingIceQuizApp?s=09'
  };

  const NavigationLinks = ({ mobile = false }) => (
    <div className={`navbar-nav ${mobile ? 'mobile-nav' : 'sidebar-nav'}`}>
      <Link 
        to="/" 
        className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
        onClick={closeMobileMenu}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-text">Home</span>
      </Link>
      
      {!isAdmin && (
        <Link 
          to="/quizzes" 
          className={`nav-link ${isActiveLink('/quizzes') ? 'active' : ''}`}
          onClick={closeMobileMenu}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-text">Quizzes</span>
        </Link>
      )}
      
      {/* Chat Link - Always visible */}
      <Link 
        to="/chat" 
        className={`nav-link ${isActiveLink('/chat') ? 'active' : ''}`}
        onClick={closeMobileMenu}
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
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>
          )}
          
          {isAdmin && (
            <Link 
              to="/admin" 
              className={`nav-link ${isActiveLink('/admin') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Admin</span>
            </Link>
          )}
          
          <Link 
            to="/profile" 
            className={`nav-link ${isActiveLink('/profile') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </Link>
        </>
      ) : null}
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
        >
          <span className="social-icon">📱</span>
          <span className="social-text">WhatsApp</span>
        </a>
        <a 
          href={contactInfo.twitterUrl}
          aria-label="Twitter" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-link twitter"
          title="Follow us on Twitter"
        >
          <span className="social-icon">🐦</span>
          <span className="social-text">Twitter</span>
        </a>
        <a 
          href={`mailto:${contactInfo.email}`}
          aria-label="Email" 
          className="social-link email"
          title="Send us an email"
        >
          <span className="social-icon">✉️</span>
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
                      {isAdmin && <span className="admin-badge">Admin</span>}
                    </div>
                    <button 
                      className="btn btn-outline btn-sm logout-btn"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="auth-buttons-mobile">
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

      {/* Desktop Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="logo-icon">🧠</span>
            {!isSidebarCollapsed && (
              <span className="logo-text">King Ice Quiz</span>
            )}
          </Link>
          
          <button 
            className="sidebar-toggle desktop-only"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
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
              {!isSidebarCollapsed && (
                <span className="theme-text">
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="user-menu-sidebar">
                <div className="user-info-sidebar">
                  <div className="user-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="user-details">
                      <span className="user-name">{user?.username}</span>
                      {isAdmin && <span className="admin-badge">Admin</span>}
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <button 
                    className="btn btn-outline btn-sm logout-btn"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                )}
              </div>
            ) : (
              !isSidebarCollapsed && (
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
              )
            )}
          </div>

          {!isSidebarCollapsed && <SocialLinks />}
        </div>
      </aside>

      {/* Main content area adjustment */}
      <div className={`main-content-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        {/* This is where your page content will be rendered */}
      </div>
    </>
  );
};

export default Navbar;