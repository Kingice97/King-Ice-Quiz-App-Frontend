import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { chatService } from '../../../services/chatService';
import { userService } from '../../../services/userService';
import { chatThemes, getThemeById, applyChatTheme } from '../../../utils/chatThemes';
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
    unsubscribeFromMessages,
    blockUser,
    unblockUser
  } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuMessage, setMenuMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showSecurityMessage, setShowSecurityMessage] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageListenerRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const menuRef = useRef(null);
  const themeSelectorRef = useRef(null);

  // Check if this is the first message in a private chat
  const isFirstMessageInPrivateChat = room.type === 'private' && messages.length === 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (themeSelectorRef.current && !themeSelectorRef.current.contains(event.target)) {
        setShowThemeSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check block status when component loads
  const checkDirectBlockStatus = useCallback(async () => {
    if (room.type === 'private' && room.user && currentUser) {
      try {
        console.log('🔍 Checking block status for user:', room.user._id);
        
        // Method 1: Check current user's blockedUsers array directly
        if (currentUser.blockedUsers && currentUser.blockedUsers.includes(room.user._id)) {
          console.log('✅ User is BLOCKED');
          setIsBlocked(true);
          return true;
        }
        
        // Method 2: Try to get fresh user data from API
        try {
          const response = await userService.getUserById(currentUser._id);
          if (response.success && response.data) {
            const freshUserData = response.data;
            const hasBlocked = freshUserData.blockedUsers && 
                              freshUserData.blockedUsers.includes(room.user._id);
            
            console.log(`🔍 API check: ${hasBlocked ? 'BLOCKED' : 'NOT BLOCKED'}`);
            setIsBlocked(hasBlocked);
            return hasBlocked;
          }
        } catch (apiError) {
          console.log('⚠️ API check failed, using local data');
        }
        
        console.log('🔍 User is NOT BLOCKED');
        setIsBlocked(false);
        return false;
        
      } catch (error) {
        console.error('Error in direct block check:', error);
        setIsBlocked(false);
        return false;
      }
    }
    return false;
  }, [room, currentUser]);

  useEffect(() => {
    const initializeBlockStatus = async () => {
      if (room.type === 'private' && room.user) {
        await checkDirectBlockStatus();
      }
    };
    
    initializeBlockStatus();
  }, [room, checkDirectBlockStatus]);

  // Show security message for first-time private chats
  useEffect(() => {
    if (isFirstMessageInPrivateChat) {
      setShowSecurityMessage(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setShowSecurityMessage(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isFirstMessageInPrivateChat]);

  // Apply selected theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('chatTheme') || 'default';
    setSelectedTheme(savedTheme);
    
    // Check if we're in dark mode
    const isDarkMode = document.body.classList.contains('dark');
    console.log('🌙 Dark mode detected:', isDarkMode);
    
    applyChatTheme(savedTheme, isDarkMode);
  }, []);

  // Also listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDarkMode = document.body.classList.contains('dark');
          console.log('🌙 Dark mode changed:', isDarkMode);
          applyChatTheme(selectedTheme, isDarkMode);
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    
    return () => observer.disconnect();
  }, [selectedTheme]);

  // Force unblock using multiple methods
  const forceUnblockUser = async () => {
    if (room.type === 'private' && room.user) {
      try {
        setBlockLoading(true);
        console.log('🔄 FORCE UNBLOCKING USER...');
        
        // Method 1: Use API unblock
        await userService.unblockUser(room.user._id);
        console.log('✅ API unblock successful');
        
        // Method 2: Use socket unblock
        await unblockUser(room.user._id);
        console.log('✅ Socket unblock successful');
        
        // Method 3: Update local state
        setIsBlocked(false);
        
        // Method 4: Update current user's blockedUsers array
        if (currentUser.blockedUsers) {
          currentUser.blockedUsers = currentUser.blockedUsers.filter(id => 
            id.toString() !== room.user._id.toString()
          );
        }
        
        setMenuMessage(`✅ ${room.user.username} has been unblocked successfully`);
        console.log('✅ Force unblock completed');
        
      } catch (error) {
        console.error('Force unblock failed:', error);
        setMenuMessage('❌ Failed to unblock user: ' + error.message);
      } finally {
        setBlockLoading(false);
        setTimeout(() => setShowMenu(false), 2000);
      }
    }
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    setMenuMessage('');
  };

  const handleViewProfile = async () => {
    if (room.type === 'private' && room.user) {
      try {
        setMenuLoading(true);
        setMenuMessage('Loading profile...');
        
        console.log(`👤 Attempting to view profile for: ${room.user.username}`);
        
        // Directly navigate to the profile page
        const profileUrl = `/profile/${room.user.username}`;
        console.log(`🔗 Opening profile URL: ${profileUrl}`);
        
        // Use window.location for reliable navigation
        window.location.href = profileUrl;
        
      } catch (error) {
        console.error('❌ Failed to open profile:', error);
        setMenuMessage('Failed to open profile');
        
        // Fallback: Try to open in new tab after a delay
        setTimeout(() => {
          const profileUrl = `/profile/${room.user.username}`;
          window.open(profileUrl, '_blank');
        }, 1000);
      } finally {
        setMenuLoading(false);
        setTimeout(() => setShowMenu(false), 2000);
      }
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear this chat? This action cannot be undone.')) {
      try {
        setMenuLoading(true);
        
        if (room.type === 'private') {
          await chatService.clearConversation(room.user._id);
        }
        
        setMessages([]);
        setMenuMessage('Chat cleared successfully');
        
      } catch (error) {
        console.error('Failed to clear chat:', error);
        setMenuMessage('Failed to clear chat');
      } finally {
        setMenuLoading(false);
        setTimeout(() => setShowMenu(false), 2000);
      }
    }
  };

  // Enhanced Chat Theme Handler
  const handleChatTheme = () => {
    setShowThemeSelector(true);
    setShowMenu(false);
  };

  const selectTheme = (themeId) => {
    setSelectedTheme(themeId);
    const isDarkMode = document.body.classList.contains('dark');
    applyChatTheme(themeId, isDarkMode);
    localStorage.setItem('chatTheme', themeId);
    setShowThemeSelector(false);
    setMenuMessage(`Theme changed to ${getThemeById(themeId).name}`);
    setTimeout(() => setMenuMessage(''), 2000);
  };

  // Block/Unblock with better error handling
  const handleBlockUser = async () => {
    if (room.type === 'private' && room.user) {
      try {
        setBlockLoading(true);
        
        if (isBlocked) {
          // Unblock user
          console.log('🔄 Unblocking user...');
          await forceUnblockUser();
        } else {
          // Block user
          if (window.confirm(`Are you sure you want to block ${room.user.username}? You will no longer receive messages from them.`)) {
            console.log('🚫 Blocking user...');
            await userService.blockUser(room.user._id);
            await blockUser(room.user._id);
            setIsBlocked(true);
            setMenuMessage(`${room.user.username} has been blocked`);
            
            setTimeout(() => {
              onBack();
            }, 1500);
          } else {
            setBlockLoading(false);
            return;
          }
        }
        
      } catch (error) {
        console.error('Failed to block/unblock user:', error);
        setMenuMessage('Failed: ' + error.message);
      } finally {
        setBlockLoading(false);
      }
    }
  };

  const handleReport = async () => {
    const reason = prompt(`Please specify the reason for reporting ${room.type === 'private' ? room.user.username : 'this chat'}:\n\nExamples:\n- Inappropriate messages\n- Harassment\n- Spam\n- Fake profile\n- Other violations`);
    
    if (reason && reason.trim()) {
      try {
        setMenuLoading(true);
        
        if (room.type === 'private') {
          await userService.reportUser(room.user._id, reason.trim());
          setMenuMessage('Thank you for your report. We will review it shortly.');
        } else {
          await chatService.reportChat(room.id, reason.trim());
          setMenuMessage('Thank you for reporting this chat. Our team will review it.');
        }
        
      } catch (error) {
        console.error('Failed to submit report:', error);
        setMenuMessage('Failed to submit report: ' + error.message);
      } finally {
        setMenuLoading(false);
        setTimeout(() => setShowMenu(false), 2000);
      }
    }
  };

  // Get consistent private room ID
  const getPrivateRoomId = useCallback(() => {
    if (room.type !== 'private') return room.id;
    
    const currentUserId = currentUser._id || currentUser.id;
    const otherUserId = room.user._id || room.user.id;
    
    const userIds = [currentUserId, otherUserId].sort();
    return `private_${userIds[0]}_${userIds[1]}`;
  }, [room, currentUser]);

  // Load messages when room changes
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
          const response = await loadPrivateMessages(room.user._id);
          loadedMessages = response.messages || [];
          loadedMessages = loadedMessages.reverse();
          
          console.log(`🔐 Loaded ${loadedMessages.length} private messages for room: ${getPrivateRoomId()}`);
          joinPrivateChat(room.user._id);
        }
        
        console.log('📨 Total messages loaded:', loadedMessages.length);
        setMessages(loadedMessages);
        hasLoadedRef.current = true;
        
      } catch (error) {
        console.error('❌ Failed to load messages:', error);
        setError('Failed to load messages. Please try again.');
        setMessages([]); // Ensure messages is always an array
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    return () => {
      hasLoadedRef.current = false;
    };
  }, [room, loadPrivateMessages, joinPrivateChat, getPrivateRoomId]);

  // Subscribe to real-time messages
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
          // Ensure prev is always an array
          const currentMessages = Array.isArray(prev) ? prev : [];
          const exists = currentMessages.some(msg => msg._id === message._id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping duplicate');
            return currentMessages;
          }
          
          const updatedMessages = [...currentMessages, message];
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle sending messages with better error handling
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
      
      // If error is about blocking, update our state
      if (error.message.includes('blocked')) {
        setIsBlocked(true);
        setError('You have blocked this user. Unblock them to send messages.');
      } else {
        setError(error.message || 'Failed to send message. Please try again.');
      }
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
      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <div className="theme-selector-overlay">
          <div className="theme-selector-modal" ref={themeSelectorRef}>
            <div className="theme-selector-header">
              <h3>Choose Chat Theme</h3>
              <button 
                className="close-theme-selector"
                onClick={() => setShowThemeSelector(false)}
              >
                ×
              </button>
            </div>
            <div className="themes-grid">
              {chatThemes.map(theme => (
                <div 
                  key={theme.id}
                  className={`theme-card ${selectedTheme === theme.id ? 'selected' : ''}`}
                  onClick={() => selectTheme(theme.id)}
                >
                  <div 
                    className="theme-preview"
                    style={{
                      background: theme.colors.background,
                      border: `2px solid ${theme.colors.primary}`
                    }}
                  >
                    <div 
                      className="theme-bubble sent"
                      style={{ background: theme.colors.sentBubble }}
                    />
                    <div 
                      className="theme-bubble received"
                      style={{ background: theme.colors.receivedBubble }}
                    />
                  </div>
                  <div className="theme-info">
                    <h4>{theme.name}</h4>
                    <p>{theme.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
            <div className="user-name">
              {room.name}
              {isBlocked && <span className="blocked-badge">🚫 Blocked</span>}
            </div>
            <div className="user-status">
              {room.type === 'private' 
                ? (room.user?.isOnline ? 'online' : 'offline')
                : `${currentTypingUsers.length > 0 ? currentTypingUsers.length + ' typing' : 'Group chat'}`
              }
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-actions" ref={menuRef}>
            <button className="action-button" onClick={toggleMenu} disabled={menuLoading}>
              {menuLoading ? (
                <div className="menu-loading-spinner"></div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              )}
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                {menuMessage && (
                  <div className="menu-message">
                    {menuMessage}
                  </div>
                )}
                {room.type === 'private' && (
                  <>
                    <button className="menu-item" onClick={handleViewProfile} disabled={menuLoading}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      View Profile
                    </button>
                    
                    {isBlocked && (
                      <button 
                        className="menu-item force-unblock-item" 
                        onClick={forceUnblockUser}
                        disabled={blockLoading || menuLoading}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                        </svg>
                        {blockLoading ? 'Unblocking...' : 'Force Unblock'}
                      </button>
                    )}
                  </>
                )}
                
                {/* Enhanced Chat Theme Option */}
                <button className="menu-item" onClick={handleChatTheme} disabled={menuLoading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-5-8a5 5 0 1110 0 5 5 0 01-10 0z"/>
                  </svg>
                  Chat Theme
                </button>
                
                <button className="menu-item" onClick={handleClearChat} disabled={menuLoading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  Clear Chat
                </button>
                {room.type === 'private' && (
                  <button 
                    className={`menu-item ${isBlocked ? 'unblock-item' : 'block-item'}`} 
                    onClick={handleBlockUser} 
                    disabled={blockLoading || menuLoading}
                  >
                    {blockLoading ? (
                      <div className="menu-loading-spinner small"></div>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                        </svg>
                        {isBlocked ? 'Unblock User' : 'Block User'}
                      </>
                    )}
                  </button>
                )}
                <button className="menu-item report-item" onClick={handleReport} disabled={menuLoading}>
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
        ) : !messages || messages.length === 0 ? (
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
          <>
            {/* Security Message for First-Time Private Chats */}
            {showSecurityMessage && room.type === 'private' && (
              <div className="security-message">
                <div className="security-icon">🔒</div>
                <div className="security-content">
                  <strong>Messages are secured with end-to-end encryption</strong>
                  <p>Only you and {room.user?.username} can read or listen to them. No one else, not even King Ice Quiz, can access them.</p>
                  <button 
                    className="security-learn-more"
                    onClick={() => {
                      window.location.href = '/privacy-policy';
                    }}
                  >
                    Learn more
                  </button>
                </div>
                <button 
                  className="security-dismiss"
                  onClick={() => setShowSecurityMessage(false)}
                  aria-label="Dismiss security message"
                >
                  ×
                </button>
              </div>
            )}
            
            {messages.map((message, index) => {
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
            })}
          </>
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
            type="search"
            value={newMessage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            placeholder={isBlocked ? "You have blocked this user" : "Type a message"}
            className="message-input"
            maxLength={500}
            disabled={sending || !isConnected || isBlocked}
            inputMode="text"  // Prevents emoji keyboard on mobile
            enterKeyHint="send"  // Changes enter key to "send" on mobile
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending || !isConnected || isBlocked}
            className={`send-button ${sending ? 'sending' : ''} ${isBlocked ? 'blocked' : ''}`}
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