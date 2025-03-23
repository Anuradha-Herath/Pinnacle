// Structured FAQ data organized by categories
export const faqData = {
  products: [
    {
      question: "What sizes do you offer?",
      answer: "We offer sizes ranging from XS to 3XL in most products. Each product page has a specific size chart to help you find the perfect fit. You can also use our size profile feature or ask the chatbot for personalized size recommendations."
    },
    {
      question: "How do I know which size to choose?",
      answer: "You can check the detailed size chart on each product page. For personalized recommendations, set up your size profile in your account settings, or ask our chatbot assistant for help by providing your measurements."
    },
    {
      question: "Are your products true to size?",
      answer: "Most of our products are true to size, but some styles may fit differently. We indicate on each product page whether an item runs small, large, or true to size. Our chatbot can also provide specific fitting advice for any product."
    },
    {
      question: "Where are your products made?",
      answer: "Our products are ethically manufactured across several countries including Portugal, Vietnam, and Bangladesh. We maintain strict quality and ethical standards across all our manufacturing locations."
    },
    {
      question: "What materials do you use?",
      answer: "We use a variety of high-quality materials, with a focus on sustainability. Common materials include organic cotton, recycled polyester, sustainable linen, and TENCEL™. Each product page lists the exact material composition."
    }
  ],
  shipping: [
    {
      question: "How much does shipping cost?",
      answer: "We offer free standard shipping on all orders over $50. For orders under $50, a flat rate of $5.99 applies. Express shipping is available for $12.99 regardless of order value."
    },
    {
      question: "How long will it take to receive my order?",
      answer: "Standard shipping typically takes 3-5 business days. Express shipping delivers within 1-2 business days. International shipping may take 7-14 business days depending on the destination country."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to over 50 countries worldwide. International shipping costs and delivery times vary by location. You can see the exact shipping cost during checkout after entering your address."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. You can also view your order status and tracking information in your account under 'Order History'."
    },
    {
      question: "Which shipping carriers do you use?",
      answer: "We primarily ship with UPS, FedEx, and USPS depending on your location and shipping method selected. International orders are typically shipped via DHL or local postal services."
    }
  ],
  returns: [
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for unworn, unwashed items with original tags attached. Sale items and intimates are final sale and cannot be returned. Return shipping is free for customers in the United States."
    },
    {
      question: "How do I start a return?",
      answer: "To initiate a return, log into your account, go to 'Order History', select the order containing the item(s) you wish to return, and follow the return instructions. You'll receive a prepaid return label to print."
    },
    {
      question: "How long does it take to process a return?",
      answer: "Once we receive your return, it typically takes 3-5 business days to process. Refunds are issued to your original payment method and may take an additional 2-5 business days to appear on your statement."
    },
    {
      question: "Can I exchange an item instead of returning it?",
      answer: "Yes, you can exchange items for a different size or color. During the return process, select 'Exchange' instead of 'Return' and specify the item you'd like instead. If the new item costs more, you'll be charged the difference."
    },
    {
      question: "Do I need the original packaging to return an item?",
      answer: "While original packaging is preferred, it's not required. However, items must be unworn, with all tags attached, and in resalable condition. Please pack items securely to prevent damage during transit."
    }
  ],
  payment: [
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. We also offer Klarna and Afterpay for installment payments."
    },
    {
      question: "Is it safe to use my credit card on your website?",
      answer: "Yes, our website uses industry-standard SSL encryption to protect your payment information. We never store full credit card details on our servers. All payments are processed through secure, PCI-compliant payment gateways."
    },
    {
      question: "When will my card be charged?",
      answer: "Your card will be charged immediately upon completing your purchase. For pre-order items, you'll be charged when you place the order, not when the item ships."
    },
    {
      question: "Do you offer buy now, pay later options?",
      answer: "Yes, we offer Klarna and Afterpay, allowing you to split your purchase into 4 interest-free payments, made every two weeks."
    }
  ],
  general: [
    {
      question: "How can I contact customer service?",
      answer: "You can reach our customer service team via email at support@pinnacle.com, through live chat on our website (available Mon-Fri, 9am-6pm EST), or by phone at 1-800-PINNACLE (Mon-Fri, 9am-5pm EST)."
    },
    {
      question: "Do you have physical stores?",
      answer: "Yes, we currently have flagship stores in New York, Los Angeles, Chicago, and Miami. You can find store addresses, hours, and contact information on our Stores page."
    },
    {
      question: "Do you offer gift cards?",
      answer: "Yes, we offer digital and physical gift cards in amounts from $25 to $500. Digital gift cards are delivered via email immediately after purchase, while physical gift cards are shipped with free standard shipping."
    },
    {
      question: "What is your sustainability commitment?",
      answer: "We're committed to reducing our environmental impact through sustainable materials, eco-friendly packaging, carbon-neutral shipping, and ethical manufacturing. By 2025, we aim to use 100% sustainable or recycled materials in all our products."
    }
  ]
};

// Helper function to convert FAQ data into a format suitable for the chatbot's system prompt
export function generateFAQPrompt(): string {
  let faqPrompt = "COMMON CUSTOMER QUESTIONS AND ANSWERS:\n\n";
  
  // Process each category
  Object.entries(faqData).forEach(([category, questions]) => {
    faqPrompt += `--- ${category.toUpperCase()} FAQ ---\n\n`;
    
    // Add each Q&A pair
    questions.forEach((item: {question: string, answer: string}, index) => {
      faqPrompt += `Q: ${item.question}\nA: ${item.answer}\n\n`;
    });
  });
  
  return faqPrompt;
}
