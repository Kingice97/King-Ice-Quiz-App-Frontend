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
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageListenerRef = useRef(null);
  const hasLoadedRef = useRef(false);

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

  const currentTypingUsers = typingUsers[room.id] || [];

  return (
    <div className="chat-room">
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

      {error && (
        <div className="chat-error">
          {error}
        </div>
      )}

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