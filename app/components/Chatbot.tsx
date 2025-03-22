"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaUser, FaTimes, FaCommentDots, FaSync } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import Link from 'next/link';

interface ChatMessage {
  isUser: boolean;
  text: string;
  timestamp: Date;
  productRecommendations?: ProductRecommendation[];
}

interface ProductRecommendation {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  subCategory: string;
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

  // Process the response to extract product recommendations
  const processResponseWithRecommendations = (responseText: string) => {
    const parts = responseText.split('[[PRODUCT_RECOMMENDATIONS]]');
    
    if (parts.length === 2) {
      // Extract the main text content
      const textContent = parts[0].trim();
      
      try {
        // Parse the JSON part containing product recommendations
        const recommendationsJson = parts[1].trim();
        const recommendations = JSON.parse(recommendationsJson);
        
        return {
          text: textContent,
          productRecommendations: recommendations
        };
      } catch (e) {
        console.error("Error parsing product recommendations:", e);
        return { text: responseText, productRecommendations: undefined };
      }
    }
    
    // If no product recommendations marker is found, return the original text
    return { text: responseText, productRecommendations: undefined };
  };

  // New function to check for special commands
  const processSpecialCommands = (msg: string): boolean => {
    // Command to refresh product data
    if (msg.toLowerCase() === '/refresh' || msg.toLowerCase() === '/update products') {
      setChatHistory(prev => [...prev, {
        isUser: false,
        text: "I'm refreshing my product knowledge... One moment please.",
        timestamp: new Date()
      }]);
      
      // Call a special refresh endpoint (optional)
      fetch('/api/chatbot/refresh', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
          setChatHistory(prev => [...prev, {
            isUser: false,
            text: data.success 
              ? `My product knowledge has been refreshed! I now know about ${data.productCount} products.`
              : "I tried to refresh my product knowledge, but encountered an issue. I'll still try my best to help you.",
            timestamp: new Date()
          }]);
        })
        .catch(error => {
          console.error("Error refreshing product data:", error);
          setChatHistory(prev => [...prev, {
            isUser: false,
            text: "I had trouble refreshing my product knowledge. Let's continue and I'll do my best to help you.",
            timestamp: new Date()
          }]);
        });
      
      return true; // Command was processed
    }
    
    return false; // No special command detected
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
    
    // Check if this is a special command
    if (processSpecialCommands(userMessage.text)) {
      return; // Don't proceed with normal API call
    }
    
    setIsLoading(true);
    
    try {
      // Format chat history for the API
      const apiChatHistory = chatHistory.map(msg => ({
        isUser: msg.isUser,
        text: msg.text
      }));
      
      // Call the chatbot API with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          chatHistory: apiChatHistory
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        // Process response to extract any product recommendations
        const processedResponse = processResponseWithRecommendations(data.response);
        
        // Add bot response to chat history with any product recommendations
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: processedResponse.text,
          timestamp: new Date(),
          productRecommendations: processedResponse.productRecommendations
        }]);
        
        // If response includes metadata about product count, show it (optional)
        if (data.productCount && data.cacheAge) {
          console.log(`Chatbot knows about ${data.productCount} products. Cache age: ${data.cacheAge} seconds`);
        }
      } else {
        // Add fallback response or error message to chat history
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: data.fallbackResponse || "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date()
        }]);
        console.error("Chatbot error:", data.error);
      }
    } catch (error: unknown) {  // Explicitly type the error as unknown
      console.error("Error calling chatbot API:", error);
      
      // Check if it was an abort error (timeout) - Add proper type checking
      if (error instanceof Error && error.name === 'AbortError') {
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: "Sorry, the request took too long to process. Please try a shorter question or try again later.",
          timestamp: new Date()
        }]);
      } else {
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: "Sorry, I couldn't connect to the server. Please try again later.",
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render product recommendations as cards
  const ProductCard: React.FC<{ product: ProductRecommendation }> = ({ product }) => {
    return (
      <Link 
        href={`/product/${product.id}`}
        className="block w-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300 hover:bg-gray-700 hover:border-orange-500 shadow-md hover:shadow-orange-500/20"
      >
        <div className="flex flex-col h-full">
          {/* Product Image */}
          <div className="h-32 overflow-hidden bg-gray-900">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="p-3 flex-grow">
            <h3 className="font-medium text-white text-sm line-clamp-2">{product.name}</h3>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-orange-500 font-bold">${product.price}</span>
              <span className="text-xs text-gray-400">{product.category}</span>
            </div>
          </div>
          
          {/* View Button */}
          <div className="p-2 bg-gray-800 border-t border-gray-700">
            <button className="w-full py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded transition-colors">
              View Product
            </button>
          </div>
        </div>
      </Link>
    );
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Add suggested prompts related to occasions
  const occasionPrompts = [
    "What should I wear to a summer wedding?",
    "Help me find an outfit for a job interview",
    "Suggest a casual outfit for a weekend brunch",
    "What's trending for beach parties this season?",
    "Build me an outfit for a formal dinner"
  ];

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

                  {/* Product recommendation cards */}
                  {!msg.isUser && msg.productRecommendations && msg.productRecommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-400/30">
                      <p className="text-xs text-white mb-2">Recommended products:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.productRecommendations.map((product, idx) => (
                          <ProductCard key={idx} product={product} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Fix: Correctly structured loading animation */}
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
        
        {/* Fix: Form tag should wrap all form content */}
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
