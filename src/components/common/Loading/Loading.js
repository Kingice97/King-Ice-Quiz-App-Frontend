import React from 'react';
import './Loading.css';

const Loading = ({ size = 'medium', text = 'Loading...', overlay = false }) => {
  const sizeClass = `loading-${size}`;
  
  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className={`loading-spinner ${sizeClass}`}>
          <div className="spinner"></div>
          {text && <div className="loading-text">{text}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-spinner ${sizeClass}`}>
      <div className="spinner"></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default Loading;