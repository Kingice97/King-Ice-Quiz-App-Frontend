import React, { useState, useEffect } from 'react';
import { formatTime } from '../../../utils/helpers';
import './Timer.css';

const Timer = ({ initialTime, onTimeUp, isRunning = true, onTick }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        
        if (onTick) {
          onTick(newTime);
        }
        
        if (newTime <= 0) {
          clearInterval(timer);
          if (onTimeUp) {
            onTimeUp();
          }
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onTimeUp, onTick]);

  const getTimerClass = () => {
    if (timeLeft <= 60) return 'timer-critical';
    if (timeLeft <= 300) return 'timer-warning';
    return 'timer-normal';
  };

  const percentage = (timeLeft / initialTime) * 100;

  return (
    <div className={`timer ${getTimerClass()}`}>
      <div className="timer-content">
        <div className="timer-text">
          <span className="timer-label">Time Left:</span>
          <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>
        <div className="timer-progress">
          <div 
            className="timer-progress-bar"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Timer;