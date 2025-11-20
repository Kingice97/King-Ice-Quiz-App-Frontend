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

  // ✅ FIXED: Get VAPID public key with proper error handling
  const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;

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

    // ✅ FIXED: Check if VAPID key is available
    if (!vapidPublicKey) {
      setMessage('❌ Push notifications are not configured. Please contact administrator.');
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

      // ✅ FIXED: Check if we're already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Already subscribed to push notifications');
        return subscription;
      }

      // ✅ FIXED: Safe VAPID key conversion with validation
      if (!vapidPublicKey) {
        throw new Error('VAPID public key is not configured');
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      console.log('Subscribing to push notifications with VAPID key...');

      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Push subscription successful:', subscription);

      // Send subscription to backend
      await notificationService.subscribe(subscription);

      return subscription;

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      
      // ✅ FIXED: Provide more specific error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Push subscription not allowed. Please check browser permissions.');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Already subscribed to push notifications.');
      } else if (error.message.includes('VAPID')) {
        throw new Error('Push notifications are not properly configured.');
      } else {
        throw new Error('Failed to subscribe to push notifications: ' + error.message);
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  // ✅ FIXED: Safe VAPID key conversion function
  const urlBase64ToUint8Array = (base64String) => {
    if (!base64String) {
      throw new Error('VAPID public key is undefined');
    }

    // Remove any whitespace and format the base64 string
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    try {
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    } catch (error) {
      throw new Error('Invalid VAPID public key format');
    }
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

  // ✅ FIXED: Better browser support detection
  const isFullySupported = browserSupport.notifications && 
                          browserSupport.serviceWorker && 
                          browserSupport.pushManager &&
                          vapidPublicKey;

  if (!isFullySupported) {
    return (
      <div className="notification-settings">
        <h3>🔕 Push Notifications</h3>
        
        <div className="browser-support">
          <h4>Browser Compatibility:</h4>
          <ul>
            <li className={browserSupport.notifications ? 'supported' : 'unsupported'}>
              ✅ Notifications API: {browserSupport.notifications ? 'Supported' : 'Not Supported'}
            </li>
            <li className={browserSupport.serviceWorker ? 'supported' : 'unsupported'}>
              ✅ Service Worker: {browserSupport.serviceWorker ? 'Supported' : 'Not Supported'}
            </li>
            <li className={browserSupport.pushManager ? 'supported' : 'unsupported'}>
              ✅ Push API: {browserSupport.pushManager ? 'Supported' : 'Not Supported'}
            </li>
            <li className={vapidPublicKey ? 'supported' : 'unsupported'}>
              ✅ Server Configuration: {vapidPublicKey ? 'Configured' : 'Not Configured'}
            </li>
          </ul>
        </div>

        {!vapidPublicKey && (
          <div className="configuration-warning">
            <h4>⚠️ Configuration Required</h4>
            <p>Push notifications are not fully configured. Please make sure:</p>
            <ol>
              <li>VAPID keys are generated and added to environment variables</li>
              <li>Backend has VAPID_PRIVATE_KEY set</li>
              <li>Frontend has REACT_APP_VAPID_PUBLIC_KEY set</li>
            </ol>
          </div>
        )}

        <p>Push notifications require a modern browser like Chrome, Firefox, or Edge with proper server configuration.</p>
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
              <p><strong>VAPID Key:</strong> {vapidPublicKey ? '✅ Configured' : '❌ Missing'}</p>
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