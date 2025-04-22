"use client";

import { useState, useEffect } from 'react';
import ClientOnly from './ClientOnly';
import dynamic from 'next/dynamic';

// Import Chatbot with dynamic loading and no SSR
const Chatbot = dynamic(() => import('./Chatbot'), { 
  ssr: false,
  loading: () => null
});

export default function ChatbotWrapper() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Don't render anything during server-side rendering
  if (!isMounted) return null;

  return (
    <ClientOnly>
      {/* Chat toggle button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-8 right-8 z-[9999] bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full p-4 shadow-lg flex items-center justify-center"
        style={{
          boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
          animation: 'pulse 2s infinite'
        }}
        aria-label="Chat with Pinnacle Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Only render the Chatbot when chat is open */}
      {isChatOpen && <Chatbot />}
    </ClientOnly>
  );
}
