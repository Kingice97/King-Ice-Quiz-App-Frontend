import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { userService } from '../../services/userService';
import Loading from '../../components/common/Loading/Loading';
import './UserProfile.css';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log(`👤 Loading profile for: ${username}`);
        const response = await userService.getUserProfile(username);
        
        if (response.success) {
          setUser(response.data.user);
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

    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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
            {user.email && (
              <p className="user-email">{user.email}</p>
            )}
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

        {/* Bio Section */}
        {user.profile?.bio ? (
          <div className="bio-section">
            <h3>About</h3>
            <p>{user.profile.bio}</p>
          </div>
        ) : (
          <div className="bio-section">
            <h3>About</h3>
            <p className="no-bio">No bio provided yet.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="profile-actions">
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-outline"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;