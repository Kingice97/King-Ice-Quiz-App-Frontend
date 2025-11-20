import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services/notificationService';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    quizAlerts: true,
    chatAlerts: true,
    announcementAlerts: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window
  });

  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await notificationService.getSettings();
      if (response.success) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.log('Using default notification settings');
    }
  };

  // Check if settings have changed
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    setHasChanges(JSON.stringify(savedSettings) !== JSON.stringify(settings));
  }, [settings]);

  const handleEnableNotifications = async () => {
    if (!browserSupport.notifications) {
      setMessage('❌ This browser does not support notifications');
      return;
    }

    if (!browserSupport.serviceWorker || !browserSupport.pushManager) {
      setMessage('❌ Push notifications are not supported in this browser');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Register service worker and subscribe to push
        await subscribeToPushNotifications();
        
        const updatedSettings = { ...settings, enabled: true };
        setSettings(updatedSettings);
        await saveSettings(updatedSettings);
        
        setMessage('✅ Notifications enabled successfully!');
        
        // Show welcome notification
        if (Notification.permission === 'granted') {
          new Notification('Notifications Enabled! 🎉', {
            body: 'You will now receive push notifications from King Ice Quiz',
            icon: '/brain-icon.png',
            badge: '/brain-icon.png'
          });
        }
      } else if (permission === 'denied') {
        setMessage('❌ Notifications blocked. Please enable them in your browser settings.');
      } else {
        setMessage('⚠️ Notification permission not granted');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setMessage('❌ Error enabling notifications: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const subscribeToPushNotifications = async () => {
    setIsSubscribing(true);
    
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
      });

      console.log('Push subscription successful:', subscription);

      // Send subscription to backend
      await notificationService.subscribe(subscription);

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    } finally {
      setIsSubscribing(false);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Unsubscribe from push notifications
      await notificationService.unsubscribe();
      
      const updatedSettings = { ...settings, enabled: false };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      
      setMessage('✅ Notifications disabled');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setMessage('❌ Error disabling notifications');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSettingChange = async (setting, value) => {
    const updatedSettings = { ...settings, [setting]: value };
    setSettings(updatedSettings);
    
    // Auto-save preference changes
    if (settings.enabled) {
      await saveSettings(updatedSettings);
    }
  };

  const saveSettings = async (settingsToSave) => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settingsToSave));
      await notificationService.updateSettings(settingsToSave);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const handleSavePreferences = async () => {
    try {
      await saveSettings(settings);
      setMessage('💾 Preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error saving preferences');
    }
  };

  const testNotification = () => {
    if (settings.enabled && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        // Use service worker for push notification test
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('Test Notification 🔔', {
            body: 'This is a test push notification from King Ice Quiz!',
            icon: '/brain-icon.png',
            badge: '/brain-icon.png',
            vibrate: [100, 50, 100],
            data: {
              url: window.location.origin,
              type: 'test'
            },
            actions: [
              {
                action: 'open',
                title: 'Open App'
              },
              {
                action: 'dismiss',
                title: 'Dismiss'
              }
            ]
          });
        });
      } else {
        // Fallback to regular notification
        new Notification('Test Notification 🔔', {
          body: 'This is a test notification from King Ice Quiz!',
          icon: '/brain-icon.png',
          badge: '/brain-icon.png'
        });
      }
      setMessage('✅ Test notification sent!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Please enable notifications first');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const checkPermissionStatus = () => {
    if (!browserSupport.notifications) return 'unsupported';
    
    switch (Notification.permission) {
      case 'granted': return 'granted';
      case 'denied': return 'denied';
      default: return 'default';
    }
  };

  const permissionStatus = checkPermissionStatus();

  if (!browserSupport.notifications || !browserSupport.serviceWorker) {
    return (
      <div className="notification-settings">
        <h3>🔕 Notifications Not Supported</h3>
        <p>Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.</p>
        
        <div className="browser-support">
          <h4>Browser Support:</h4>
          <ul>
            <li>✅ Notifications API: {browserSupport.notifications ? 'Supported' : 'Not Supported'}</li>
            <li>✅ Service Worker: {browserSupport.serviceWorker ? 'Supported' : 'Not Supported'}</li>
            <li>✅ Push API: {browserSupport.pushManager ? 'Supported' : 'Not Supported'}</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>🔔 Push Notification Settings</h3>
      
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
              disabled={loading || isSubscribing}
            />
            <span className="setting-text">
              Enable Push Notifications
              {(loading || isSubscribing) && <span className="loading-dots">...</span>}
            </span>
          </label>
          <p className="setting-description">
            Receive notifications even when the app is closed
            {settings.enabled && <span className="status-active"> • Active</span>}
            {permissionStatus === 'denied' && <span className="status-denied"> • Permission denied</span>}
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

            {/* Action Buttons */}
            <div className="settings-actions">
              <button 
                onClick={handleSavePreferences}
                disabled={!hasChanges}
                className="save-button"
              >
                {hasChanges ? '💾 Save Preferences' : '✅ Saved'}
              </button>
              
              <button 
                onClick={testNotification}
                className="test-button"
                disabled={!settings.enabled}
              >
                🔔 Test Notification
              </button>
            </div>

            <div className="settings-info">
              <p><strong>Current Status:</strong> {
                permissionStatus === 'granted' ? '✅ Permissions granted' : 
                permissionStatus === 'denied' ? '❌ Permissions denied' : 
                '⚠️ Permissions needed'
              }</p>
              <p><strong>Service Worker:</strong> {browserSupport.serviceWorker ? '✅ Registered' : '❌ Not available'}</p>
              {hasChanges && <p className="unsaved-changes">⚠️ You have unsaved changes</p>}
            </div>
          </div>
        )}
      </div>

      {/* Instructions when disabled */}
      {!settings.enabled && permissionStatus !== 'denied' && (
        <div className="instructions">
          <h4>How to enable push notifications:</h4>
          <ol>
            <li>Toggle "Enable Push Notifications" above</li>
            <li><strong>Allow notifications</strong> when your browser asks</li>
            <li>The service worker will register automatically</li>
            <li>Choose what you want to be notified about</li>
            <li>Use "Test Notification" to verify it works</li>
          </ol>
          
          <div className="permission-help">
            <p><strong>Note:</strong> If you previously denied permissions, you'll need to:</p>
            <ol>
              <li>Click the lock icon in your browser's address bar</li>
              <li>Change "Notifications" to "Allow"</li>
              <li>Refresh this page and try again</li>
            </ol>
          </div>
        </div>
      )}

      {permissionStatus === 'denied' && (
        <div className="permission-denied">
          <h4>❌ Notifications Blocked</h4>
          <p>You have blocked notifications for this site. To enable them:</p>
          <ol>
            <li>Click the lock icon 🔒 in your browser's address bar</li>
            <li>Find "Notifications" in the site settings</li>
            <li>Change it from "Block" to "Allow"</li>
            <li>Refresh this page and try again</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;