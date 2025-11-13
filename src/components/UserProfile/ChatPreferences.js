import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Loading from '../common/Loading/Loading';
import './ChatPreferences.css';

const ChatPreferences = ({ onSuccess, onCancel }) => {
  const { user, updateUser } = useAuth();
  const [preferences, setPreferences] = useState({
    showOnlineStatus: true,
    allowDirectMessages: true,
    chatNotifications: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        showOnlineStatus: user.preferences.showOnlineStatus !== false,
        allowDirectMessages: user.preferences.allowDirectMessages !== false,
        chatNotifications: user.preferences.chatNotifications !== false
      });
    }
  }, [user]);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('💾 Saving chat preferences:', preferences);
      
      // ✅ FIXED: Use the correct method name
      const response = await userService.updateChatPreferences(preferences);
      
      console.log('✅ Preferences update response:', response);
      
      if (response.success) {
        // ✅ Update local user context
        if (updateUser) {
          await updateUser({
            preferences: {
              ...user?.preferences,
              ...preferences
            }
          });
        }
        
        setMessage('Preferences updated successfully!');
        
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to update preferences');
      }
      
    } catch (error) {
      console.error('❌ Failed to update chat preferences:', error);
      setMessage(error.message || 'Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-preferences">
      <div className="preferences-header">
        <h3>Chat Preferences</h3>
        <p>Customize your chat experience</p>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'message-success' : 'message-error'}`}>
          {message}
        </div>
      )}

      <div className="preferences-content">
        <div className="preference-item">
          <div className="preference-info">
            <h4>Show Online Status</h4>
            <p>Allow other users to see when you're online</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.showOnlineStatus}
              onChange={(e) => handlePreferenceChange('showOnlineStatus', e.target.checked)}
              disabled={loading}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h4>Allow Direct Messages</h4>
            <p>Let other users send you private messages</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.allowDirectMessages}
              onChange={(e) => handlePreferenceChange('allowDirectMessages', e.target.checked)}
              disabled={loading}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="preference-item">
          <div className="preference-info">
            <h4>Chat Notifications</h4>
            <p>Receive notifications for new messages</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.chatNotifications}
              onChange={(e) => handlePreferenceChange('chatNotifications', e.target.checked)}
              disabled={loading}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="preferences-actions">
        <button
          onClick={onCancel}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <Loading size="small" /> : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default ChatPreferences;