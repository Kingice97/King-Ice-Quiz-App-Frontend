import React from 'react';
import './Loading.css';

const Loading = ({ type = 'dots', size = 'medium', overlay = false }) => {
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
        <div className={`loading-dots ${sizeClass}`}>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-dots ${sizeClass}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
};

// Skeleton loading components remain the same
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