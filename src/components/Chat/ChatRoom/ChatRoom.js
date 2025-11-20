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

  const getPrivateRoomId = useCallback(() => {
    if (room.type !== 'private') return room.id;
    
    const currentUserId = currentUser._id || currentUser.id;
    const otherUserId = room.user._id || room.user.id;
    
    const userIds = [currentUserId, otherUserId].sort();
    return `private_${userIds[0]}_${userIds[1]}`;
  }, [room, currentUser]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError('');
        
        let response;
        if (room.type === 'quiz') {
          response = await chatService.getQuizMessages(room.id, 50);
        } else if (room.type === 'global') {
          response = await chatService.getGlobalMessages(50);
        } else if (room.type === 'private') {
          const privateRoomId = getPrivateRoomId();
          response = await loadPrivateMessages(room.user._id);
          joinPrivateChat(room.user._id);
        }
        
        if (room.type === 'private') {
          setMessages(response.messages || []);
        } else {
          setMessages(response.data || []);
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

  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (message) => {
      let belongsToRoom = false;
      
      if (room.type === 'quiz') {
        belongsToRoom = message.quiz === room.id;
      } else if (room.type === 'global') {
        belongsToRoom = message.room === 'global_chat';
      } else if (room.type === 'private') {
        const privateRoomId = getPrivateRoomId();
        belongsToRoom = message.room === privateRoomId;
      }
      
      if (belongsToRoom) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    subscribeToMessages(handleNewMessage);

    return () => {
      unsubscribeFromMessages(handleNewMessage);
    };
  }, [isConnected, room, subscribeToMessages, unsubscribeFromMessages, getPrivateRoomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError('');
      
      if (room.type === 'private') {
        await sendPrivateMessage(room.user._id, newMessage.trim());
      } else if (room.type === 'quiz') {
        await sendMessage(room.id, newMessage.trim());
      } else if (room.type === 'global') {
        await sendMessage('global_chat', newMessage.trim());
      }

      setNewMessage('');
      
      if (isTyping) {
        setIsTyping(false);
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
    
    if (value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
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
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
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

  const currentTypingUsers = typingUsers[room.id] || [];

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <button onClick={onBack} className="btn-back">← Back</button>
        <div className="room-info">
          <h3>{room.name}</h3>
          <p className="room-description">
            {room.type === 'private' 
              ? `Private chat with ${room.user?.username}` 
              : room.type === 'global' 
                ? 'Community chat room' 
                : `Quiz: ${room.quizTitle || 'Discussion'}`
            }
          </p>
        </div>
        <div className="room-stats">
          <span className="message-count">{messages.length} messages</span>
          {currentTypingUsers.length > 0 && (
            <div className="typing-status">
              {currentTypingUsers.join(', ')} typing...
            </div>
          )}
        </div>
      </div>

      {error && <div className="chat-error">{error}</div>}

      <div className="chat-room-messages">
        {loading ? (
          <Loading text="Loading messages..." />
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.user === (currentUser._id || currentUser.id);
            
            return (
              <div key={message._id} className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}>
                <div className="message-avatar">
                  {message.profilePicture ? (
                    <img src={message.profilePicture} alt={message.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {message.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-username">
                      {isOwnMessage ? 'You' : message.username}
                    </span>
                    <span className="message-time">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="message-text">
                    {message.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {currentTypingUsers.length > 0 && (
          <div className="typing-indicator">
            <span>{currentTypingUsers.join(', ')} typing...</span>
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
            onKeyPress={handleKeyPress}
            placeholder={`Message ${room.name}...`}
            className="message-input"
            disabled={sending}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="btn-send"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;