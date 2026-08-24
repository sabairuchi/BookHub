import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { aiAPI } from '../services/api';
import { Link, useLocation } from 'react-router-dom';
import './AIAssistant.css';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Hi there! I am your Book Hub Assistant. How can I help you find a book or answer any questions?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if user is on a book details page to pass context
      let contextBookId = null;
      if (location.pathname.startsWith('/book/')) {
        const parts = location.pathname.split('/');
        contextBookId = parts[2];
      }

      // We only send the last few messages to save tokens, or send all. We'll send all for now.
      const response = await aiAPI.chat([...messages, userMessage], contextBookId);
      
      setMessages(prev => [...prev, { role: 'model', content: response.message }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        isError: true,
        content: 'Sorry, I am having trouble connecting right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Helper to format text with bold and links if ID is provided
  const formatMessage = (text) => {
    // Basic regex to find (ID: 123) and replace with a link
    const parts = text.split(/(?:\(ID:\s*(\d+)\))/g);
    
    if (parts.length === 1) {
      return text;
    }

    return parts.map((part, index) => {
      if (index % 2 === 1) { // It's the ID captured group
        return (
          <Link key={index} to={`/book/${part}`} className="ai-message-link" onClick={() => setIsOpen(false)}>
            View Book
          </Link>
        );
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />;
    });
  };

  return (
    <div className="ai-assistant-container">
      {isOpen && (
        <div className="ai-assistant-window">
          <div className="ai-header">
            <span>Book Hub Assistant</span>
            <button className="ai-header-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="ai-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                {msg.role === 'model' && !msg.isError ? formatMessage(msg.content) : msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="ai-loading">
                <div className="ai-loading-dot"></div>
                <div className="ai-loading-dot"></div>
                <div className="ai-loading-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-area">
            <input 
              type="text" 
              className="ai-input" 
              placeholder="Ask for a book recommendation..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              className="ai-send-btn" 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="ai-assistant-toggle" onClick={() => setIsOpen(true)}>
          <Bot size={28} />
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
