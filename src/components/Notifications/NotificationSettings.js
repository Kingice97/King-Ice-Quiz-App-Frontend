import React, { useState, useEffect } from 'react';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    quizAlerts: true,
    chatAlerts: true,
    announcementAlerts: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.log('Using default notification settings');
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        setMessage('❌ This browser does not support notifications');
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const updatedSettings = { ...settings, enabled: true };
        setSettings(updatedSettings);
        setMessage('✅ Notifications enabled successfully!');
      } else if (permission === 'denied') {
        setMessage('❌ Notifications blocked. Please enable them in browser settings.');
      } else {
        setMessage('⚠️ Notification permission not granted');
      }
    } catch (error) {
      setMessage('❌ Error enabling notifications');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const updatedSettings = { ...settings, enabled: false };
      setSettings(updatedSettings);
      setMessage('✅ Notifications disabled');
    } catch (error) {
      setMessage('❌ Error disabling notifications');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSettingChange = (setting, value) => {
    const updatedSettings = { ...settings, [setting]: value };
    setSettings(updatedSettings);
  };

  const handleSaveAll = () => {
    setSaving(true);
    setMessage('💾 Settings saved successfully!');
    
    setTimeout(() => {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }, 1000);
  };

  const isSupported = 'Notification' in window;

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <h3>🔕 Notifications Not Supported</h3>
        <p>Your browser doesn't support push notifications.</p>
        <div className="browser-support">
          <p><strong>Try using:</strong></p>
          <ul>
            <li>Google Chrome</li>
            <li>Mozilla Firefox</li>
            <li>Microsoft Edge</li>
            <li>Safari (iOS/Mac)</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>🔔 Notification Settings</h3>
      
      {/* Status Message */}
      {message && (
        <div className={`settings-message ${message.includes('✅') || message.includes('💾') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
      
      <div className="setting-group">
        <div className="setting-item main-toggle">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => 
                e.target.checked ? handleEnableNotifications() : handleDisableNotifications()
              }
              disabled={loading}
            />
            <span className="setting-text">
              Enable Push Notifications
              {loading && <span className="loading-dots">...</span>}
            </span>
          </label>
          <p className="setting-description">
            Receive notifications even when the app is closed
            {settings.enabled && <span className="status-active"> • Active</span>}
          </p>
        </div>

        {settings.enabled && (
          <div className="notification-types">
            <h4>What would you like to be notified about?</h4>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.quizAlerts}
                  onChange={(e) => handleSettingChange('quizAlerts', e.target.checked)}
                />
                <span className="setting-text">📝 New Quiz Alerts</span>
              </label>
              <p className="setting-description">
                Get notified when new quizzes are available
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.chatAlerts}
                  onChange={(e) => handleSettingChange('chatAlerts', e.target.checked)}
                />
                <span className="setting-text">💬 Chat Messages</span>
              </label>
              <p className="setting-description">
                Notify me when I receive new chat messages
              </p>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.announcementAlerts}
                  onChange={(e) => handleSettingChange('announcementAlerts', e.target.checked)}
                />
                <span className="setting-text">📢 Announcements</span>
              </label>
              <p className="setting-description">
                Important updates and announcements
              </p>
            </div>

            {/* Save Button */}
            <div className="settings-actions">
              <button 
                onClick={handleSaveAll}
                disabled={saving}
                className="save-button"
              >
                {saving ? 'Saving...' : '💾 Save Preferences'}
              </button>
            </div>

            <div className="settings-info">
              <p>🔒 Your preferences are automatically saved locally</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!settings.enabled && (
        <div className="instructions">
          <h4>How to enable notifications:</h4>
          <ol>
            <li>Toggle "Enable Push Notifications" above</li>
            <li>Allow notifications when your browser asks</li>
            <li>Choose what you want to be notified about</li>
            <li>Click "Save Preferences"</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;