// Simple test to verify chatbot fixes
// Run this with: node debug/chatbot-test.js

// Test FAQ detection function
const isGeneralInfoOrFAQ = (query, responseText) => {
  const faqKeywords = [
    'policy', 'policies', 'shipping', 'delivery', 'return', 'exchange', 'payment', 
    'order', 'track', 'contact', 'help', 'support', 'faq', 'question', 
    'hours', 'store', 'location', 'warranty', 'guarantee', 'refund',
    'how do i', 'how can i', 'how long', 'what is', 'what are', 'when do',
    'process', 'procedure', 'steps', 'method', 'way to', 'cost of shipping',
    'free shipping', 'customer service', 'business hours', 'opening hours'
  ];
  
  const strongFAQIndicators = [
    'return policy', 'shipping policy', 'exchange policy', 'refund policy',
    'how long does shipping take', 'how much does shipping cost',
    'what is your return policy', 'what are your hours',
    'how do i return', 'how do i exchange', 'how do i track',
    'customer service', 'contact information', 'business hours'
  ];
  
  const productQueryKeywords = [
    'have', 'sell', 'offer', 'stock', 'available', 'color', 'size', 
    'price', 'cost', 'shirt', 'top', 'dress', 'pant', 'jean', 'hoodie', 
    'sweater', 'jacket', 'shoe', 'accessory', 'accessories', 'outfit',
    'recommend', 'suggestion', 'looking for', 'need', 'want', 'style'
  ];
  
  const queryLower = query.toLowerCase();
  const responseLower = responseText.toLowerCase();
  
  if (strongFAQIndicators.some(indicator => queryLower.includes(indicator))) {
    return true;
  }
  
  const isProductAvailabilityQuery = 
    (queryLower.includes('do you have') || 
     queryLower.includes('do you sell') || 
     queryLower.includes('do you offer')) && 
    productQueryKeywords.some(keyword => queryLower.includes(keyword));
  
  if (isProductAvailabilityQuery) {
    return false;
  }
  
  const isRecommendationQuery = [
    'recommend', 'suggest', 'what should i wear', 'what to wear',
    'outfit for', 'help me find', 'looking for', 'show me', 'need something'
  ].some(phrase => queryLower.includes(phrase));
  
  if (isRecommendationQuery && productQueryKeywords.some(keyword => queryLower.includes(keyword))) {
    return false;
  }
  
  const containsFAQKeyword = faqKeywords.some(keyword => queryLower.includes(keyword));
  const containsPolicyInfo = 
    responseLower.includes('policy') || 
    responseLower.includes('policies') ||
    responseLower.includes('shipping') ||
    responseLower.includes('return') ||
    responseLower.includes('exchange') ||
    responseLower.includes('days') ||
    responseLower.includes('hours') ||
    responseLower.includes('business hours') ||
    (responseLower.includes('contact') && responseLower.includes('customer service'));
  
  return containsFAQKeyword || containsPolicyInfo;
};

// Test explicit product request detection
const isExplicitProductRequest = (query) => {
  const explicitRequestTerms = [
    'recommend', 'suggestion', 'suggest', 'show me', 'help me find',
    'looking for', 'need', 'want to buy', 'shopping for', 'browse',
    'what should i wear', 'what to wear', 'outfit for', 'clothes for',
    'do you have', 'do you sell', 'do you offer', 'available',
    'in stock', 'find me', 'help me choose', 'pick out'
  ];
  
  const queryLower = query.toLowerCase();
  return explicitRequestTerms.some(term => queryLower.includes(term));
};

// Test cases
const testCases = [
  // FAQ queries (should NOT get product recommendations)
  { query: "What is your return policy?", response: "Our return policy allows...", expectedFAQ: true, expectedProduct: false },
  { query: "How long does shipping take?", response: "Shipping usually takes 3-5 business days", expectedFAQ: true, expectedProduct: false },
  { query: "What are your business hours?", response: "We are open from 9 AM to 6 PM", expectedFAQ: true, expectedProduct: false },
  { query: "How do I track my order?", response: "You can track your order by...", expectedFAQ: true, expectedProduct: false },
  { query: "How much does shipping cost?", response: "Shipping costs vary by location", expectedFAQ: true, expectedProduct: false },
  
  // Product queries (should get recommendations)
  { query: "Do you have any hoodies?", response: "Yes, we have several hoodies available", expectedFAQ: false, expectedProduct: true },
  { query: "Can you recommend a dress for a wedding?", response: "I'd recommend our formal dresses", expectedFAQ: false, expectedProduct: true },
  { query: "What should I wear to work?", response: "For work, I'd suggest business casual attire", expectedFAQ: false, expectedProduct: true },
  { query: "Show me some jeans", response: "Here are our available jeans", expectedFAQ: false, expectedProduct: true },
  { query: "I'm looking for a winter jacket", response: "We have great winter jackets", expectedFAQ: false, expectedProduct: true },
  
  // Borderline cases
  { query: "Do you offer free shipping?", response: "Yes, we offer free shipping on orders over $50", expectedFAQ: true, expectedProduct: false },
  { query: "How do I find my size?", response: "You can use our size guide to find your size", expectedFAQ: true, expectedProduct: false },
];

console.log("Testing Chatbot FAQ and Product Detection Logic\n");
console.log("=" * 60);

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const isFAQ = isGeneralInfoOrFAQ(testCase.query, testCase.response);
  const isProductRequest = isExplicitProductRequest(testCase.query);
  
  const faqCorrect = isFAQ === testCase.expectedFAQ;
  const productCorrect = isProductRequest === testCase.expectedProduct;
  
  if (faqCorrect && productCorrect) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASSED`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAILED`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   Expected FAQ: ${testCase.expectedFAQ}, Got: ${isFAQ}`);
    console.log(`   Expected Product: ${testCase.expectedProduct}, Got: ${isProductRequest}`);
  }
  console.log(`   Query: "${testCase.query}"`);
  console.log("");
});

console.log("=" * 60);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log("🎉 All tests passed! The chatbot logic should work correctly.");
} else {
  console.log("⚠️  Some tests failed. Review the logic above.");
}
