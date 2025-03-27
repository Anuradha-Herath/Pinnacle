import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
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

    // Use gemini-1.5-flash model that we confirmed is working
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Send a simple test prompt
    const result = await model.generateContent("Hello! Please respond with a short message if you're working properly.");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      success: true, 
      message: "Gemini API is working correctly", 
      response: text,
      model: "gemini-1.5-flash"
    });
  } catch (error) {
    console.error("Error testing Gemini API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to test Gemini API",
      suggestion: "Check if your API key has access to Gemini models and that you're using the correct model name." 
    }, { status: 500 });
  }
}
