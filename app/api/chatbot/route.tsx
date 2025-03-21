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
  // Return full product details for better recommendations
  return products.slice(0, 20).map(product => ({
    id: product._id.toString(),
    name: product.productName,
    price: product.regularPrice.toFixed(2),
    category: product.category,
    subCategory: product.subCategory,
    sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "Not specified",
    image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : null,
    description: product.description || "No description available",
  }));
};

// Process AI response to inject product cards
const processResponseWithProductCards = async (responseText: string, productContext: any[]) => {
  // Look for product recommendations in the format "product_name ($price)"
  const productNameRegex = /([A-Za-z0-9\s\-&']+)(\s+\(\$\d+(\.\d+)?\))/g;
  let matches;
  let processedText = responseText;
  const productMatches = [];

  // Find product mentions in the response
  while ((matches = productNameRegex.exec(responseText)) !== null) {
    const potentialProductName = matches[1].trim();
    productMatches.push(potentialProductName);
  }

  // If we found potential product mentions, look them up in our context
  if (productMatches.length > 0) {
    const recommendedProducts = [];
    
    // Find matching products from our context
    productMatches.forEach(productName => {
      // Look for products with similar names (case insensitive partial match)
      const matchingProducts = productContext.filter(product => 
        product.name.toLowerCase().includes(productName.toLowerCase()) ||
        productName.toLowerCase().includes(product.name.toLowerCase())
      );
      
      if (matchingProducts.length > 0) {
        // Add unique products to recommendations
        matchingProducts.forEach(product => {
          if (!recommendedProducts.some(p => p.id === product.id)) {
            recommendedProducts.push(product);
          }
        });
      }
    });
    
    // Limit to 3 recommendations to avoid cluttering the chat
    const limitedRecommendations = recommendedProducts.slice(0, 3);
    
    // If we found matching products, add structured product data to the response
    if (limitedRecommendations.length > 0) {
      // Add a special marker that the frontend can detect and replace with product cards
      processedText = `${processedText}\n\n[[PRODUCT_RECOMMENDATIONS]]\n${JSON.stringify(limitedRecommendations)}`;
    }
  }
  
  return processedText;
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

    // Fetch product data from MongoDB
    const products = await Product.find()
      .select('_id productName regularPrice category subCategory sizes gallery description')
      .limit(30);
    
    // Format product data with full context for better recommendations
    const productContext = prepareProductContext(products);

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Enhanced system prompt with product recommendation instructions
    const systemPrompt = `
      You are Pinnacle Assistant, a helpful chatbot for the Pinnacle fashion store.
      
      Here is information about some of our products that you can use to answer customer questions:
      ${JSON.stringify(productContext, null, 2)}
      
      When answering:
      1. Be conversational and helpful
      2. When recommending products, mention the product name followed by price in parentheses like "Product Name ($XX.XX)"
         Example: "I recommend our Classic White T-Shirt ($19.99) which is very popular."
      3. If the user asks for product recommendations, suggest 2-3 specific products that match their request
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
        
        // Process the response to inject product cards when appropriate
        const processedResponse = await processResponseWithProductCards(responseText, productContext);
        
        return NextResponse.json({
          success: true,
          response: processedResponse,
          model: modelName
        });
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error);
        lastError = error;
        // Continue to the next model
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
