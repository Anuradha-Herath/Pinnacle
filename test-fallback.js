// Simple test script to verify the fallback system works
async function testFallback() {
  try {
    const response = await fetch('http://localhost:3000/api/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "What is your return policy?",
        chatHistory: [],
        userContext: null
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ Fallback system working!');
      console.log('Response text:', data.response);
      if (data.fallback) {
        console.log('🔄 Used fallback system');
      }
    } else {
      console.log('❌ Error:', data.error);
      console.log('Fallback response:', data.fallbackResponse);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

console.log('Testing chatbot fallback system...');
testFallback();
