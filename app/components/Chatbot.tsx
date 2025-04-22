"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaTimes } from 'react-icons/fa';
import { RiAiGenerate, RiCustomerService2Fill, RiMessageFill } from 'react-icons/ri';
import { FiSend, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';
import { getChatbotUserContext } from '@/lib/userPreferenceService';

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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => ([{
    isUser: false,
    text: "Hi there! I'm Pinnacle Assistant. How can I help you with your fashion needs today?",
    timestamp: new Date(0)
  }]));
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    setChatHistory(prev => [{
      ...prev[0],
      timestamp: new Date()
    }]);
  }, []);

  const formatMessageTime = (date: Date): string => {
    if (!isClient) return "";
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const resetConversation = () => {
    setChatHistory([{
      isUser: false,
      text: "Hi there! I'm Pinnacle Assistant. How can I help you with your fashion needs today?",
      timestamp: new Date()
    }]);
  };

  const processResponseWithRecommendations = (responseText: string) => {
    let cleanText = responseText;
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
    cleanText = cleanText.replace(/^\s*\*\s+/gm, '• ');
    const parts = cleanText.split('[[PRODUCT_RECOMMENDATIONS]]');
    if (parts.length === 2) {
      const textContent = parts[0].trim();
      try {
        const recommendationsJson = parts[1].trim();
        const recommendations = JSON.parse(recommendationsJson);
        return {
          text: textContent,
          productRecommendations: recommendations
        };
      } catch (e) {
        console.error("Error parsing product recommendations:", e);
        return { text: cleanText, productRecommendations: undefined };
      }
    }
    return { text: cleanText, productRecommendations: undefined };
  };

  const processSpecialCommands = (msg: string): boolean => {
    if (msg.toLowerCase() === '/refresh' || msg.toLowerCase() === '/update products') {
      setChatHistory(prev => [...prev, {
        isUser: false,
        text: "I'm refreshing my product knowledge... One moment please.",
        timestamp: new Date()
      }]);
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
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    const userMessage = {
      isUser: true,
      text: message.trim(),
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    if (processSpecialCommands(userMessage.text)) {
      return;
    }
    setIsLoading(true);
    try {
      const apiChatHistory = chatHistory.map(msg => ({
        isUser: msg.isUser,
        text: msg.text
      }));
      const userContext = getChatbotUserContext();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          chatHistory: apiChatHistory,
          userContext
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.success) {
        const processedResponse = processResponseWithRecommendations(data.response);
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: processedResponse.text,
          timestamp: new Date(),
          productRecommendations: processedResponse.productRecommendations
        }]);
        if (data.productCount && data.cacheAge) {
          console.log(`Chatbot knows about ${data.productCount} products. Cache age: ${data.cacheAge} seconds`);
        }
      } else {
        setChatHistory(prev => [...prev, {
          isUser: false,
          text: data.fallbackResponse || "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date()
        }]);
        console.error("Chatbot error:", data.error);
      }
    } catch (error: unknown) {
      console.error("Error calling chatbot API:", error);
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

  const ProductCard: React.FC<{ product: ProductRecommendation }> = ({ product }) => {
    return (
      <Link 
        href={`/product/${product.id}`}
        className="block w-full bg-gray-100 border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:bg-gray-200 shadow-sm"
      >
        <div className="flex flex-col h-full">
          <div className="h-32 overflow-hidden bg-gray-100">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500">No image</span>
              </div>
            )}
          </div>
          <div className="p-3 flex-grow">
            <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{product.name}</h3>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-gray-600 font-bold">${product.price}</span>
              <span className="text-xs text-gray-500">{product.category}</span>
            </div>
          </div>
          <div className="p-2 bg-gray-100 border-t border-gray-200">
            <button className="w-full py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-medium rounded transition-colors">
              View Product
            </button>
          </div>
        </div>
      </Link>
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const suggestedPrompts = [
    {
      text: "What's your return policy?",
      category: "faq"
    },
    {
      text: "How long does shipping take?",
      category: "faq"
    },
    {
      text: "What should I wear to a summer wedding?",
      category: "outfit"
    },
    {
      text: "Do you offer free shipping?",
      category: "faq"
    },
    {
      text: "How do I find my size?",
      category: "faq"
    },
    {
      text: "Build me a casual weekend outfit",
      category: "outfit"
    }
  ];

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 100);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes blueGlowPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(147, 197, 253, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(147, 197, 253, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(147, 197, 253, 0);
          }
        }
        
        @keyframes blueDotPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
      `}</style>
      
      <button
        onClick={toggleChat}
        className={`fixed bottom-8 right-8 z-[9999] bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg p-4 shadow-lg flex items-center justify-center transition-all duration-300 ${
          isChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        } transform hover:scale-110`}
        style={{
          boxShadow: '0 0 15px rgba(147, 197, 253, 0.4)',
          animation: isChatOpen ? 'none' : 'blueGlowPulse 2s infinite'
        }}
        aria-label="Chat with Pinnacle Assistant"
      >
        <RiMessageFill className="text-2xl" />
        <span className="absolute top-0 right-0 h-3 w-3 bg-green-400 rounded-full border-2 border-blue-100"></span>
      </button>
      <div 
        className={`fixed bottom-8 right-8 z-[9999] bg-gray-100 rounded-xl overflow-hidden transition-all duration-300 w-80 md:w-96 shadow-lg border border-gray-200 ${
          isChatOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
        }`}
        style={{ 
          maxHeight: '80vh',
          boxShadow: isChatOpen ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-full">
              <RiAiGenerate className="text-white text-sm" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Pinnacle Assistant</p>
              <p className="text-xs text-gray-500">How can I help you?</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={resetConversation}
              className="text-gray-600 hover:text-gray-800 transition-colors bg-blue-100 hover:bg-blue-200 rounded-full p-1.5"
              aria-label="Reset conversation"
              title="Start new conversation"
            >
              <FiRefreshCw className="text-sm" />
            </button>
            <button 
              onClick={toggleChat}
              className="text-gray-600 hover:text-gray-800 transition-colors bg-blue-100 hover:bg-blue-200 rounded-full p-1.5"
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto bg-gray-50" style={{ maxHeight: '60vh' }}>
          {chatHistory.length === 1 && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                    className={`text-xs py-1.5 px-2.5 rounded-full ${
                      prompt.category === 'faq' 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                    } transition-colors`}
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 items-start max-w-[80%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 rounded-full p-2 shadow-sm ${
                  msg.isUser 
                    ? 'bg-blue-500 ring-1 ring-blue-200' 
                    : 'bg-gray-200'
                }`}>
                  {msg.isUser 
                    ? <FaUser className="text-white text-xs" /> 
                    : <RiAiGenerate className="text-gray-700 text-xs" />
                  }
                </div>
                <div
                  className={`p-3 rounded-2xl shadow-sm ${
                    msg.isUser
                      ? 'bg-blue-500 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  {isClient && (
                    <p className={`text-xs opacity-70 mt-1 text-right ${msg.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatMessageTime(msg.timestamp)}
                    </p>
                  )}
                  {!msg.isUser && msg.productRecommendations && msg.productRecommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Recommended products:</p>
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
          {isLoading && (
            <div className="mb-3 flex justify-start">
              <div className="flex gap-2 items-start max-w-[80%]">
                <div className="shrink-0 rounded-full p-2 bg-gray-200 shadow-sm">
                  <RiAiGenerate className="text-gray-700 text-xs" />
                </div>
                <div className="p-3 rounded-2xl bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" style={{ animation: 'blueDotPulse 1.4s infinite ease-in-out', animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full" style={{ animation: 'blueDotPulse 1.4s infinite ease-in-out', animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full" style={{ animation: 'blueDotPulse 1.4s infinite ease-in-out', animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-gray-50 text-gray-800 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm border border-gray-200 shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
                message.trim() && !isLoading
                  ? 'bg-blue-500 hover:bg-blue-600 shadow-sm'
                  : 'bg-gray-300'
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
