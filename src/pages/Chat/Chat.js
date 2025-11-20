import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatService';
import { notificationService } from '../../services/notificationService';
import Loading from '../../components/common/Loading/Loading';
import OnlineUsers from '../../components/Chat/OnlineUsers/OnlineUsers';
import ChatRoom from '../../components/Chat/ChatRoom/ChatRoom';
import UserSearch from '../../components/Chat/UserSearch/UserSearch';
import ChatsList from '../../components/Chat/ChatsList/ChatsList';
import './Chat.css';

const Chat = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { onlineUsers, isConnected, joinQuizRoom, socket } = useSocket();
  
  const [activeTab, setActiveTab] = useState('chats');
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const lastNotificationRef = useRef({});
  const notificationSettings = useRef(null);

  // Get consistent user ID
  const getUserId = () => {
    if (!user) return null;
    return user._id || user.id;
  };

  // Load notification settings
  useEffect(() => {
    const loadSettings = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
        notificationSettings.current = settings;
        console.log('🔔 Notification settings loaded:', settings);
      } catch (error) {
        console.error('Error loading notification settings:', error);
        notificationSettings.current = {
          enabled: false,
          chatAlerts: true,
          quizAlerts: true,
          announcementAlerts: true
        };
      }
    };

    loadSettings();
    
    // Listen for settings changes
    const handleStorageChange = () => {
      loadSettings();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ✅ FIXED: True push notification handler - ALWAYS send notifications
  const handlePushNotification = useCallback(async (message) => {
    // Don't send notification if:
    // 1. It's our own message
    const isOwnMessage = message.user === getUserId();
    // 2. Chat notifications are disabled
    const chatAlertsEnabled = notificationSettings.current?.enabled && 
                              notificationSettings.current?.chatAlerts;
    // 3. We've already notified for this message
    const isDuplicate = lastNotificationRef.current[message._id];

    console.log('🔔 Push Notification Check:', {
      isOwnMessage,
      chatAlertsEnabled,
      isDuplicate,
      messageId: message._id,
      settings: notificationSettings.current
    });

    if (!isOwnMessage && chatAlertsEnabled && !isDuplicate) {
      console.log('📱 SENDING PUSH NOTIFICATION:', message);
      lastNotificationRef.current[message._id] = true;
      
      // Limit the size of the ref to prevent memory leaks
      if (Object.keys(lastNotificationRef.current).length > 100) {
        lastNotificationRef.current = {};
      }

      try {
        // ✅ FIXED: Use the correct chat notification endpoint
        console.log('🔄 Sending chat notification via backend...');
        await notificationService.sendChatNotification(
          getUserId(), // Send to current user (recipient)
          message.username, // Sender name
          message.message, // Message content
          message.room // Room ID
        );
        console.log('✅ Backend chat notification sent');
      } catch (backendError) {
        console.error('❌ Backend chat notification failed, trying service worker...', backendError);
        
        // Fallback to service worker notification
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(`💬 ${message.username}`, {
              body: message.message.length > 100 ? 
                    message.message.substring(0, 100) + '...' : 
                    message.message,
              icon: '/brain-icon.png',
              badge: '/brain-icon.png',
              vibrate: [200, 100, 200],
              tag: `chat-${message.room}-${Date.now()}`,
              renotify: true,
              data: {
                url: `/chat`,
                type: 'chat',
                roomId: message.room,
                sender: message.username,
                timestamp: message.timestamp
              },
              actions: [
                {
                  action: 'open',
                  title: '💬 Open Chat'
                },
                {
                  action: 'dismiss',
                  title: '❌ Dismiss'
                }
              ]
            });
            console.log('✅ Service worker notification sent');
          } catch (swError) {
            console.error('❌ Service worker notification failed:', swError);
            
            // Final fallback - browser notification
            if (Notification.permission === 'granted') {
              new Notification(`💬 ${message.username}`, {
                body: message.message,
                icon: '/brain-icon.png'
              });
              console.log('✅ Browser notification sent');
            }
          }
        }
      }
    } else {
      console.log('🔕 Notification skipped - conditions not met');
    }
  }, []);

  // ✅ FIXED: Global message listener that works ALWAYS
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('🚫 Socket not available for global listener');
      return;
    }

    console.log('🎯 Setting up GLOBAL message listener for ALL incoming messages');

    const handleIncomingMessage = (message) => {
      console.log('📩 GLOBAL LISTENER: Message received:', {
        type: message.type,
        recipient: message.recipient,
        currentUser: getUserId(),
        isPrivate: message.type === 'private',
        isForCurrentUser: message.recipient === getUserId()
      });

      // Handle private messages addressed to current user
      if (message.type === 'private' && message.recipient === getUserId()) {
        console.log('🔔 GLOBAL: Private message for current user - triggering notification');
        handlePushNotification(message);
      }
    };

    // Listen to ALL message events
    socket.on('receive_private_message', handleIncomingMessage);
    
    return () => {
      console.log('🔴 Removing GLOBAL message listeners');
      socket.off('receive_private_message', handleIncomingMessage);
    };
  }, [socket, isConnected, handlePushNotification]);

  // Load conversations
  useEffect(() => {
    const loadUserConversations = async () => {
      const userId = getUserId();
      if (!userId) {
        console.error('❌ Cannot load conversations: No user ID found');
        setConversationsError('User not properly authenticated');
        setConversationsLoading(false);
        return;
      }
      
      try {
        setConversationsLoading(true);
        setConversationsError(null);
        
        const response = await chatService.getUserConversations();
        
        if (response.success) {
          setConversations(response.data || []);
        } else {
          setConversations([]);
          setConversationsError(response.message || 'Failed to load conversations');
        }
      } catch (error) {
        console.error('❌ Failed to load conversations:', error);
        setConversations([]);
        setConversationsError(error.message || 'Failed to load conversations');
      } finally {
        setConversationsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadUserConversations();
    }
  }, [isAuthenticated, user]);

  // Load online users
  useEffect(() => {
    const loadOnlineUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getOnlineUsers();
        setOnlineUsersList(response.data || []);
      } catch (error) {
        console.error('Failed to load online users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && getUserId()) {
      loadOnlineUsers();
    }
  }, [user]);

  // Update online users from socket
  useEffect(() => {
    if (onlineUsers.length > 0) {
      setOnlineUsersList(onlineUsers);
    }
  }, [onlineUsers]);

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <Loading text="Checking authentication..." />
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <div className="auth-error">
            <h2>Authentication Required</h2>
            <p>Please log in to access the chat.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle user selection for private chat
  const handleUserSelect = (selectedUser) => {
    const currentUserId = getUserId();
    const selectedUserId = selectedUser?._id || selectedUser?.id;
    
    if (!currentUserId || !selectedUserId) {
      console.error('❌ Cannot create private chat: Missing user IDs');
      return;
    }

    // Create consistent room ID by sorting user IDs alphabetically
    const userIds = [currentUserId, selectedUserId].sort();
    const roomId = `private_${userIds[0]}_${userIds[1]}`;
    
    setSelectedRoom({
      type: 'private',
      id: roomId,
      name: selectedUser.username,
      user: selectedUser,
      isPrivate: true
    });
    setActiveTab('chat');
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    const currentUserId = getUserId();
    const otherParticipant = conversation.participants.find(
      participant => (participant._id || participant.id) !== currentUserId
    );
    
    if (!otherParticipant) {
      console.error('❌ No other participant found in conversation');
      return;
    }

    setSelectedRoom({
      type: 'private',
      id: conversation._id,
      name: otherParticipant.username,
      user: otherParticipant,
      conversation: conversation,
      isPrivate: true
    });
    setActiveTab('chat');
  };

  const handleGlobalChat = () => {
    setSelectedRoom({
      type: 'global',
      id: 'global_chat',
      name: 'Global Chat',
      isPrivate: false
    });
    setActiveTab('chat');
    
    // Join the global chat room via socket
    if (isConnected) {
      joinQuizRoom('global_chat');
    }
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleBackToChats = () => {
    setSelectedRoom(null);
    setActiveTab('chats');
  };

  // Refresh conversations
  const handleRefreshConversations = async () => {
    try {
      setConversationsLoading(true);
      setConversationsError(null);
      
      const response = await chatService.getUserConversations();
      
      if (response.success) {
        setConversations(response.data || []);
      } else {
        setConversationsError(response.message || 'Failed to refresh conversations');
      }
    } catch (error) {
      console.error('❌ Failed to refresh conversations:', error);
      setConversationsError(error.message || 'Failed to refresh conversations');
    } finally {
      setConversationsLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <Helmet>
        <title>Chat - King Ice Quiz App</title>
        <meta name="description" content="Chat with other users on King Ice Quiz App" />
      </Helmet>

      <div className="chat-container">
        {/* Sidebar */}
        {!selectedRoom && (
          <div className="chat-sidebar">
            <div className="sidebar-header">
  <h2>Chat</h2>
  <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
    {isConnected ? '🟢 Online' : '🔴 Offline'}
    {!isConnected && (
      <button 
        onClick={() => window.location.reload()} 
        className="btn-reconnect"
        style={{marginLeft: '10px', padding: '2px 8px', fontSize: '12px'}}
      >
        Retry
      </button>
    )}
  </div>
  <div className="notification-status">
    🔔 Notifications: {notificationSettings.current?.enabled ? 'ON' : 'OFF'}
  </div>
</div>
            {/* Navigation Tabs */}
            <div className="chat-tabs">
              <button
                className={`tab ${activeTab === 'chats' ? 'active' : ''}`}
                onClick={() => setActiveTab('chats')}
              >
                Chats
                {conversations.length > 0 && (
                  <span className="tab-badge">{conversations.length}</span>
                )}
              </button>
              <button
                className={`tab ${activeTab === 'global' ? 'active' : ''}`}
                onClick={() => setActiveTab('global')}
              >
                Global Chat
              </button>
              <button
                className={`tab ${activeTab === 'online' ? 'active' : ''}`}
                onClick={() => setActiveTab('online')}
              >
                Online Users ({onlineUsersList.length})
              </button>
              <button
                className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                Find Users
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'chats' && (
                <ChatsList
                  conversations={conversations}
                  onConversationSelect={handleConversationSelect}
                  loading={conversationsLoading}
                  currentUser={user}
                  onRefresh={handleRefreshConversations}
                  error={conversationsError}
                />
              )}

              {activeTab === 'global' && (
                <div className="global-chat-section">
                  <div className="section-header">
                    <h3>Global Chat</h3>
                    <p>Chat with everyone in the community</p>
                  </div>
                  <button
                    onClick={handleGlobalChat}
                    className="btn btn-primary btn-block"
                    disabled={!isConnected}
                  >
                    {isConnected ? 'Join Global Chat' : 'Connecting...'}
                  </button>
                  
                  {!isConnected && (
                    <div className="connection-help">
                      <p>Having trouble connecting? Try refreshing the page.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'online' && (
                <OnlineUsers
                  users={onlineUsersList}
                  onUserSelect={handleUserSelect}
                  loading={loading}
                  currentUserId={getUserId()}
                />
              )}

              {activeTab === 'search' && (
                <UserSearch
                  onUserSelect={handleUserSelect}
                  onSearchResults={handleSearchResults}
                  currentUserId={getUserId()}
                />
              )}
            </div>

            {/* User Info Footer */}
            <div className="sidebar-footer">
              <div className="user-info">
                <div className="user-avatar">
                  {user?.profile?.picture ? (
                    <img 
                      src={user.profile.picture}
                      alt={user.username}
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <div className="username">@{user?.username}</div>
                  <div className="user-status">
                    {isConnected ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className={`chat-main ${selectedRoom ? 'expanded' : ''}`}>
          {selectedRoom ? (
            <ChatRoom
              room={selectedRoom}
              currentUser={user}
              onBack={handleBackToChats}
            />
          ) : (
            <div className="chat-welcome">
              <div className="welcome-content">
                <h1>Welcome to Chat, {user?.username}!</h1>
                <p>
                  {isConnected 
                    ? 'Select a conversation or start a new chat' 
                    : 'Connecting to chat server...'
                  }
                </p>
                <div className="chat-stats">
                  <div className="stat-item">
                    <div className="stat-value">{conversations.length}</div>
                    <div className="stat-label">Conversations</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{onlineUsersList.length}</div>
                    <div className="stat-label">Users Online</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">
                      {isConnected ? '🟢' : '🔴'}
                    </div>
                    <div className="stat-label">
                      {isConnected ? 'Connected' : 'Connecting'}
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{user?.stats?.messagesSent || 0}</div>
                    <div className="stat-label">Your Messages</div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                {isConnected && (
                  <div className="quick-actions">
                    <button
                      onClick={() => setActiveTab('search')}
                      className="btn btn-primary btn-large"
                    >
                      Start New Chat
                    </button>
                    <button
                      onClick={handleGlobalChat}
                      className="btn btn-outline btn-large"
                    >
                      Join Global Chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;