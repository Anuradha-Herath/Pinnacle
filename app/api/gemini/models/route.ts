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
    
    // Try to get model information indirectly
    // We'll test a few known model names to see which ones work
    const modelNames = [
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
      "gemini-pro-vision"
    ];
    
    const modelResults = {};
    
    for (const modelName of modelNames) {
      try {
        // Try to initialize the model (this doesn't make an API call yet)
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Try a simple generation to see if the model works
        try {
          const result = await model.generateContent("Test");
          modelResults[modelName] = { status: "available", response: result.response.text().substring(0, 50) + "..." };
        } catch (genError) {
          modelResults[modelName] = { 
            status: "error", 
            error: genError instanceof Error ? genError.message : "Unknown error" 
          };
        }
      } catch (modelError) {
        modelResults[modelName] = { 
          status: "unavailable", 
          error: modelError instanceof Error ? modelError.message : "Unknown error" 
        };
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Model availability check complete", 
      apiVersion: "v1",
      modelResults
    });

  } catch (error) {
    console.error("Error checking Gemini models:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to check Gemini models" 
    }, { status: 500 });
  }
}
