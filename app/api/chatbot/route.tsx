import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "@/models/Product";

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to database");
  }
};

// Array of models to try in order of preference
const MODEL_PRIORITY = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

// Timeout promise to prevent hanging requests
const timeoutPromise = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
};

// Function to limit product context to prevent exceeding token limits
const prepareProductContext = (products: any[]) => {
  // Limit to fewer products with essential information only
  return products.slice(0, 20).map(product => ({
    id: product._id,
    name: product.productName,
    price: `$${product.regularPrice.toFixed(2)}`,
    category: product.category,
    subCategory: product.subCategory,
    sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "Not specified"
  }));
};

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectDB();

    // Get the message and chat history from the request
    const { message, chatHistory } = await request.json();

    // Check if API key is defined
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: "Gemini API key is not configured" 
      }, { status: 500 });
    }

    // Fetch product data from MongoDB - limit to fewer products
    const products = await Product.find()
      .select('_id productName regularPrice category subCategory sizes gallery.color')
      .limit(20);
    
    // Format product data with limited context to reduce token usage
    const productContext = prepareProductContext(products);

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Prepare system prompt with product information - simplified
    const systemPrompt = `
      You are Pinnacle Assistant, a helpful chatbot for the Pinnacle fashion store.
      
      Here is information about some of our products that you can use to answer customer questions:
      ${JSON.stringify(productContext, null, 2)}
      
      When answering:
      1. Be conversational and helpful
      2. Recommend products by name when relevant
      3. Provide pricing information if available
      4. If you don't know an answer, admit it and suggest contacting customer service
      5. Keep responses concise (under 100 words when possible)
    `;

    // Format the conversation for the API
    const formattedChatHistory = chatHistory.map((msg: any) => ({
      role: msg.isUser ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Add system prompt at the beginning
    const conversation = [
      { role: "model", parts: [{ text: systemPrompt }] },
      ...formattedChatHistory,
      { role: "user", parts: [{ text: message }] },
    ];

    // Try each model in priority order until one works
    let lastError = null;
    for (const modelName of MODEL_PRIORITY) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Race the model generation against a timeout
        const result = await Promise.race([
          model.generateContent({
            contents: conversation,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
          timeoutPromise(15000) // 15 second timeout
        ]);

        // If we get here, the model worked
        const responseText = result.response.text();
        
        return NextResponse.json({
          success: true,
          response: responseText,
          model: modelName // Include which model was used in the response
        });
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error);
        lastError = error;
        // Continue to the next model in the priority list
      }
    }

    // If we get here, all models failed
    return NextResponse.json({ 
      success: false, 
      error: `All models failed. Last error: ${lastError instanceof Error ? lastError.message : "Unknown error"}`,
      fallbackResponse: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or contact our customer service team for immediate assistance."
    });
    
  } catch (error) {
    console.error("Error processing chatbot request:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to process request",
      fallbackResponse: "I'm sorry, but I'm experiencing technical difficulties at the moment. Please try again later or contact our customer support team for assistance."
    }, { status: 500 });
  }
}
