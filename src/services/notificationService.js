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
      // Return default settings if API fails
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
 // Add this method to your existing notificationService class
async sendTestNotification(title, body) {
  try {
    const response = await api.post('/notifications/send-to-user', {
      userId: 'current', // Will be replaced with actual user ID in backend
      title: title,
      body: body,
      type: 'chat',
      url: '/chat'
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
      badge: '/brain-icon.png'
    });
  }
};

export const sendChatNotification = (sender, message) => {
  const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  if (settings.enabled && settings.chatAlerts && Notification.permission === 'granted') {
    new Notification(`New message from ${sender}`, {
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      icon: '/brain-icon.png',
      badge: '/brain-icon.png'
    });
  }
};

export const sendAnnouncementNotification = (title, message) => {
  const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
  if (settings.enabled && settings.announcementAlerts && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/brain-icon.png',
      badge: '/brain-icon.png'
    });
  }
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

export default notificationService;