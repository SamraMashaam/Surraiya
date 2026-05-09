import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Trash2, X } from 'lucide-react';
import './Styles/TherapyChatbot.css';

const ChatMessage = ({ message, isUser }) => (
  <div className={`message-row ${isUser ? 'user' : 'bot'}`}>
    <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
      <div className="message-sender">
        {isUser ? 'You' : 'Mira'}
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  </div>
);

const TherapyChatbot = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
const userId = storedUser ? storedUser.id : null;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [contextBanner, setContextBanner] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
    checkForMoodContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkForMoodContext = () => {
    const context = localStorage.getItem('chatbot_context');
    if (context) {
      try {
        const parsedContext = JSON.parse(context);
        setContextBanner(parsedContext);
        // Don't clear it immediately - let user dismiss it
      } catch (err) {
        console.error('Error parsing context:', err);
      }
    }
  };

  const dismissContext = () => {
    setContextBanner(null);
    localStorage.removeItem('chatbot_context');
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_ANALYSIS_API_URL}/api/chat/${userId}/history`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.messages.length > 0) {
          const formattedMessages = data.messages.map(msg => ({
            content: msg.content,
            isUser: msg.role === 'user',
            id: msg.id
          }));
          setMessages(formattedMessages);
        } else {
          setMessages([{
            content: "Hello! I'm Mira, here to help you with productivity tips and support. What would you like to talk about today?",
            isUser: false
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setMessages([{
        content: "Hello! I'm Mira, here to help you with productivity tips and support. What would you like to talk about today?",
        isUser: false
      }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_ANALYSIS_API_URL}/api/chat/${userId}/history`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages([{
          content: "Chat history cleared. How can I help you today?",
          isUser: false
        }]);
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      alert('Failed to clear history');
    }
  };

  const sendMessage = async (e, customMessage = null) => {
    if (e) e.preventDefault();

    let messageToSend = customMessage || inputMessage;
    
    if (!messageToSend.trim() || isLoading) return;

    // If there's context banner active, prepend the journal entry to the message
    if (contextBanner && !customMessage) {
      messageToSend = `I just wrote in my journal: "${contextBanner.content}"\n\nI'm feeling ${contextBanner.emotion}. ${messageToSend}`;
    }

    const userMessage = {
      content: customMessage || inputMessage, 
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    let systemPrompt = "You are a helpful productivity assistant for people with autism and ADHD who require help with managing their work. Please be empathetic, supportive, and provide helpful guidance.";
    
    if (contextBanner) {
      systemPrompt = `You are a helpful mental health and productivity assistant. The user is seeking support after writing a journal entry where they expressed feeling ${contextBanner.emotion}. They wrote: "${contextBanner.content}". Please provide empathetic, supportive, and actionable guidance that addresses their specific situation and concerns, not just their emotion in general.`;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_ANALYSIS_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          user_id: userId,
          system_prompt: systemPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const botMessage = {
        content: data.content,
        isUser: false,
        id: data.id
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (contextBanner) {
        setTimeout(() => {
          dismissContext();
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error:', error);

      const errorMessage = {
        content: "I'm having trouble connecting right now. Please try again later.",
        isUser: false
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleContextClick = () => {
    const contextMessage = `I just wrote in my journal: "${contextBanner.content}"\n\nI'm feeling ${contextBanner.emotion} and I'd like to talk about it. Can you help me?`;
    sendMessage(null, contextMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingHistory) {
    return (
      <div className="chat-wrapper">
        <div className="chat-header">
          <h1>Loading conversation...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div>
          <h1>Let's Chat</h1>
          <p>Talk with Mira: Your supportive productivity assistant. Ask for tips, share your feelings, or just have a chat.</p>
        </div>
        <button 
          onClick={clearHistory}
          className="clear-history-btn"
          title="Clear chat history"
        >
          <Trash2 size={18} />
          Clear History
        </button>
      </div>

      {contextBanner && (
        <div className="context-banner">
          <div className="context-banner-content">
            <div>
              <strong>Journal Entry Context</strong>
              <p>You're feeling {contextBanner.emotion}. Mira is ready to help you work through this.</p>
            </div>
            <div className="context-banner-actions">
              <button 
                onClick={handleContextClick}
                className="context-action-btn primary"
              >
                Talk about it
              </button>
              <button 
                onClick={dismissContext}
                className="context-action-btn secondary"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isUser={message.isUser}
          />
        ))}

        {isLoading && (
          <div className="loading-bubble">
            <div className="loading-inner">
              <Loader size={16} className="spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            className="chat-textarea"
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            <Send size={18} />
            Send
          </button>
        </div>

        <div className="chat-disclaimer">
          This is an AI assistant for support and information only.
          If you are in crisis, refer to human help.
        </div>
      </div>
    </div>
  );
};

export default TherapyChatbot;