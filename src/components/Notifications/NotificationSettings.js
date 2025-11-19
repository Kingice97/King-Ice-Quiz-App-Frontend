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
      setSettings(prev => ({ ...prev, enabled }));
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      await notificationService.unsubscribe();
      setSettings(prev => ({ ...prev, enabled: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const updatedSettings = { ...settings, [setting]: value };
      setSettings(updatedSettings);

      await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const testNotification = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) return;

      await fetch('/api/notifications/send-to-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          title: 'Test Notification',
          body: 'This is a test notification from King Ice Quiz!',
          type: 'test'
        })
      });
      
      alert('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
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
      
      <div className="setting-group">
        <div className="setting-item">
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
          </div>
        )}
      </div>

      {settings.enabled && (
        <div className="notification-test">
          <button 
            onClick={testNotification}
            className="test-button"
          >
            Test Notification
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;