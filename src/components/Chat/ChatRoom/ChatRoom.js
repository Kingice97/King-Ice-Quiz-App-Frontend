import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { chatService } from '../../../services/chatService';
import Loading from '../../common/Loading/Loading';
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
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageListenerRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleViewProfile = () => {
    if (room.type === 'private' && room.user) {
      window.open(`/profile/${room.user.username}`, '_blank');
    }
    setShowMenu(false);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this chat?')) {
      // Add clear chat functionality here
      console.log('Clear chat:', room.id);
    }
    setShowMenu(false);
  };

  const handleBlockUser = () => {
    if (room.type === 'private' && window.confirm(`Block ${room.user.username}?`)) {
      // Add block user functionality here
      console.log('Block user:', room.user._id);
    }
    setShowMenu(false);
  };

  const handleReport = () => {
    if (window.confirm('Report this chat for inappropriate content?')) {
      // Add report functionality here
      console.log('Report chat:', room.id);
    }
    setShowMenu(false);
  };

  // ✅ FIXED: Get consistent private room ID
  const getPrivateRoomId = useCallback(() => {
    if (room.type !== 'private') return room.id;
    
    const currentUserId = currentUser._id || currentUser.id;
    const otherUserId = room.user._id || room.user.id;
    
    const userIds = [currentUserId, otherUserId].sort();
    return `private_${userIds[0]}_${userIds[1]}`;
  }, [room, currentUser]);

  // ✅ FIXED: Load messages when room changes
  useEffect(() => {
    if (hasLoadedRef.current) {
      console.log('🔄 Already loaded messages for this room, skipping');
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        setError('');
        console.log(`📥 Loading messages for room: ${room.id} (${room.type})`);
        
        let loadedMessages = [];
        
        if (room.type === 'quiz') {
          const response = await chatService.getQuizMessages(room.id, 200);
          loadedMessages = response.data || [];
        } else if (room.type === 'global') {
          const response = await chatService.getGlobalMessages(200);
          loadedMessages = response.data || [];
        } else if (room.type === 'private') {
          // ✅ Load private messages
          const response = await loadPrivateMessages(room.user._id);
          loadedMessages = response.messages || [];
          
          // ✅ FIXED: Reverse the messages to show oldest first (since backend sends newest first)
          loadedMessages = loadedMessages.reverse();
          
          console.log(`🔐 Loaded ${loadedMessages.length} private messages for room: ${getPrivateRoomId()}`);
          
          // Join private chat room
          joinPrivateChat(room.user._id);
        }
        
        console.log('📨 Total messages loaded:', loadedMessages.length);
        setMessages(loadedMessages);
        hasLoadedRef.current = true;
        
      } catch (error) {
        console.error('❌ Failed to load messages:', error);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    return () => {
      hasLoadedRef.current = false;
    };
  }, [room, loadPrivateMessages, joinPrivateChat, getPrivateRoomId]);

  // ✅ FIXED: Subscribe to real-time messages
  useEffect(() => {
    if (!isConnected) {
      console.log('⚠️ Socket not connected, skipping message subscription');
      return;
    }

    console.log(`🔗 Subscribing to messages for room: ${room.id}`);

    const handleNewMessage = (message) => {
      console.log('📩 New message received:', message);
      
      let belongsToRoom = false;
      
      if (room.type === 'quiz') {
        belongsToRoom = message.quiz === room.id || message.room === `quiz_${room.id}`;
      } else if (room.type === 'global') {
        belongsToRoom = message.room === 'global_chat' || message.type === 'global';
      } else if (room.type === 'private') {
        const privateRoomId = getPrivateRoomId();
        belongsToRoom = message.room === privateRoomId || 
                       (message.conversation && room.conversation && message.conversation === room.conversation._id);
      }
      
      if (belongsToRoom) {
        console.log('✅ Message belongs to current room, adding to messages');
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping duplicate');
            return prev;
          }
          
          const updatedMessages = [...prev, message];
          console.log(`📊 Messages count: ${updatedMessages.length}`);
          return updatedMessages;
        });
      }
    };

    messageListenerRef.current = handleNewMessage;
    subscribeToMessages(handleNewMessage);

    return () => {
      console.log(`🔴 Unsubscribing from messages for room: ${room.id}`);
      if (messageListenerRef.current) {
        unsubscribeFromMessages(messageListenerRef.current);
      }
    };
  }, [isConnected, room, subscribeToMessages, unsubscribeFromMessages, getPrivateRoomId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError('');
      
      const messageText = newMessage.trim();
      console.log('📤 Sending message:', messageText);

      if (room.type === 'private') {
        await sendPrivateMessage(room.user._id, messageText);
      } else if (room.type === 'quiz') {
        await sendMessage(room.id, messageText);
      } else if (room.type === 'global') {
        await sendMessage('global_chat', messageText);
      }

      setNewMessage('');
      
      if (isTyping) {
        setIsTyping(false);
        handleStopTyping();
      }

      console.log('✅ Message sent successfully');

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleStartTyping = () => {
    if (isTyping) return;
    
    setIsTyping(true);
    
    let roomId;
    if (room.type === 'quiz') {
      roomId = room.id;
    } else if (room.type === 'global') {
      roomId = 'global_chat';
    } else if (room.type === 'private') {
      roomId = room.user._id;
    }
    
    if (roomId) {
      startTyping(roomId);
    }
  };

  const handleStopTyping = () => {
    if (!isTyping) return;
    
    setIsTyping(false);
    
    let roomId;
    if (room.type === 'quiz') {
      roomId = room.id;
    } else if (room.type === 'global') {
      roomId = 'global_chat';
    } else if (room.type === 'private') {
      roomId = room.user._id;
    }
    
    if (roomId) {
      stopTyping(roomId);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (value.trim()) {
      if (!isTyping) {
        handleStartTyping();
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 1000);
      
    } else {
      if (isTyping) {
        handleStopTyping();
      }
    }
  };

  const handleInputBlur = () => {
    if (isTyping) {
      handleStopTyping();
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

  // WhatsApp-style message status
  const renderMessageStatus = (message) => {
    if (message.type !== 'private' || message.user !== currentUser._id) {
      return null;
    }

    if (!message.isDelivered) {
      return <span className="message-status single-tick" title="Sent">✓</span>;
    } else if (message.isDelivered && !message.isRead) {
      return <span className="message-status double-tick" title="Delivered">✓✓</span>;
    } else if (message.isRead) {
      return <span className="message-status double-tick read" title="Read">✓✓</span>;
    }
    
    return null;
  };

  const currentTypingUsers = typingUsers[room.id] || [];

  return (
    <div className="chat-room">
      {/* WhatsApp-style Fixed Header */}
      <div className="chat-header">
        <div className="header-left">
          <button onClick={onBack} className="back-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <div className="user-avatar">
            {room.type === 'private' && room.user?.profile?.picture ? (
              <img src={room.user.profile.picture} alt={room.user.username} />
            ) : (
              <div className="avatar-placeholder">
                {room.type === 'private' ? room.user?.username?.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{room.name}</div>
            <div className="user-status">
              {room.type === 'private' 
                ? (room.user?.isOnline ? 'online' : 'offline')
                : `${onlineUsersList.length} users online`
              }
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-actions" ref={menuRef}>
            <button className="action-button" onClick={toggleMenu}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                {room.type === 'private' && (
                  <button className="menu-item" onClick={handleViewProfile}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    View Profile
                  </button>
                )}
                <button className="menu-item" onClick={handleClearChat}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  Clear Chat
                </button>
                {room.type === 'private' && (
                  <button className="menu-item" onClick={handleBlockUser}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                    </svg>
                    Block User
                  </button>
                )}
                <button className="menu-item" onClick={handleReport}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}

      <div className="messages-container">
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
                <div className={`message ${isOwnMessage ? 'message-sent' : 'message-received'}`}>
                  {!isOwnMessage && room.type === 'global' && (
                    <div className="message-avatar">
                      {message.profilePicture ? (
                        <img src={message.profilePicture} alt={message.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {message.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="message-bubble">
                    {/* ✅ FIXED: Only show username for global chats, not private */}
                    {!isOwnMessage && room.type === 'global' && (
                      <div className="sender-name">{message.username}</div>
                    )}
                    <div className="message-text">{message.message}</div>
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                      {isOwnMessage && renderMessageStatus(message)}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {currentTypingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {currentTypingUsers.join(', ')} is typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="message-input"
            maxLength={500}
            disabled={sending || !isConnected}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending || !isConnected}
            className={`send-button ${sending ? 'sending' : ''}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;