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

interface UserPreference {
  categories: Record<string, number>;  // Category name -> interest score
  products: Record<string, number>;    // Product ID -> interest score
  colors: Record<string, number>;      // Color name -> interest score
  priceRange: {
    min: number;
    max: number;
    count: number;
  };
  lastUpdated: number;
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
  const [userPreferences, setUserPreferences] = useState<UserPreference>({
    categories: {},
    products: {},
    colors: {},
    priceRange: { min: 0, max: 1000, count: 0 },
    lastUpdated: Date.now()
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<ProductRecommendation[]>([]);
  const [showPersonalizedRecs, setShowPersonalizedRecs] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      // Load personalized recommendations when opening chat
      loadPersonalizedRecommendations();
    }
  };

  // Load user preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('pinnacle_user_preferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setUserPreferences(parsedPreferences);
      } catch (e) {
        console.error("Error parsing saved preferences:", e);
      }
    }
    
    // Also load browsing history into local state
    loadBrowsingHistory();
  }, []);

  // Load browsing history from localStorage
  const loadBrowsingHistory = () => {
    try {
      // Get recently viewed products
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      
      // Update user preferences based on browsing history
      const updatedPreferences = { ...userPreferences };
      
      recentlyViewed.forEach((product: any) => {
        // Increment interest in this product
        if (product.id) {
          updatedPreferences.products[product.id] = (updatedPreferences.products[product.id] || 0) + 1;
        }
        
        // If product has category information, update category preferences
        if (product.category) {
          updatedPreferences.categories[product.category] = 
            (updatedPreferences.categories[product.category] || 0) + 1;
        }
        
        // Track price ranges viewed
        if (product.price) {
          const price = parseFloat(product.price);
          if (!isNaN(price)) {
            updatedPreferences.priceRange.min = Math.min(updatedPreferences.priceRange.min, price);
            updatedPreferences.priceRange.max = Math.max(updatedPreferences.priceRange.max, price);
            updatedPreferences.priceRange.count++;
          }
        }
      });
      
      // Save updated preferences back to state and localStorage
      updatedPreferences.lastUpdated = Date.now();
      setUserPreferences(updatedPreferences);
      localStorage.setItem('pinnacle_user_preferences', JSON.stringify(updatedPreferences));
      
    } catch (e) {
      console.error("Error processing browsing history:", e);
    }
  };

  // Fetch personalized recommendations based on user preferences
  const loadPersonalizedRecommendations = async () => {
    try {
      // Skip if we don't have enough preference data
      const hasPreferences = Object.keys(userPreferences.categories).length > 0 || 
                             Object.keys(userPreferences.products).length > 0;
      
      if (!hasPreferences) {
        console.log("Not enough preference data for personalized recommendations");
        return;
      }

      // Call API to get recommendations based on preferences
      const response = await fetch('/api/recommendations/personalized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: userPreferences })
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch personalized recommendations");
      }
      
      const data = await response.json();
      
      if (data.recommendations && data.recommendations.length > 0) {
        setPersonalizedRecommendations(data.recommendations);
        setShowPersonalizedRecs(true);
      }
    } catch (e) {
      console.error("Error loading personalized recommendations:", e);
    }
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
    
    // New command to show personalized recommendations
    if (msg.toLowerCase() === '/recommendations' || 
        msg.toLowerCase().includes("show me recommendations") || 
        msg.toLowerCase().includes("recommend for me")) {
      loadPersonalizedRecommendations();
      setChatHistory(prev => [...prev, {
        isUser: false,
        text: "Here are some personalized recommendations based on your preferences and browsing history!",
        timestamp: new Date()
      }]);
      setShowPersonalizedRecs(true);
      return true;
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
      
      // Call the chatbot API with a timeout and include user preferences
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
      
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          chatHistory: apiChatHistory,
          userPreferences: userPreferences  // Include user preferences in the request
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
        
        // If the response includes recommendations, hide personalized recommendations panel
        if (processedResponse.productRecommendations?.length > 0) {
          setShowPersonalizedRecs(false);
        }
        
        // Track user interests based on their query
        updateUserPreferencesFromQuery(userMessage.text, processedResponse.productRecommendations);
        
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

  // Update user preferences based on chat queries and recommended products
  const updateUserPreferencesFromQuery = (query: string, recommendations?: ProductRecommendation[]) => {
    const updatedPreferences = { ...userPreferences };
    const queryLower = query.toLowerCase();
    
    // Extract mentioned categories from query
    const categoryKeywords = [
      'men', 'women', 'accessories', 'shoes', 'shirts', 'pants', 'dresses',
      'hoodies', 'jackets', 'sweaters', 't-shirts', 'jeans'
    ];
    
    categoryKeywords.forEach(category => {
      if (queryLower.includes(category)) {
        updatedPreferences.categories[category] = (updatedPreferences.categories[category] || 0) + 1;
      }
    });
    
    // Extract color preferences from query
    const colorKeywords = [
      'red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 
      'pink', 'orange', 'brown', 'gray', 'grey'
    ];
    
    colorKeywords.forEach(color => {
      if (queryLower.includes(color)) {
        updatedPreferences.colors[color] = (updatedPreferences.colors[color] || 0) + 1;
      }
    });
    
    // Register interest in recommended products
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach(product => {
        if (product.id) {
          updatedPreferences.products[product.id] = (updatedPreferences.products[product.id] || 0) + 1;
        }
        if (product.category) {
          updatedPreferences.categories[product.category] = 
            (updatedPreferences.categories[product.category] || 0) + 1;
        }
      });
    }
    
    // Update lastUpdated timestamp
    updatedPreferences.lastUpdated = Date.now();
    
    // Save updated preferences
    setUserPreferences(updatedPreferences);
    localStorage.setItem('pinnacle_user_preferences', JSON.stringify(updatedPreferences));
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
  }, [chatHistory, showPersonalizedRecs]);

  // New component for personalized recommendations section
  const PersonalizedRecommendationsPanel = () => {
    if (!showPersonalizedRecs || personalizedRecommendations.length === 0) return null;
    
    return (
      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-orange-500/20">
        <h3 className="text-orange-500 font-medium mb-2">Your Personalized Recommendations</h3>
        <div className="grid grid-cols-1 gap-3">
          {personalizedRecommendations.map((product, idx) => (
            <ProductCard key={idx} product={product} />
          ))}
        </div>
        <button 
          onClick={() => setShowPersonalizedRecs(false)}
          className="mt-2 text-xs text-gray-400 hover:text-white"
        >
          Hide recommendations
        </button>
      </div>
    );
  };

  // Add suggested prompts based on user preferences
  const getSuggestedPrompts = () => {
    if (!userPreferences) return occasionPrompts;
    
    const prompts = [];
    
    // Get top categories
    const topCategories = Object.entries(userPreferences.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([category]) => category);
    
    // Get top colors
    const topColors = Object.entries(userPreferences.colors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([color]) => color);
    
    // Generate personalized prompts
    if (topCategories.length > 0) {
      prompts.push(`Show me the latest ${topCategories[0]} items`);
      
      if (topColors.length > 0) {
        prompts.push(`Do you have ${topColors[0]} ${topCategories[0]}?`);
      }
    }
    
    // Add more personalized prompts if we have enough data
    if (Object.keys(userPreferences.products).length > 0) {
      prompts.push("Recommend similar products to what I've viewed");
    }
    
    // Always include "Show personalized recommendations" if we have preferences
    if (Object.keys(userPreferences.categories).length > 0 || 
        Object.keys(userPreferences.products).length > 0) {
      prompts.push("Show me personalized recommendations");
    }
    
    // Fill in with default prompts if needed
    while (prompts.length < 3) {
      const randomOccasionPrompt = occasionPrompts[Math.floor(Math.random() * occasionPrompts.length)];
      if (!prompts.includes(randomOccasionPrompt)) {
        prompts.push(randomOccasionPrompt);
      }
    }
    
    return prompts.slice(0, 3);
  };

  // Add suggested prompts related to occasions
  const occasionPrompts = [
    "What should I wear to a summer wedding?",
    "Help me find an outfit for a job interview",
    "Suggest a casual outfit for a weekend brunch",
    "What's trending for beach parties this season?",
    "Build me an outfit for a formal dinner"
  ];

  // Get personalized prompts
  const suggestedPrompts = getSuggestedPrompts();

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
          {/* Personalized recommendations panel */}
          <PersonalizedRecommendationsPanel />
          
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
        
        {/* Quick suggested prompts */}
        <div className="border-t border-gray-800 px-3 pt-2 pb-0 bg-gray-900 flex flex-wrap gap-1">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                setMessage(prompt);
                document.querySelector('input')?.focus();
              }}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-2 py-1 rounded-full border border-gray-700 mb-2 transition-colors"
            >
              {prompt}
            </button>
          ))}
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
