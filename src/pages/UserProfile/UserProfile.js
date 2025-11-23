import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { userService } from '../../services/userService';
import { quizService } from '../../services/quizService';
import Loading from '../../components/common/Loading/Loading';
import './UserProfile.css';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log(`👤 Loading profile for: ${username}`);
        const response = await userService.getUserProfile(username);
        
        if (response.success) {
          setUser(response.data.user);
          setRecentResults(response.data.recentResults || []);
          
          // If no recent results in the response, try to load them separately
          if (!response.data.recentResults || response.data.recentResults.length === 0) {
            await loadUserResults(response.data.user._id);
          }
          
          console.log('✅ User profile loaded successfully:', response.data.user);
        } else {
          setError(response.message || 'User not found');
        }
      } catch (error) {
        console.error('❌ Failed to load user profile:', error);
        setError(error.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    const loadUserResults = async (userId) => {
      try {
        console.log(`📊 Loading results for user: ${userId}`);
        // Note: This endpoint might need to be adjusted based on your backend
        const resultsResponse = await quizService.getResults({ userId, limit: 5 });
        
        if (resultsResponse.success) {
          setRecentResults(resultsResponse.data || []);
        }
      } catch (error) {
        console.error('❌ Failed to load user results:', error);
        // Don't set error here - we can still show the profile without results
      }
    };

    if (username) {
      loadUserProfile();
    }
  }, [username]);

  // Function to handle starting a chat with this user
  const handleStartChat = () => {
    if (user) {
      // Navigate to chat and pass the user data
      navigate('/chat', { 
        state: { 
          startChatWith: user,
          autoSelectUser: true 
        } 
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  // Calculate display stats from user data and recent results
  const displayStats = {
    quizzesTaken: user?.stats?.quizzesTaken || recentResults.length || 0,
    averageScore: Math.round(user?.stats?.averageScore || 0),
    bestScore: Math.round(user?.stats?.bestScore || 0),
    successRate: Math.round(user?.stats?.successRate || 0),
    messagesSent: user?.stats?.messagesSent || 0,
    chatParticipation: user?.stats?.chatParticipation || 0
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <Loading text="Loading profile..." />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <div className="profile-error">
            <div className="error-icon">😕</div>
            <h2>Profile Not Found</h2>
            <p>{error || 'The user profile you are looking for does not exist or is not available.'}</p>
            <div className="error-actions">
              <button 
                onClick={() => navigate(-1)}
                className="btn btn-outline"
              >
                Go Back
              </button>
              <button 
                onClick={() => navigate('/chat')}
                className="btn btn-primary"
              >
                Return to Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <Helmet>
        <title>{user.username} - King Ice Quiz App</title>
        <meta name="description" content={`View ${user.username}'s profile on King Ice Quiz App`} />
      </Helmet>

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user.profile?.picture ? (
              <img 
                src={user.profile.picture} 
                alt={user.username}
                className="profile-picture"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`avatar-placeholder ${user.profile?.picture ? 'fallback' : ''}`}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="profile-info">
            <h1>
              {user.profile?.firstName && user.profile?.lastName 
                ? `${user.profile.firstName} ${user.profile.lastName}` 
                : user.username}
            </h1>
            <p className="username">@{user.username}</p>
            <p className="member-since">Member since {formatDate(user.createdAt)}</p>
            
            {/* Online Status */}
            <div className={`online-status ${user.isOnline ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {user.isOnline ? 'Online' : 'Offline'}
              {!user.isOnline && user.lastSeen && (
                <span className="last-seen"> • Last seen {formatTime(user.lastSeen)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{displayStats.quizzesTaken}</div>
            <div className="stat-label">Quizzes Taken</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{displayStats.averageScore}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{displayStats.bestScore}%</div>
            <div className="stat-label">Best Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{displayStats.successRate}%</div>
            <div className="stat-label">Success Rate</div>
          </div>
          {/* Chat Stats */}
          <div className="stat-card">
            <div className="stat-value">{displayStats.messagesSent}</div>
            <div className="stat-label">Messages Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{displayStats.chatParticipation}</div>
            <div className="stat-label">Chat Rooms</div>
          </div>
        </div>

        {/* Bio Section */}
        {user.profile?.bio && (
          <div className="bio-section">
            <h3>About</h3>
            <p>{user.profile.bio}</p>
          </div>
        )}

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Quiz Activity</h3>
          {recentResults.length > 0 ? (
            <div className="results-list">
              {recentResults.map((result, index) => (
                <div key={result._id || `result-${index}`} className="result-item">
                  <div className="quiz-info">
                    <h4>{result.quizId?.title || 'Quiz'}</h4>
                    <p>
                      {result.quizId?.category || 'General'} • 
                      {result.completedAt ? ` ${formatDate(result.completedAt)}` : ' Recent'}
                    </p>
                  </div>
                  <div className="result-info">
                    <span className={`score ${result.passed ? 'passed' : 'failed'}`}>
                      {Math.round(result.percentage || 0)}%
                    </span>
                    <span className="details">
                      {result.score || 0}/{result.totalQuestions || 0} • 
                      {result.timeTaken ? ` ${result.timeTaken}s` : ' Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No recent quiz activity yet</p>
              <p className="empty-subtitle">Quiz results will appear here</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-outline"
          >
            Go Back
          </button>
          <button 
            onClick={handleStartChat}
            className="btn btn-primary"
            disabled={!user.isOnline}
          >
            {user.isOnline ? 'Send Message' : 'User Offline'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;