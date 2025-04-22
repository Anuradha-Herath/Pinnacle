"use client";

import React, { useState } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { faqData } from '@/lib/faqData';

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('products');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  
  // Toggle question expansion
  const toggleQuestion = (category: string, index: number) => {
    const key = `${category}-${index}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Check if a question is expanded
  const isExpanded = (category: string, index: number) => {
    const key = `${category}-${index}`;
    return expandedQuestions[key];
  };
  
  // Category labels for display
  const categoryLabels = {
    products: 'Products',
    shipping: 'Shipping & Delivery',
    returns: 'Returns & Exchanges',
    payment: 'Payment Options',
    general: 'General Information'
  };

  return (
    <>
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600 mb-8">Find answers to common questions about our products, shipping, returns, and more.</p>
        
        {/* Category tabs */}
        <div className="flex overflow-x-auto pb-2 mb-6 border-b">
          {Object.entries(categoryLabels).map(([category, label]) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 font-medium whitespace-nowrap ${
                activeCategory === category
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-gray-900'
              } transition-colors`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* FAQ accordion */}
        <div className="space-y-4">
          {faqData[activeCategory as keyof typeof faqData]?.map((item, index) => (
            <div 
              key={index}
              className="border rounded-md overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(activeCategory, index)}
                className="w-full text-left p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
              >
                <span className="font-medium">{item.question}</span>
                <span className={`transform transition-transform ${isExpanded(activeCategory, index) ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {isExpanded(activeCategory, index) && (
                <div className="p-4 bg-white">
                  <p className="text-gray-700">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Chat help callout */}
        <div className="mt-12 bg-orange-50 p-6 rounded-md border border-orange-100 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Still have questions?</h2>
            <p className="text-gray-600">Our chatbot assistant is available 24/7 to help answer your questions.</p>
          </div>
          <button 
            onClick={() => {
              // Find the chatbot button and click it
              const chatButton = document.querySelector('[aria-label="Chat with Pinnacle Assistant"]') as HTMLButtonElement;
              if (chatButton) chatButton.click();
            }}
            className="mt-4 md:mt-0 px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            Chat Now
          </button>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
