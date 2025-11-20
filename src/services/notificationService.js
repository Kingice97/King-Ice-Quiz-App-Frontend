import api from './api';

class NotificationService {
  // Subscribe to push notifications
  async subscribe(subscription) {
    try {
      const response = await api.post('/notifications/subscribe', {
        subscription: subscription
      });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      const response = await api.post('/notifications/unsubscribe');
      return response.data;
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      throw error;
    }
  }

  // Get notification settings
  async getSettings() {
    try {
      const response = await api.get('/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        success: false,
        settings: {
          enabled: false,
          quizAlerts: true,
          chatAlerts: true,
          announcementAlerts: true
        }
      };
    }
  }

  // Update notification settings
  async updateSettings(settings) {
    try {
      const response = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Send test notification
  async sendTestNotification(title, body) {
    try {
      const response = await api.post('/notifications/send-test', {
        title: title,
        body: body
      });
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Send quiz notification (admin only)
  async sendQuizNotification(quizId, quizTitle, quizDescription) {
    try {
      const response = await api.post('/notifications/send-quiz-notification', {
        quizId,
        quizTitle,
        quizDescription
      });
      return response.data;
    } catch (error) {
      console.error('Error sending quiz notification:', error);
      throw error;
    }
  }

  // ✅ IMPROVED: Send chat notification - uses the correct endpoint
  async sendChatNotification(recipientId, senderName, message, roomId) {
    try {
      const response = await api.post('/notifications/send-chat-notification', {
        recipientId,
        senderName,
        message,
        roomId
      });
      return response.data;
    } catch (error) {
      console.error('Error sending chat notification:', error);
      throw error;
    }
  }

  // ✅ NEW: Send direct push notification (for when app is closed)
  async sendDirectNotification(userId, title, body, type = 'chat', url = '/chat') {
    try {
      const response = await api.post('/notifications/send-to-user', {
        userId: userId,
        title: title,
        body: body,
        type: type,
        url: url
      });
      return response.data;
    } catch (error) {
      console.error('Error sending direct notification:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();

// ✅ IMPROVED: Helper functions for local notifications
export const sendQuizNotification = (quizTitle) => {
  const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  if (settings.enabled && settings.quizAlerts && Notification.permission === 'granted') {
    new Notification('New Quiz Available!', {
      body: `Check out: ${quizTitle}`,
      icon: '/brain-icon.png',
      badge: '/brain-icon.png',
      vibrate: [200, 100, 200],
      tag: `quiz-${Date.now()}`,
      requireInteraction: true
    });
  }
};

// ✅ IMPROVED: Chat notification with better handling
export const sendChatNotification = (sender, message) => {
  const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  if (settings.enabled && settings.chatAlerts && Notification.permission === 'granted') {
    new Notification(`💬 ${sender}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/brain-icon.png',
      badge: '/brain-icon.png',
      vibrate: [200, 100, 200],
      tag: `chat-${Date.now()}`,
      requireInteraction: true,
      data: {
        url: '/chat',
        type: 'chat',
        sender: sender
      }
    });
  }
};

export const sendAnnouncementNotification = (title, message) => {
  const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  if (settings.enabled && settings.announcementAlerts && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/brain-icon.png',
      badge: '/brain-icon.png',
      vibrate: [200, 100, 200],
      tag: `announcement-${Date.now()}`
    });
  }
};

// ✅ IMPROVED: Send immediate browser notification (fallback)
export const sendImmediateNotification = (title, body, options = {}) => {
  if (Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/brain-icon.png',
      badge: '/brain-icon.png',
      vibrate: [200, 100, 200],
      tag: `notification-${Date.now()}`,
      requireInteraction: options.requireInteraction || false,
      data: {
        url: options.url || '/',
        type: options.type || 'general'
      }
    };

    new Notification(title, { ...defaultOptions, ...options, body });
    return true;
  }
  return false;
};

// Check if push notifications are supported
export const isPushSupported = () => {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
};

// Get current permission status
export const getPermissionStatus = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

// Request notification permission
export const requestPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser');
  }
  
  return await Notification.requestPermission();
};

// ✅ IMPROVED: Check if user has enabled notifications
export const areNotificationsEnabled = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    return settings.enabled === true && Notification.permission === 'granted';
  } catch (error) {
    return false;
  }
};

// ✅ IMPROVED: Check if chat notifications are enabled
export const areChatNotificationsEnabled = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    return settings.enabled === true && settings.chatAlerts !== false && Notification.permission === 'granted';
  } catch (error) {
    return false;
  }
};

// ✅ IMPROVED: Save notification settings
export const saveNotificationSettings = (settings) => {
  try {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }
};

// ✅ IMPROVED: Load notification settings
export const loadNotificationSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  } catch (error) {
    return {
      enabled: false,
      quizAlerts: true,
      chatAlerts: true,
      announcementAlerts: true
    };
  }
};

// ✅ NEW: Initialize push notifications
export const initializePushNotifications = async () => {
  if (!isPushSupported()) {
    console.log('❌ Push notifications not supported in this browser');
    return false;
  }

  if (Notification.permission === 'denied') {
    console.log('❌ Notifications are blocked by user');
    return false;
  }

  try {
    // Check if we already have a subscription
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('✅ Already subscribed to push notifications');
      return true;
    }

    // Subscribe to push notifications
    const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.error('❌ VAPID public key not configured');
      return false;
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('✅ Successfully subscribed to push notifications');
    
    // Send subscription to backend
    await notificationService.subscribe(subscription);
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
    return false;
  }
};

// ✅ NEW: Convert VAPID key
const urlBase64ToUint8Array = (base64String) => {
  if (!base64String) {
    throw new Error('VAPID public key is undefined');
  }

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

export default notificationService;