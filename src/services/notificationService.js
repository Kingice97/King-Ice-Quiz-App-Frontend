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
      const response = await api.post('/notifications/send-to-user', {
        userId: 'current',
        title: title,
        body: body,
        type: 'test',
        url: window.location.origin
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

  // ✅ FIXED: Send chat notification - uses the correct endpoint
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

// Export helper functions for local notifications
export const sendQuizNotification = (quizTitle) => {
  const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  if (settings.enabled && settings.quizAlerts && Notification.permission === 'granted') {
    new Notification('New Quiz Available!', {
      body: `Check out: ${quizTitle}`,
      icon: '/brain-icon.png',
      badge: '/brain-icon.png',
      vibrate: [200, 100, 200]
    });
  }
};

export const sendChatNotification = (sender, message) => {
  const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  if (settings.enabled && settings.chatAlerts && Notification.permission === 'granted') {
    new Notification(`💬 ${sender}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/brain-icon.png',
      badge: '/brain-icon.png',
      vibrate: [200, 100, 200],
      tag: `chat-${Date.now()}`,
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
      vibrate: [200, 100, 200]
    });
  }
};

// ✅ NEW: Send immediate browser notification (fallback)
export const sendImmediateNotification = (title, body, options = {}) => {
  if (Notification.permission === 'granted') {
    const defaultOptions = {
      icon: '/brain-icon.png',
      badge: '/brain-icon.png',
      vibrate: [200, 100, 200],
      tag: `notification-${Date.now()}`,
      data: {
        url: '/',
        type: 'general'
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

// ✅ NEW: Check if user has enabled notifications
export const areNotificationsEnabled = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    return settings.enabled === true;
  } catch (error) {
    return false;
  }
};

// ✅ NEW: Check if chat notifications are enabled
export const areChatNotificationsEnabled = () => {
  try {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    return settings.enabled === true && settings.chatAlerts !== false;
  } catch (error) {
    return false;
  }
};

// ✅ NEW: Save notification settings
export const saveNotificationSettings = (settings) => {
  try {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }
};

// ✅ NEW: Load notification settings
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

export default notificationService;