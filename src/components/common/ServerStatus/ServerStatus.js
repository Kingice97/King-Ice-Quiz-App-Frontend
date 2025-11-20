import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import './ServerStatus.css';

const ServerStatus = () => {
  const { serverStatus, retryServerConnection } = useAuth();

  if (serverStatus === 'online') return null;

  return (
    <div className={`server-status ${serverStatus}`}>
      <div className="server-status-content">
        {serverStatus === 'offline' && (
          <>
            <span className="server-icon">🟡</span>
            <span className="server-message">
              Server is starting up... (Free hosting can take 30-60 seconds)
            </span>
            <button 
              onClick={retryServerConnection}
              className="btn-retry"
            >
              Retry Connection
            </button>
          </>
        )}
        {serverStatus === 'checking' && (
          <>
            <span className="server-icon">🟡</span>
            <span className="server-message">
              Checking server connection...
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ServerStatus;