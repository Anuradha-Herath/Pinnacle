"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaUser, FaTimes, FaCommentDots } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';

interface ChatMessage {
  isUser: boolean;
  text: string;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      isUser: false,
      text: "Hi there! I'm Pinnacle Assistant. How can I help you with your fashion needs today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    // Add user message to chat history
    const userMessage = {
      isUser: true,
      text: message.trim(),
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // Format chat history for the API
      const apiChatHistory = chatHistory.map(msg => ({
        isUser: msg.isUser,
        text: msg.text
      }));
      
      // Call the chatbot API
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          chatHistory: apiChatHistory
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add bot response to chat history
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: data.response,
          timestamp: new Date()
        }]);
      } else {
        // Add error message to chat history
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date()
        }]);
        console.error("Chatbot error:", data.error);
      }
    } catch (error) {
      console.error("Error calling chatbot API:", error);
      setChatHistory(prev => [...prev, {
        isUser: false,
        text: "Sorry, I couldn't connect to the server. Please try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <>
      {/* Floating chat button - positioned absolutely in bottom right corner */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-8 right-8 z-[9999] bg-orange-500 hover:bg-orange-600 text-white rounded-full p-5 shadow-lg flex items-center justify-center transition-all duration-300 ${
          isChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        } transform hover:scale-110 hover:rotate-3`}
        style={{
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)',
          animation: isChatOpen ? 'none' : 'pulse 2s infinite'
        }}
        aria-label="Chat with Pinnacle Assistant"
      >
        <FaCommentDots className="text-2xl" />
        <span className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
      
      {/* Chat window - positioned absolutely in bottom right corner */}
      <div 
        className={`fixed bottom-8 right-8 z-[9999] bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 w-80 md:w-96 
        shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] border border-gray-800 
        ${
          isChatOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
        }`}
        style={{ 
          maxHeight: '80vh',
          backgroundImage: 'linear-gradient(to bottom, #111827, #0f172a)',
          boxShadow: isChatOpen ? '0 10px 25px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.2)' : 'none'
        }}
      >
        {/* Chat header - redesigned with gradient */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-full">
              <FaRobot className="text-orange-500 text-sm" />
            </div>
            <div>
              <p className="font-bold text-white">Pinnacle Assistant</p>
              <p className="text-xs text-orange-100">How can I help you?</p>
            </div>
          </div>
          <button 
            onClick={toggleChat}
            className="text-white hover:text-orange-200 transition-colors bg-orange-600 hover:bg-orange-700 rounded-full p-1.5"
            aria-label="Close chat"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Chat messages - redesigned bubbles */}
        <div className="p-4 overflow-y-auto bg-gray-900" style={{ maxHeight: '60vh', backgroundImage: 'radial-gradient(circle at top right, #1f2937 0%, #111827 100%)' }}>
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 items-start max-w-[80%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 rounded-full p-2 shadow-md ${
                  msg.isUser 
                    ? 'bg-gray-800 ring-1 ring-orange-500/20' 
                    : 'bg-orange-500'
                }`}>
                  {msg.isUser 
                    ? <FaUser className="text-orange-500 text-xs" /> 
                    : <FaRobot className="text-white text-xs" />
                  }
                </div>
                <div
                  className={`p-3 rounded-2xl shadow-md ${
                    msg.isUser
                      ? 'bg-gray-800 text-white border border-orange-500/30 rounded-tr-none'
                      : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-3 flex justify-start">
              <div className="flex gap-2 items-start max-w-[80%]">
                <div className="shrink-0 rounded-full p-2 bg-orange-500 shadow-md">
                  <FaRobot className="text-white text-xs" />
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-tl-none shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat input - redesigned input area */}
        <form onSubmit={handleSubmit} className="border-t border-gray-800 p-3 bg-gray-900">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-gray-800 text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm border border-gray-700 shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                message.trim() && !isLoading
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md'
                  : 'bg-gray-700'
              } transition-colors`}
              aria-label="Send message"
            >
              <FiSend className="text-white text-sm" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
