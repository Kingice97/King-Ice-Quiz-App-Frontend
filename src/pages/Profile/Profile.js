import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/userService';
import { quizService } from '../../services/quizService';
import Loading from '../../components/common/Loading/Loading';
import Modal from '../../components/common/Modal/Modal';
import ProfilePictureUpload from '../../components/UserProfile/ProfilePictureUpload';
import ChatPreferences from '../../components/UserProfile/ChatPreferences';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, updatePassword } = useAuth();
  const { isConnected } = useSocket();

  // FIXED: Get the correct profile picture path
  const getProfilePictureUrl = () => {
    if (!user?.profile?.picture) return null;
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const picturePath = user.profile.picture;
    
    // Ensure the path starts with /uploads
    const fullUrl = picturePath.startsWith('/uploads') 
      ? `${baseUrl}${picturePath}`
      : `${baseUrl}/uploads/${picturePath}`;
    
    console.log('🔍 Profile Debug - Profile Picture URL:', fullUrl);
    return fullUrl;
  };

  const profilePictureUrl = getProfilePictureUrl();

  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [showChatPreferencesModal, setShowChatPreferencesModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  // Only fetch user stats if user is NOT admin
  const { data: statsData, loading: statsLoading } = useApi(() =>
    user?.role !== 'admin' ? userService.getUserStats() : Promise.resolve({ data: { overall: {} } })
  );

  // Only fetch results if user is NOT admin
  const { data: resultsData, loading: resultsLoading } = useApi(() =>
    user?.role !== 'admin' ? quizService.getResults({ limit: 10 }) : Promise.resolve({ data: [] })
  );

  const stats = statsData?.data?.overall || {};
  const recentResults = resultsData?.data || [];

  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    profile: {
      firstName: '',
      lastName: '',
      bio: ''
    }
  });

  // Initialize form with user data when user loads
  useEffect(() => {
    if (user) {
      setEditForm({
        username: user?.username || '',
        email: user?.email || '',
        profile: {
          firstName: user?.profile?.firstName || '',
          lastName: user?.profile?.lastName || '',
          bio: user?.profile?.bio || ''
        }
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage('');
    
    try {
      await updateUser(editForm);
      setMessage('Profile updated successfully!');
      setShowEditModal(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message || 'Failed to update profile. Please try again.');
      console.error('Failed to update profile:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    setMessage('');

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle profile picture update
  const handleProfilePictureUpdate = () => {
    setMessage('Profile picture updated successfully!');
    setShowProfilePictureModal(false);
    setImageError(false); // Reset image error state
    setTimeout(() => setMessage(''), 3000);
  };

  // Handle chat preferences update
  const handleChatPreferencesUpdate = () => {
    setMessage('Chat preferences updated successfully!');
    setShowChatPreferencesModal(false);
    setTimeout(() => setMessage(''), 3000);
  };

  // Handle image loading error
  const handleImageError = (e) => {
    console.error('❌ Profile image failed to load:', e);
    setImageError(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="profile-page">
      <Helmet>
        <title>
          {user?.role === 'admin' ? 'Admin Profile' : 'Profile'} - King Ice Quiz App
        </title>
        <meta name="description" content={user?.role === 'admin' ? 'Admin dashboard for managing King Ice Quiz App' : 'View and manage your King Ice Quiz App profile'} />
      </Helmet>

      {/* Success/Error Message */}
      {message && (
        <div className={`message ${message.includes('success') ? 'message-success' : 'message-error'}`}>
          {message}
        </div>
      )}

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {/* Profile picture with upload option */}
            <div 
              className={`avatar-container ${user?.profile?.picture ? 'has-image' : ''}`}
              onClick={() => setShowProfilePictureModal(true)}
              style={{ cursor: 'pointer' }}
            >
              {user?.profile?.picture && !imageError ? (
                <img 
                  src={profilePictureUrl}
                  alt={user.username}
                  className="profile-picture"
                  onLoad={() => console.log('✅ Profile image loaded successfully')}
                  onError={handleImageError}
                />
              ) : (
                <div className="avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="avatar-overlay">
                <span>Change Photo</span>
              </div>
            </div>
            
            {/* Online status indicator */}
            <div className={`online-status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </div>
            
            {user?.role === 'admin' && (
              <div className="admin-badge">Admin</div>
            )}
          </div>
          <div className="profile-info">
            <h1>
              {user?.profile?.firstName && user?.profile?.lastName 
                ? `${user.profile.firstName} ${user.profile.lastName}` 
                : user?.username}
              {user?.role === 'admin' && ' (Administrator)'}
            </h1>
            <p>Member since {formatDate(user?.createdAt)}</p>
            <div className="profile-actions">
              <button
                onClick={() => setShowEditModal(true)}
                className="btn btn-outline"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn btn-outline"
              >
                Change Password
              </button>
              {/* Chat preferences button */}
              <button
                onClick={() => setShowChatPreferencesModal(true)}
                className="btn btn-outline"
              >
                Chat Settings
              </button>
              {/* Link to chat */}
              <Link to="/chat" className="btn btn-primary">
                Open Chat
              </Link>
            </div>
          </div>
        </div>

        {/* Show stats only for regular users */}
        {user?.role !== 'admin' && (
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalQuizzesTaken || 0}</div>
              <div className="stat-label">Quizzes Taken</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(stats.averageScore || 0)}%</div>
              <div className="stat-label">Average Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(stats.bestScore || 0)}%</div>
              <div className="stat-label">Best Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Math.round(stats.successRate || 0)}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
            {/* Chat stats */}
            <div className="stat-card">
              <div className="stat-value">{stats.messagesSent || 0}</div>
              <div className="stat-label">Messages Sent</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.chatParticipation || 0}</div>
              <div className="stat-label">Chat Rooms</div>
            </div>
          </div>
        )}

        {/* Tabs - Updated with Chat tab */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {user?.role !== 'admin' && (
            <button
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              Quiz History
            </button>
          )}
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat Activity
          </button>
          <button
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            {user?.role === 'admin' ? 'Management' : 'Achievements'}
          </button>
        </div>

        {/* Tab Content - Updated with Chat tab */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="info-section">
                <h3>
                  {user?.role === 'admin' ? 'Administrator Information' : 'Personal Information'}
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Username</label>
                    <span>{user?.username}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{user?.email}</span>
                  </div>
                  {user?.profile?.firstName && (
                    <div className="info-item">
                      <label>First Name</label>
                      <span>{user.profile.firstName}</span>
                    </div>
                  )}
                  {user?.profile?.lastName && (
                    <div className="info-item">
                      <label>Last Name</label>
                      <span>{user.profile.lastName}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <label>Role</label>
                    <span className={`role ${user?.role}`}>
                      {user?.role}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Member Since</label>
                    <span>{formatDate(user?.createdAt)}</span>
                  </div>
                  {/* Chat status */}
                  <div className="info-item">
                    <label>Chat Status</label>
                    <span className={`chat-status ${isConnected ? 'connected' : 'disconnected'}`}>
                      {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                  </div>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="admin-message">
                  <h3>Administrator Access</h3>
                  <p>
                    As an administrator, you have full access to manage quizzes, questions, 
                    users, and platform settings. Use the Management tab to access admin features.
                  </p>
                </div>
              )}

              {user?.profile?.bio && (
                <div className="bio-section">
                  <h3>About</h3>
                  <p>{user.profile.bio}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && user?.role !== 'admin' && (
            <div className="history-tab">
              {resultsLoading ? (
                <Loading text="Loading quiz history..." />
              ) : recentResults.length > 0 ? (
                <div className="results-list">
                  {recentResults.map(result => (
                    <div key={result._id} className="result-item">
                      <div className="quiz-info">
                        <h4>{result.quizId?.title}</h4>
                        <p>{result.quizId?.category} • {formatDate(result.completedAt)}</p>
                      </div>
                      <div className="result-info">
                        <span className={`score ${result.passed ? 'passed' : 'failed'}`}>
                          {Math.round(result.percentage)}%
                        </span>
                        <span className="details">
                          {result.score}/{result.totalQuestions} • {result.timeTaken}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No quiz results yet. Take your first quiz!</p>
                </div>
              )}
            </div>
          )}

          {/* Chat Activity Tab - REMOVED Quick Actions section */}
          {activeTab === 'chat' && (
            <div className="chat-tab">
              <div className="chat-stats">
                <h3>Chat Statistics</h3>
                <div className="chat-stats-grid">
                  <div className="chat-stat-card">
                    <div className="chat-stat-value">{stats.messagesSent || 0}</div>
                    <div className="chat-stat-label">Total Messages</div>
                  </div>
                  <div className="chat-stat-card">
                    <div className="chat-stat-value">{stats.chatParticipation || 0}</div>
                    <div className="chat-stat-label">Active Chat Rooms</div>
                  </div>
                  <div className="chat-stat-card">
                    <div className="chat-stat-value">
                      {isConnected ? '🟢 Online' : '🔴 Offline'}
                    </div>
                    <div className="chat-stat-label">Current Status</div>
                  </div>
                  <div className="chat-stat-card">
                    <div className="chat-stat-value">
                      {user?.preferences?.chatNotifications ? '🔔 On' : '🔕 Off'}
                    </div>
                    <div className="chat-stat-label">Notifications</div>
                  </div>
                </div>
              </div>
              
              {/* ✅ REMOVED: Quick Actions section */}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="achievements-tab">
              {user?.role === 'admin' ? (
                <div className="admin-management">
                  <h3>Quick Management</h3>
                  <div className="admin-actions-grid">
                    <Link to="/admin/quizzes" className="admin-action-btn">
                      <div className="action-icon">📝</div>
                      <span>Manage Quizzes</span>
                    </Link>
                    {/* <Link to="/admin/questions" className="admin-action-btn">
                      <div className="action-icon">❓</div>
                      <span>Manage Questions</span>
                    </Link> */}
                    <Link to="/admin/users" className="admin-action-btn">
                      <div className="action-icon">👥</div>
                      <span>User Management</span>
                    </Link>
                    <Link to="/admin/analytics" className="admin-action-btn">
                      <div className="action-icon">📊</div>
                      <span>View Analytics</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Achievements coming soon!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
        size="medium"
      >
        <form onSubmit={handleEditSubmit} className="profile-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm(prev => ({
                ...prev,
                username: e.target.value
              }))}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({
                ...prev,
                email: e.target.value
              }))}
              className="form-control"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                value={editForm.profile.firstName}
                onChange={(e) => setEditForm(prev => ({
                  ...prev,
                  profile: { ...prev.profile, firstName: e.target.value }
                }))}
                className="form-control"
                placeholder="Optional"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                value={editForm.profile.lastName}
                onChange={(e) => setEditForm(prev => ({
                  ...prev,
                  profile: { ...prev.profile, lastName: e.target.value }
                }))}
                className="form-control"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              value={editForm.profile.bio}
              onChange={(e) => setEditForm(prev => ({
                ...prev,
                profile: { ...prev.profile, bio: e.target.value }
              }))}
              className="form-control"
              rows="3"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="btn btn-outline"
              disabled={saveLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="small"
      >
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({
                ...prev,
                currentPassword: e.target.value
              }))}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({
                ...prev,
                newPassword: e.target.value
              }))}
              className="form-control"
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({
                ...prev,
                confirmPassword: e.target.value
              }))}
              className="form-control"
              required
              minLength="6"
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="btn btn-outline"
              disabled={passwordLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Profile Picture Upload Modal */}
      <Modal
        isOpen={showProfilePictureModal}
        onClose={() => setShowProfilePictureModal(false)}
        title="Update Profile Picture"
        size="medium"
      >
        <ProfilePictureUpload 
          onSuccess={handleProfilePictureUpdate}
          onCancel={() => setShowProfilePictureModal(false)}
        />
      </Modal>

      {/* Chat Preferences Modal */}
      <Modal
        isOpen={showChatPreferencesModal}
        onClose={() => setShowChatPreferencesModal(false)}
        title="Chat Preferences"
        size="medium"
      >
        <ChatPreferences 
          onSuccess={handleChatPreferencesUpdate}
          onCancel={() => setShowChatPreferencesModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Profile;