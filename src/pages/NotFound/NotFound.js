import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <Helmet>
        <title>Page Not Found - King Ice Quiz App</title>
        <meta name="description" content="The page you're looking for doesn't exist" />
      </Helmet>

      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-graphic">
            <span className="error-icon">🔍</span>
            <h1>404</h1>
          </div>
          <div className="error-message">
            <h2>Page Not Found</h2>
            <p>
              Oops! The page you're looking for seems to have wandered off into 
              the digital unknown. Don't worry, you can find your way back to 
              great quizzes from here.
            </p>
          </div>
          <div className="action-buttons">
            <Link to="/" className="btn btn-primary btn-lg">
              Go Home
            </Link>
            <Link to="/quizzes" className="btn btn-outline btn-lg">
              Browse Quizzes
            </Link>
          </div>
          <div className="helpful-links">
            <h3>Quick Links</h3>
            <div className="links-grid">
              <Link to="/">Home</Link>
              <Link to="/quizzes">All Quizzes</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/profile">Profile</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;