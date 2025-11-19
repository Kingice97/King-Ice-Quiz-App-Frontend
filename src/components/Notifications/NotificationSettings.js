import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    quizAlerts: true,
    chatAlerts: true,
    announcementAlerts: true
  });
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkSupport();
    loadSettings();
    debugSettings(); // Debug on mount
  }, []);

  const checkSupport = () => {
    setIsSupported(notificationService.isSupported());
  };

  // Debug function to see current state
  const debugSettings = () => {
    console.log('🔍 Current Settings:', settings);
    console.log('🔍 Token exists:', !!localStorage.getItem('token'));
    console.log('🔍 User ID:', localStorage.getItem('userId'));
    console.log('🔍 Notifications supported:', notificationService.isSupported());
  };

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found for loading settings');
        return;
      }

      console.log('📥 Loading notification settings...');
      
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Settings loaded:', data.settings);
        setSettings(data.settings);
      } else {
        console.error('❌ Failed to load settings:', response.status);
        const errorData = await response.json();
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setMessage('');
    try {
      console.log('🔔 Requesting notification permission...');
      const enabled = await notificationService.requestPermission();
      
      if (enabled) {
        console.log('✅ Permission granted, updating settings...');
        const updatedSettings = { ...settings, enabled: true };
        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
      } else {
        console.log('❌ Permission denied');
        setMessage('❌ Notification permission was denied');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      setMessage(`❌ ${error.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setMessage('');
    try {
      console.log('🔕 Disabling notifications...');
      await notificationService.unsubscribe();
      const updatedSettings = { ...settings, enabled: false };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
      setMessage(`❌ ${error.message}`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    console.log(`⚙️ Changing ${setting} to:`, value);
    const updatedSettings = { ...settings, [setting]: value };
    setSettings(updatedSettings);
  };

  const saveSettings = async (settingsToSave = settings) => {
    setSaving(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('❌ Please log in to save settings');
        return;
      }

      console.log('💾 Saving settings:', settingsToSave);

      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsToSave)
      });

      const data = await response.json();
      console.log('📨 Save response:', data);

      if (data.success) {
        setMessage('✅ Settings saved successfully!');
        // Update local settings with the response from server
        if (data.settings) {
          setSettings(data.settings);
        }
        console.log('✅ Settings saved successfully on server');
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleSaveAll = () => {
    console.log('💾 Manual save triggered');
    saveSettings();
  };

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <h3>🔕 Notifications Not Supported</h3>
        <p>Your browser doesn't support push notifications.</p>
        <div className="browser-support">
          <p><strong>Supported Browsers:</strong></p>
          <ul>
            <li>Chrome 50+</li>
            <li>Firefox 44+</li>
            <li>Safari 16.4+</li>
            <li>Edge 17+</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>🔔 Notification Settings</h3>
      
      {/* Success/Error Message */}
      {message && (
        <div className={`settings-message ${message.includes('✅') ? 'success' : 'error'}`}>
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
            <span className="setting-text">Enable Push Notifications</span>
            {loading && <span className="loading-indicator">🔄</span>}
          </label>
          <p className="setting-description">
            Receive notifications even when the app is closed
          </p>
        </div>

        {settings.enabled && (
          <div className="notification-types">
            <h4>Notification Preferences</h4>
            
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
                {saving ? '🔄 Saving...' : '💾 Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h4>💡 Need Help?</h4>
        <ul>
          <li>Make sure you're logged in to save settings</li>
          <li>Enable notifications in your browser when prompted</li>
          <li>Click "Save Settings" after making changes</li>
          <li>Settings are automatically saved when enabling/disabling main toggle</li>
        </ul>
      </div>

      {/* Debug button (remove in production) */}
      <div className="debug-section">
        <button 
          onClick={debugSettings}
          className="debug-button"
          style={{ 
            background: 'transparent', 
            border: '1px dashed #ccc', 
            padding: '5px 10px',
            fontSize: '12px',
            color: '#666',
            cursor: 'pointer'
          }}
        >
          🐛 Debug Settings
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings;