import React from 'react';
import './Loading.css';

const Loading = ({ type = 'spinner', size = 'medium', text, overlay = false }) => {
  if (type === 'skeleton') {
    return (
      <div className="skeleton-container">
        <div className="skeleton-line short"></div>
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line long"></div>
      </div>
    );
  }

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

// Skeleton loading components for different use cases
export const SkeletonMessage = () => (
  <div className="skeleton-message">
    <div className="skeleton-avatar"></div>
    <div className="skeleton-content">
      <div className="skeleton-line short"></div>
      <div className="skeleton-line medium"></div>
    </div>
  </div>
);

export const SkeletonChatList = () => (
  <div className="skeleton-chat-list">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="skeleton-chat-item">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-chat-content">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
        </div>
      </div>
    ))}
  </div>
);

export default Loading;