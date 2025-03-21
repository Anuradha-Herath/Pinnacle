import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to prepare the initial context for the chatbot
function prepareSystemPrompt() {
  return `You are a helpful and friendly fashion store assistant named "Pinnacle Assistant" for Pinnacle clothing store. 
Your role is to help customers with:
1. Finding suitable clothing items and accessories
2. Answering questions about sizes, materials, and styles
3. Providing styling advice
4. Explaining shipping and return policies
5. Assisting with order-related questions

Keep your responses friendly, helpful, and concise (under 150 words unless detailed information is requested).
If you don't know the answer to something specific about store inventory or policies, suggest that the customer contact customer service.
Don't make up specific product details that you're not certain about.
Respond in a conversational, helpful tone.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, chatHistory = [] } = body;
    
    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    // Check if API key is defined
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gemini API key is not configured' 
      }, { status: 500 });
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the gemini-1.5-flash model that we confirmed is working
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format chat history for the Gemini API
    const formattedHistory = chatHistory.map((entry: any) => {
      return {
        role: entry.isUser ? "user" : "model",
        parts: [{ text: entry.text }]
      };
    });

    // Start a chat
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Send the message and get the response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      success: true, 
      response: text
    });
    
  } catch (error) {
    console.error("Error in chatbot:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process chatbot request" 
    }, { status: 500 });
  }
}
