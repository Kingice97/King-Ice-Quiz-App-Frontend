import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { chatService } from '../../../services/chatService';
import Loading from '../../common/Loading/Loading';
import './QuizChat.css';

const QuizChat = ({ quizId, quizTitle, onClose }) => {
  const { user } = useAuth();
  const { 
    sendMessage, 
    startTyping, 
    stopTyping, 
    getQuizMessages, 
    typingUsers 
  } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await chatService.getQuizMessages(quizId);
        setMessages(response.data || []);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [quizId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get real-time messages from socket
  useEffect(() => {
    const socketMessages = getQuizMessages(quizId);
    if (socketMessages.length > 0) {
      setMessages(socketMessages);
    }
  }, [getQuizMessages, quizId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    sendMessage(quizId, newMessage);
    setNewMessage('');
    stopTyping(quizId);
    setIsTyping(false);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(quizId);
    } else if (!e.target.value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(quizId);
    }
  };

  const handleInputBlur = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(quizId);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const currentTypingUsers = typingUsers[quizId] || [];

  return (
    <div className="quiz-chat">
      {/* Chat Header */}
      <div className="chat-header">
        <h3>Quiz Chat</h3>
        <button onClick={onClose} className="btn-close" title="Close Chat">
          ×
        </button>
      </div>

      {/* Chat Messages */}
      <div className="chat-messages">
        {loading ? (
          <Loading text="Loading messages..." />
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message ${message.user === user._id ? 'own-message' : 'other-message'}`}
            >
              <div className="message-avatar">
                {message.profilePicture ? (
                  <img 
                    src={`${process.env.REACT_APP_API_URL || 'https://king-ice-quiz-app.onrender.com'}${message.profilePicture}`} 
                    alt={message.username}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {message.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-username">
                    {message.user === user._id ? 'You' : message.username}
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
          ))
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
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="chat-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Type your message..."
            className="chat-input"
            maxLength={500}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="btn-send"
          >
            Send
          </button>
        </div>
        <div className="chat-input-info">
          <span>Press Enter to send</span>
          <span>{newMessage.length}/500</span>
        </div>
      </form>
    </div>
  );
};

export default QuizChat;