import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { chatService } from '../../../services/chatService';
import Loading from '../../common/Loading/Loading';
import { sendChatNotification } from '../../../services/notificationService';
import './ChatRoom.css';

const ChatRoom = ({ room, currentUser, onBack }) => {
  const { 
    sendMessage, 
    sendPrivateMessage,
    loadPrivateMessages,
    joinPrivateChat,
    startTyping, 
    stopTyping, 
    typingUsers,
    isConnected,
    subscribeToMessages,
    unsubscribeFromMessages
  } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastMessageRef = useRef(null); // Track last message to avoid duplicates

  // ✅ FIXED: Get the actual private chat room ID
  const getPrivateRoomId = useCallback(() => {
    if (room.type !== 'private') return room.id;
    
    const currentUserId = currentUser._id || currentUser.id;
    const otherUserId = room.user._id || room.user.id;
    
    // Create consistent room ID by sorting user IDs alphabetically
    const userIds = [currentUserId, otherUserId].sort();
    return `private_${userIds[0]}_${userIds[1]}`;
  }, [room, currentUser]);

  // ✅ FIXED: Improved notification logic
  const shouldSendNotification = useCallback((message) => {
    // Don't send notification if:
    // 1. It's our own message
    const isOwnMessage = message.user === currentUser._id || 
                        message.username === currentUser.username;
    
    // 2. We're currently viewing this chat room
    const isViewingThisRoom = document.visibilityState === 'visible';
    
    // 3. It's a duplicate message
    const isDuplicate = lastMessageRef.current === message._id;
    
    console.log('🔔 Notification Check:', {
      isOwnMessage,
      isViewingThisRoom,
      isDuplicate,
      messageId: message._id,
      lastMessage: lastMessageRef.current
    });
    
    return !isOwnMessage && !isViewingThisRoom && !isDuplicate;
  }, [currentUser]);

  // ✅ FIXED: Send push notification for new messages
  const sendPushNotification = useCallback((message) => {
    if (!shouldSendNotification(message)) {
      console.log('🔕 Skipping notification - conditions not met');
      return;
    }
    
    console.log('📱 Sending push notification for message:', message);
    
    // Update last message reference
    lastMessageRef.current = message._id;
    
    // Send the notification
    sendChatNotification(message.username, message.message);
    
    // Also try to use service worker for background notifications
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(`New message from ${message.username}`, {
          body: message.message.length > 100 ? 
                message.message.substring(0, 100) + '...' : 
                message.message,
          icon: '/brain-icon.png',
          badge: '/brain-icon.png',
          vibrate: [200, 100, 200],
          tag: `chat-${message.room}`,
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
      }).catch(error => {
        console.error('❌ Service Worker notification failed:', error);
        // Fallback to regular notification
        sendChatNotification(message.username, message.message);
      });
    }
  }, [shouldSendNotification]);

  // ✅ UPDATED: Load messages when room changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError('');
        console.log(`📥 Loading messages for room: ${room.id} (${room.type})`);
        
        let response;
        if (room.type === 'quiz') {
          response = await chatService.getQuizMessages(room.id, 50);
        } else if (room.type === 'global') {
          response = await chatService.getGlobalMessages(50);
        } else if (room.type === 'private') {
          // ✅ Load private messages using the actual room ID
          const privateRoomId = getPrivateRoomId();
          console.log(`🔐 Loading private messages for room: ${privateRoomId}`);
          response = await loadPrivateMessages(room.user._id);
          // Join private chat room
          joinPrivateChat(room.user._id);
        }
        
        console.log('📨 Loaded messages:', response.messages?.length || response.data?.length || 0);
        
        if (room.type === 'private') {
          setMessages(response.messages || []);
        } else {
          setMessages(response.data || []);
        }
        
        // Set last message reference
        if (response.messages?.length > 0 || response.data?.length > 0) {
          const lastMsg = response.messages?.[response.messages.length - 1] || 
                         response.data?.[response.data.length - 1];
          lastMessageRef.current = lastMsg._id;
        }
        
      } catch (error) {
        console.error('❌ Failed to load messages:', error);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [room, loadPrivateMessages, joinPrivateChat, getPrivateRoomId]);

  // ✅ FIXED: Subscribe to real-time messages with proper notification triggering
  useEffect(() => {
    if (!isConnected) return;

    console.log(`🔗 Subscribing to messages for room: ${room.id}`);

    const handleNewMessage = (message) => {
      console.log('📩 New message received:', message);
      
      // ✅ FIXED: Proper room matching for private messages
      let belongsToRoom = false;
      
      if (room.type === 'quiz') {
        belongsToRoom = message.quiz === room.id;
      } else if (room.type === 'global') {
        belongsToRoom = message.room === 'global_chat';
      } else if (room.type === 'private') {
        // For private messages, check if it matches the actual private room ID
        const privateRoomId = getPrivateRoomId();
        belongsToRoom = message.room === privateRoomId;
      }
      
      if (belongsToRoom) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          
          console.log('💬 Adding new message to state');
          return [...prev, message];
        });

        // ✅ FIXED: Send push notification for new incoming messages
        console.log('🔔 Checking if should send notification for message:', message);
        sendPushNotification(message);
      }
    };

    subscribeToMessages(handleNewMessage);

    return () => {
      console.log(`🔴 Unsubscribing from messages for room: ${room.id}`);
      unsubscribeFromMessages(handleNewMessage);
    };
  }, [isConnected, room, subscribeToMessages, unsubscribeFromMessages, getPrivateRoomId, sendPushNotification]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ UPDATED: Handle sending messages for all room types
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError('');
      
      console.log('📤 Sending message:', newMessage.trim());

      if (room.type === 'private') {
        // ✅ Handle private messages (works for offline users too)
        await sendPrivateMessage(room.user._id, newMessage.trim());
      } else if (room.type === 'quiz') {
        await sendMessage(room.id, newMessage.trim());
      } else if (room.type === 'global') {
        await sendMessage('global_chat', newMessage.trim());
      }

      // Clear input immediately for better UX
      setNewMessage('');
      
      // Stop typing
      if (isTyping) {
        setIsTyping(false);
        // Use correct room ID for typing
        let typingRoomId;
        if (room.type === 'private') {
          typingRoomId = room.user._id;
        } else if (room.type === 'quiz') {
          typingRoomId = room.id;
        } else if (room.type === 'global') {
          typingRoomId = 'global_chat';
        }
        stopTyping(typingRoomId);
      }

      console.log('✅ Message sent successfully');

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing indicators
    if (value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        
        // ✅ Use correct room ID for typing
        let roomId;
        if (room.type === 'quiz') {
          roomId = room.id;
        } else if (room.type === 'global') {
          roomId = 'global_chat';
        } else if (room.type === 'private') {
          roomId = room.user._id;
        }
        
        startTyping(roomId);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        
        // ✅ Use correct room ID for typing
        let roomId;
        if (room.type === 'quiz') {
          roomId = room.id;
        } else if (room.type === 'global') {
          roomId = 'global_chat';
        } else if (room.type === 'private') {
          roomId = room.user._id;
        }
        
        stopTyping(roomId);
      }, 1000);
      
    } else {
      if (isTyping) {
        setIsTyping(false);
        
        // ✅ Use correct room ID for typing
        let roomId;
        if (room.type === 'quiz') {
          roomId = room.id;
        } else if (room.type === 'global') {
          roomId = 'global_chat';
        } else if (room.type === 'private') {
          roomId = room.user._id;
        }
        
        stopTyping(roomId);
      }
    }
  };

  const handleInputBlur = () => {
    if (isTyping) {
      setIsTyping(false);
      
      // ✅ Use correct room ID for typing
      let roomId;
      if (room.type === 'quiz') {
        roomId = room.id;
      } else if (room.type === 'global') {
        roomId = 'global_chat';
      } else if (room.type === 'private') {
        roomId = room.user._id;
      }
      
      stopTyping(roomId);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const currentTypingUsers = typingUsers[room.id] || [];

  return (
    <div className="chat-room">
      {/* Chat Header */}
      <div className="chat-room-header">
        <button onClick={onBack} className="btn-back">
          ← Back
        </button>
        <div className="room-info">
          <h3>{room.name}</h3>
          <p className="room-description">
            {room.type === 'private' 
              ? `Private chat with ${room.user?.username} ${!room.user?.isOnline ? '(Offline)' : ''}` 
              : room.type === 'global' 
                ? 'Community chat room' 
                : `Quiz: ${room.quizTitle || 'Discussion'}`
            }
            {!isConnected && ' (Connecting...)'}
          </p>
        </div>
        <div className="room-stats">
          <span className="message-count">{messages.length} messages</span>
          {currentTypingUsers.length > 0 && (
            <div className="typing-status">
              {currentTypingUsers.join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-room-messages">
        {loading ? (
          <Loading text="Loading messages..." />
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">💬</div>
            <p>No messages yet</p>
            <p className="no-messages-subtitle">
              {room.type === 'private' && !room.user?.isOnline 
                ? `${room.user?.username} is offline. Your messages will be delivered when they come online.`
                : 'Start the conversation!'
              }
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate = index === 0 || 
              formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
            
            const isOwnMessage = message.user === currentUser._id || 
                               message.username === currentUser.username;

            return (
              <React.Fragment key={message._id || `message-${index}-${message.timestamp}`}>
                {showDate && (
                  <div className="date-divider">
                    <span>{formatDate(message.timestamp)}</span>
                  </div>
                )}
                <div
                  className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-avatar">
                    {message.profilePicture ? (
                      <img 
                        src={message.profilePicture}
                        alt={message.username}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`avatar-placeholder ${message.profilePicture ? 'avatar-fallback' : ''}`}>
                      {message.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-username">
                        {isOwnMessage ? 'You' : message.username}
                      </span>
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                        {message.type === 'private' && !message.isDelivered && isOwnMessage && (
                          <span title="Not delivered yet"> • ⏳</span>
                        )}
                        {message.type === 'private' && message.isDelivered && !message.isRead && isOwnMessage && (
                          <span title="Delivered"> • ✅</span>
                        )}
                        {message.type === 'private' && message.isRead && isOwnMessage && (
                          <span title="Read"> • 👁️</span>
                        )}
                      </span>
                    </div>
                    <div className="message-text">
                      {message.message}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {currentTypingUsers.join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="chat-room-input">
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            placeholder={
              room.type === 'private' 
                ? `Message ${room.user?.username}...` 
                : `Message ${room.name}...`
            }
            className="message-input"
            maxLength={500}
            disabled={sending || !isConnected}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending || !isConnected}
            className={`btn-send ${sending ? 'sending' : ''}`}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="input-info">
          <span>
            {!isConnected ? 'Connecting to chat...' : 'Press Enter to send'}
            {room.type === 'private' && !room.user?.isOnline && ' • User is offline'}
          </span>
          <span>{newMessage.length}/500</span>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;