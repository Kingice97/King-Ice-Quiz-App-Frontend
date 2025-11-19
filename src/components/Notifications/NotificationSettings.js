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
  }, []);

  const checkSupport = () => {
    setIsSupported(notificationService.isSupported());
  };

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const enabled = await notificationService.requestPermission();
      if (enabled) {
        const updatedSettings = { ...settings, enabled: true };
        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      await notificationService.unsubscribe();
      const updatedSettings = { ...settings, enabled: false };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    const updatedSettings = { ...settings, [setting]: value };
    setSettings(updatedSettings);
  };

  const saveSettings = async (settingsToSave = settings) => {
    setSaving(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please log in to save settings');
        return;
      }

      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsToSave)
      });

      if (response.ok) {
        setMessage('✅ Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Failed to save settings');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = () => {
    saveSettings();
  };

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <h3>Notifications Not Supported</h3>
        <p>Your browser doesn't support push notifications.</p>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>Notification Settings</h3>
      
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
          </label>
          <p className="setting-description">
            Receive notifications even when the app is closed
          </p>
        </div>

        {settings.enabled && (
          <div className="notification-types">
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.quizAlerts}
                  onChange={(e) => handleSettingChange('quizAlerts', e.target.checked)}
                />
                <span className="setting-text">New Quiz Alerts</span>
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
                <span className="setting-text">Chat Messages</span>
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
                <span className="setting-text">Announcements</span>
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
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-save notice */}
      {settings.enabled && (
        <div className="auto-save-notice">
          <p>💡 Settings are automatically saved when you toggle the main switch. Use "Save Settings" to manually save individual preferences.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;