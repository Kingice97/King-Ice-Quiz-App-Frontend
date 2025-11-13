import React from 'react';
import './Progress.css';

const Progress = ({ current, total, answers = [] }) => {
  const percentage = (current / total) * 100;

  const getQuestionStatus = (index) => {
    if (index < current - 1) return 'answered';
    if (index === current - 1) return 'current';
    return 'upcoming';
  };

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-text">
          Progress: {current} of {total}
        </span>
        <span className="progress-percentage">
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="progress-dots">
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={`progress-dot ${getQuestionStatus(index + 1)}`}
            title={`Question ${index + 1}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Progress;