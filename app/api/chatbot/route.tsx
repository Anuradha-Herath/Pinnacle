import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from "@google/generative-ai";
import Product from "@/models/Product";
import { generateFAQPrompt } from "@/lib/faqData"; // Import the FAQ prompt generator

// Define interfaces for type safety
interface ProductContextItem {
  id: string;
  name: string;
  normalizedName: string;
  price: string;
  category: string;
  subCategory: string;
  sizes: string[];
  colors: string[];
  image: string | null;
  description: string;
  keywords: string;
  tag: string | null;
  createdAt: Date;
}

interface ProductMatch {
  product: ProductContextItem;
  similarity: number;
  method: string;
}

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

// Product cache with TTL mechanism
let productCache: any[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 2 * 60 * 1000; // Reduced to 2 minutes to catch new products faster

// Store unique categories we've seen
let knownCategories = new Set<string>();
let knownSubCategories = new Set<string>();

// Function to check if the cache should be refreshed
const shouldRefreshCache = (forceRefresh: boolean = false, newCategory: boolean = false): boolean => {
  const now = Date.now();
  return forceRefresh || 
         !productCache.length || 
         (now - lastCacheUpdate) > CACHE_TTL || 
         newCategory;
};

// Function to fetch fresh product data from database
const fetchFreshProductData = async (forceRefresh: boolean = false): Promise<any[]> => {
  // Get current categories and subcategories before fetching
  const previousKnownCategories = new Set(knownCategories);
  const previousKnownSubCategories = new Set(knownSubCategories);
  
  try {
    // Always fetch all categories to detect new ones
    const allProducts = await Product.find()
      .select('category subCategory')
      .lean();
    
    // Extract all unique categories and subcategories
    const currentCategories = new Set(allProducts.map(p => p.category?.toLowerCase()).filter(Boolean));
    const currentSubCategories = new Set(allProducts.map(p => p.subCategory?.toLowerCase()).filter(Boolean));
    
    // Check if any new categories were added
    let hasNewCategories = false;
    currentCategories.forEach(cat => {
      if (!previousKnownCategories.has(cat)) {
        console.log(`Detected new category: ${cat}`);
        hasNewCategories = true;
      }
    });
    
    currentSubCategories.forEach(subcat => {
      if (!previousKnownSubCategories.has(subcat)) {
        console.log(`Detected new subcategory: ${subcat}`);
        hasNewCategories = true;
      }
    });
    
    // Update our known categories
    knownCategories = currentCategories;
    knownSubCategories = currentSubCategories;
    
    // If we don't need to refresh (and no new categories found), return cached data
    if (!shouldRefreshCache(forceRefresh, hasNewCategories)) {
      console.log("Using cached product data, cache age:", (Date.now() - lastCacheUpdate) / 1000, "seconds");
      return productCache;
    }

    console.log("Fetching fresh product data from database");
    
    // Fetch all products
    const products = await Product.find()
      .select('_id productName regularPrice category subCategory sizes gallery description tag createdAt')
      .sort({ createdAt: -1 }) // Get newest products first
      .limit(200);
    
    productCache = products;
    lastCacheUpdate = Date.now();
    console.log(`Refreshed product cache with ${products.length} products`);
    
    // Debug: Log names of first few products in cache
    const productNames = products.slice(0, 10).map(p => p.productName);
    console.log("Sample products in cache:", productNames.join(", "));
    
    return products;
  } catch (error) {
    console.error("Error fetching product data:", error);
    // If error fetching new data, return cached data if available, otherwise empty array
    return productCache.length > 0 ? productCache : [];
  }
};

// Export the cache for refresh endpoint to access
export { productCache, lastCacheUpdate, fetchFreshProductData, knownCategories, knownSubCategories };

// Enhanced function to prepare product context with more detailed information
const prepareProductContext = (products: any[]): ProductContextItem[] => {
  return products.map(product => {
    // Extract colors from gallery items
    const colors = Array.isArray(product.gallery) 
      ? product.gallery.map((item: any) => item.color).filter(Boolean)
      : [];
    
    // Create a unique set of colors (no duplicates)
    // Add type assertion to specify that uniqueColors is a string array
    const uniqueColors = [...new Set(colors)] as string[];
    
    // Add normalized name for better matching
    const normalizedName = product.productName.toLowerCase().trim();
    
    // Extract creation date for sorting by newness
    const createdAt = product.createdAt || new Date();
    
    // Generate important keywords based on product attributes - more comprehensive
    const keywordParts = [
      product.productName,
      product.category,
      product.subCategory,
      product.description,
      product.tag,
      ...uniqueColors,
      ...product.sizes || []
    ].filter(Boolean);
    
    return {
      id: product._id.toString(),
      name: product.productName,
      normalizedName,
      price: product.regularPrice.toFixed(2),
      category: product.category, 
      subCategory: product.subCategory,
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      colors: uniqueColors,
      image: product.gallery && product.gallery.length > 0 ? product.gallery[0].src : null,
      description: product.description || "No description available",
      keywords: keywordParts.join(' ').toLowerCase(),
      tag: product.tag || null,
      createdAt: createdAt
    };
  });
};

// Improved product matching algorithm with multiple strategies
const findRecommendedProducts = (responseText: string, productContext: ProductContextItem[], userQuery: string, userPreferences?: any): ProductContextItem[] => {
  console.log(`Finding product recommendations for: "${userQuery.substring(0, 50)}..."`);
  const recommendedProducts: ProductContextItem[] = [];
  const debug = { strategies: {} as any };
  
  // Strategy 1: Look for explicit product recommendations in format "product_name ($price)"
  const productPriceRegex = /([A-Za-z0-9\s\-&']+)(\s+\(\$\d+(\.\d+)?\))/g;
  let matches: RegExpExecArray | null;
  const explicitProductMatches: string[] = [];
  
  while ((matches = productPriceRegex.exec(responseText)) !== null) {
    const potentialProductName = matches[1].trim();
    explicitProductMatches.push(potentialProductName);
  }
  debug.strategies.explicitFormat = { found: explicitProductMatches.length };
  
  // Strategy 2: Extract potential product names using more flexible patterns
  // This regex looks for capitalized phrases that might be product names
  const potentialProductRegex = /\b([A-Z][A-Za-z0-9\s\-&']{2,})\b/g;
  const potentialProductMatches: string[] = [];
  
  while ((matches = potentialProductRegex.exec(responseText)) !== null) {
    const potentialProduct = matches[1].trim();
    // Filter out common non-product capitalized words
    if (potentialProduct !== 'I' && 
        potentialProduct !== 'Pinnacle' && 
        !potentialProduct.startsWith('The ') && 
        potentialProduct.length > 3) {
      potentialProductMatches.push(potentialProduct);
    }
  }
  debug.strategies.capitalizedPhrases = { found: potentialProductMatches.length };
  
  // Strategy 3: Direct query match - look for specific product names or categories in user query
  const queryTerms = userQuery.toLowerCase().split(/\s+/);
  const relevantQueryTerms = queryTerms.filter(term => 
    term.length > 3 && 
    !['what', 'which', 'when', 'where', 'show', 'find', 'for', 'me', 'some', 'any', 'the'].includes(term)
  );
  debug.strategies.queryTerms = { terms: relevantQueryTerms };
  
  // Strategy 4: Look for specific categories or types of products in user query
  const categoryMatches: string[] = [];
  const productCategories = [
    'hoodie', 'hoody', 'hoodies', 'sweater', 'jacket', 'tshirt', 't-shirt', 'shirt', 
    'pants', 'jeans', 'shorts', 'dress', 'skirt', 'blouse', 'coat', 'shoes', 'sneakers', 
    'boots', 'hat', 'cap', 'socks', 'accessories'
  ];
  
  for (const category of productCategories) {
    if (userQuery.toLowerCase().includes(category)) {
      categoryMatches.push(category);
    }
  }
  debug.strategies.categoryMatches = { found: categoryMatches };
  
  // Function to calculate string similarity (improved version)
  const stringSimilarity = (str1: string, str2: string): number => {
    const a = str1.toLowerCase();
    const b = str2.toLowerCase();
    
    // Check for exact match or substring inclusion
    if (a === b) return 1.0;
    if (a.includes(b)) return 0.9;
    if (b.includes(a)) return 0.85;
    
    // Check for word matches (useful for multi-word names)
    const aWords = a.split(/\s+/);
    const bWords = b.split(/\s+/);
    
    let wordMatches = 0;
    for (const aWord of aWords) {
      if (aWord.length < 3) continue; // Skip short words
      for (const bWord of bWords) {
        if (bWord.length < 3) continue;
        if (aWord === bWord || aWord.includes(bWord) || bWord.includes(aWord)) {
          wordMatches++;
          break;
        }
      }
    }
    
    const wordSimilarity = wordMatches / Math.max(aWords.length, bWords.length);
    
    // Count character matches
    const minLength = Math.min(a.length, b.length);
    let charMatches = 0;
    for (let i = 0; i < minLength; i++) {
      if (a[i] === b[i]) charMatches++;
    }
    const charSimilarity = charMatches / Math.max(a.length, b.length);
    
    // Calculate weighted similarity
    return Math.max(wordSimilarity * 0.7, charSimilarity * 0.3);
  };
  
  // Match products based on explicit recommendations (highest priority)
  if (explicitProductMatches.length > 0) {
    const matches: ProductMatch[] = [];
    explicitProductMatches.forEach(productName => {
      for (const product of productContext) {
        // Look for strong matches with product name
        const similarity = stringSimilarity(product.name, productName);
        if (similarity > 0.5) {
          matches.push({product, similarity, method: 'explicit'});
        }
      }
    });
    
    // Sort by similarity and add unique products
    matches.sort((a, b) => b.similarity - a.similarity);
    for (const match of matches) {
      if (!recommendedProducts.some(p => p.id === match.product.id)) {
        recommendedProducts.push(match.product);
        if (recommendedProducts.length >= 3) break;
      }
    }
    debug.strategies.explicitMatches = { found: matches.length };
  }
  
  // If specific product mentioned in query, try direct matching (high priority)
  // Important for specific product names like "Calypso Hoody"
  if (recommendedProducts.length === 0) {
    const matches: ProductMatch[] = [];
    for (const product of productContext) {
      const queryLower = userQuery.toLowerCase();
      const productNameLower = product.normalizedName;
      
      if (queryLower.includes(productNameLower) || productNameLower.includes(queryLower)) {
        matches.push({
          product,
          similarity: stringSimilarity(userQuery, product.name),
          method: 'direct-name'
        });
      }
    }
    
    // Sort by similarity and add unique products
    matches.sort((a, b) => b.similarity - a.similarity);
    for (const match of matches) {
      if (!recommendedProducts.some(p => p.id === match.product.id)) {
        recommendedProducts.push(match.product);
        if (recommendedProducts.length >= 3) break;
      }
    }
    debug.strategies.directMatches = { found: matches.length };
  }
  
  // If we still don't have recommendations, try category matching
  if (recommendedProducts.length === 0 && categoryMatches.length > 0) {
    const categoryFiltered = productContext.filter(product => {
      const productCategories = [product.category, product.subCategory].map(c => c?.toLowerCase() || '');
      
      return categoryMatches.some(catMatch => 
        productCategories.some(prodCat => {
          // Special handling for hoodies
          if (catMatch === 'hoodie' || catMatch === 'hoodies' || catMatch === 'hoody') {
            return prodCat === 'hoodies' || prodCat.includes('hood') || 
                  (product.keywords && product.keywords.includes('hood'));
          }
          return prodCat === catMatch || prodCat.includes(catMatch);
        })
      );
    });
    
    // Add up to 3 products that match the category
    for (let i = 0; i < Math.min(3, categoryFiltered.length); i++) {
      if (!recommendedProducts.some(p => p.id === categoryFiltered[i].id)) {
        recommendedProducts.push(categoryFiltered[i]);
      }
    }
    
    debug.strategies.categoryFiltered = { count: categoryFiltered.length };
  }
  
  // If we still don't have recommendations, try using potential product names
  if (recommendedProducts.length === 0 && potentialProductMatches.length > 0) {
    const matches: ProductMatch[] = [];
    potentialProductMatches.forEach(productName => {
      for (const product of productContext) {
        // Check if the product name or keywords contains the potential product name
        const similarity = stringSimilarity(product.name, productName);
        if (similarity > 0.5) {
          matches.push({product, similarity, method: 'potential-name'});
        }
      }
    });
    
    // Sort by similarity and add unique products
    matches.sort((a, b) => b.similarity - a.similarity);
    for (const match of matches) {
      if (!recommendedProducts.some(p => p.id === match.product.id)) {
        recommendedProducts.push(match.product);
        if (recommendedProducts.length >= 3) break;
      }
    }
    
    debug.strategies.potentialNames = { found: matches.length };
  }
  
  // New strategy: Match by any category or subcategory mentioned in query
  // This is a more generic approach that doesn't require predefined category lists
  if (recommendedProducts.length === 0) {
    // Extract potential category or subcategory terms from the query
    const queryLower = userQuery.toLowerCase();
    
    // Use our known categories and subcategories to match
    const matchingCategories = Array.from(knownCategories).filter(cat => 
      queryLower.includes(cat.toLowerCase())
    );
    
    const matchingSubCategories = Array.from(knownSubCategories).filter(subcat => 
      queryLower.includes(subcat.toLowerCase())
    );
    
    if (matchingCategories.length > 0 || matchingSubCategories.length > 0) {
      console.log("Found matching categories:", matchingCategories);
      console.log("Found matching subcategories:", matchingSubCategories);
      
      const categoryFiltered = productContext.filter(product => {
        const productCat = (product.category || "").toLowerCase();
        const productSubCat = (product.subCategory || "").toLowerCase();
        
        return matchingCategories.some(cat => productCat.includes(cat.toLowerCase())) ||
               matchingSubCategories.some(subcat => productSubCat.includes(subcat.toLowerCase()));
      });
      
      // Add up to 3 category-matching products
      for (let i = 0; i < Math.min(3, categoryFiltered.length); i++) {
        if (!recommendedProducts.some(p => p.id === categoryFiltered[i].id)) {
          recommendedProducts.push(categoryFiltered[i]);
        }
      }
    }
  }
  
  // Strategy: Recommend products based on creation date (newest products)
  // This will catch newly added products regardless of category
  if (recommendedProducts.length === 0 && userQuery.toLowerCase().includes("new")) {
    // Sort by creation date
    const newestProducts = [...productContext].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 3);
    
    for (const product of newestProducts) {
      if (!recommendedProducts.some(p => p.id === product.id)) {
        recommendedProducts.push(product);
      }
    }
  }
  
  // If we still don't have recommendations but specific colors are mentioned
  if (recommendedProducts.length === 0) {
    const colorRegex = /\b(red|blue|green|black|white|yellow|purple|pink|orange|brown|grey|gray)\b/gi;
    const mentionedColors: string[] = [];
    while ((matches = colorRegex.exec(userQuery + ' ' + responseText)) !== null) {
      mentionedColors.push(matches[1].toLowerCase());
    }
    
    if (mentionedColors.length > 0) {
      const colorMatches: ProductContextItem[] = [];
      productContext.forEach(product => {
        if (Array.isArray(product.colors)) {
          const hasMatchingColor = product.colors.some((color: string) => 
            mentionedColors.includes(color.toLowerCase())
          );
          
          if (hasMatchingColor) {
            colorMatches.push(product);
          }
        }
      });
      
      // Add up to 3 color-matching products
      for (let i = 0; i < Math.min(3, colorMatches.length); i++) {
        if (!recommendedProducts.some(p => p.id === colorMatches[i].id)) {
          recommendedProducts.push(colorMatches[i]);
        }
      }
      
      debug.strategies.colorMatches = { found: colorMatches.length };
    }
  }
  
  // If absolutely nothing else worked, recommend newest products
  if (recommendedProducts.length === 0) {
    // Grab the first 3 products (which should be newest because of our sort order)
    const newest = productContext.slice(0, 3);
    for (const product of newest) {
      recommendedProducts.push(product);
    }
    
    debug.strategies.fallback = { used: true };
  }

  // New strategy: Use user preferences for personalized recommendations
  if (recommendedProducts.length < 3 && userPreferences) {
    console.log("Using user preferences for recommendations");
    
    const preferenceMatches: ProductMatch[] = [];
    
    // Calculate a preference score for each product based on user history
    for (const product of productContext) {
      let score = 0;
      
      // Check if product matches user's preferred categories
      if (product.category && userPreferences.topCategories.includes(product.category.toLowerCase())) {
        score += 3; // Higher weight for category match
      }
      
      // Check if product matches user's preferred colors
      if (product.colors && userPreferences.topColors) {
        for (const color of product.colors) {
          if (userPreferences.topColors.some((c: string) => color.toLowerCase().includes(c.toLowerCase()))) {
            score += 2;
            break;
          }
        }
      }
      
      // Check if product matches user's preferred sizes
      if (product.sizes && userPreferences.topSizes) {
        for (const size of product.sizes) {
          if (userPreferences.topSizes.includes(size)) {
            score += 1;
            break;
          }
        }
      }
      
      // Check if product is something the user recently viewed
      if (userPreferences.recentlyViewed && 
          userPreferences.recentlyViewed.some((name: string) => 
            product.name.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(product.name.toLowerCase()))) {
        score += 2; // Boost score for previously viewed items
      }
      
      // Only include products with some preference match
      if (score > 0) {
        preferenceMatches.push({
          product,
          similarity: score / 8, // Normalize score between 0-1
          method: 'preferences'
        });
      }
    }
    
    // Sort by preference score and add unique products
    preferenceMatches.sort((a, b) => b.similarity - a.similarity);
    for (const match of preferenceMatches) {
      if (!recommendedProducts.some(p => p.id === match.product.id)) {
        recommendedProducts.push(match.product);
        if (recommendedProducts.length >= 3) break;
      }
    }
    
    debug.strategies.preferences = { found: preferenceMatches.length };
  }

  console.log("Recommendation debug info:", JSON.stringify(debug, null, 2));
  console.log(`Found ${recommendedProducts.length} recommended products`);
  if (recommendedProducts.length > 0) {
    console.log("Recommended products:", recommendedProducts.map(p => p.name).join(", "));
  }
  
  // Limit recommendations to prevent overwhelming the chat
  return recommendedProducts.slice(0, 3);
};

// Process AI response to inject product cards with improved matching
const processResponseWithProductCards = async (
  responseText: string, 
  productContext: ProductContextItem[], 
  userQuery: string,
  userPreferences?: any
) => {
  // Find recommended products using our improved algorithm with user preferences
  const recommendedProducts = findRecommendedProducts(
    responseText, 
    productContext, 
    userQuery, 
    userPreferences
  );
  
  // If we found matching products, add structured product data to the response
  if (recommendedProducts.length > 0) {
    // Add a special marker that the frontend can detect and replace with product cards
    return `${responseText}\n\n[[PRODUCT_RECOMMENDATIONS]]\n${JSON.stringify(recommendedProducts)}`;
  }
  
  return responseText;
};

// Check if a message indicates the user is asking about new products
const isAskingAboutNewProducts = (message: string): boolean => {
  const newProductKeywords = [
    'new product', 'new products', 'newest product', 'newest products', 'latest product', 'latest products',
    'just added', 'recently added', 'recently created', 'new item', 'new items', 'just launched', 'just released',
    'new category', 'new collection', 'new arrival', 'new arrivals'
  ];
  
  const lowercaseMessage = message.toLowerCase();
  return newProductKeywords.some(keyword => lowercaseMessage.includes(keyword));
};

// Check if query is about specific products or categories
const isSpecificProductQuery = (query: string): boolean => {
  const specificProductTerms = [
    'hoodie', 'hoodies', 'hoody', 't-shirt', 'tshirt', 'jacket', 'sweater',
    'pants', 'jeans', 'shoe', 'shoes', 'dress', 'hat', 'cap', 'socks'
  ];
  
  const queryLower = query.toLowerCase();
  
  // Check if query contains specific product terms
  return specificProductTerms.some(term => queryLower.includes(term));
}

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectDB();

    // Get the message and chat history from the request
    const { message, chatHistory, userContext } = await request.json();

    // Check if API key is defined
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: "Gemini API key is not configured" 
      }, { status: 500 });
    }

    // Check if forcing a refresh is needed
    const forceRefresh = isAskingAboutNewProducts(message);
    
    // Debug log
    console.log(`Processing query: "${message}". Force refresh? ${forceRefresh}`);
    
    // Fetch product data (either from cache or fresh from DB)
    const products = await fetchFreshProductData(forceRefresh);
    
    // Format product data with enhanced context
    const productContext = prepareProductContext(products);
    
    // Log how many products are available for recommendations
    console.log(`Prepared ${productContext.length} products for recommendations`);

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Enhanced system prompt with user preferences
    const systemPrompt = `
      You are Pinnacle Assistant, a helpful chatbot for the Pinnacle fashion store.
      
      Here's information about our products that you can use to answer customer questions:
      ${JSON.stringify(productContext, null, 2)}
      
      Our store has these categories: ${Array.from(knownCategories).join(", ")}
      And these subcategories: ${Array.from(knownSubCategories).join(", ")}
      
      Product information was last updated: ${new Date(lastCacheUpdate).toLocaleString()}
      
      ${userContext ? `
      USER PREFERENCES:
      Recently viewed products: ${userContext.recentlyViewed?.join(", ") || "None"}
      Preferred categories: ${userContext.topCategories?.join(", ") || "None"}
      Preferred colors: ${userContext.topColors?.join(", ") || "None"}
      Preferred sizes: ${userContext.topSizes?.join(", ") || "None"}
      Preferred price ranges: ${userContext.topPriceRanges?.join(", ") || "None"}
      
      ${userContext.preferredSizes ? `
      USER'S PREFERRED SIZES BY CATEGORY:
      ${Object.entries(userContext.preferredSizes)
        .map(([category, size]) => `${category}: ${size}`)
        .join("\n")}
      ` : ''}
      
      ${userContext.measurements && Object.keys(userContext.measurements).length > 0 ? `
      USER'S MEASUREMENTS:
      ${Object.entries(userContext.measurements)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")}
      ` : ''}
      
      ${userContext.preferredFitTypes && userContext.preferredFitTypes.length > 0 ? `
      USER'S PREFERRED FIT TYPES: ${userContext.preferredFitTypes.join(", ")}
      ` : ''}
      
      When making recommendations, prioritize products that match the user's preferences,
      especially for categories and colors they've shown interest in.
      If they haven't specified a preference in their query, use their browsing history as a guide.
      ` : ''}
      
      SIZE AND FIT RECOMMENDATION CAPABILITIES:
      - When users ask about sizing or fit, provide detailed guidance
      - If a product runs small, large, or true to size, mention this information
      - Use the product's fitType (Slim Fit, Regular Fit, etc.) to guide recommendations
      - Reference the user's preferred sizes by category when available
      - Consider the user's measurements when providing size recommendations
      - Explain why you're recommending a particular size
      - When uncertain, suggest the user refers to specific measurements in our size chart
      
      Examples of good size recommendations:
      "Based on your previous purchases of medium in T-shirts and your preference for a regular fit, I recommend a medium in this product as well. It's true to size with a regular fit through the chest and shoulders."
      
      "This shirt tends to run small, especially around the chest. Since you typically wear a medium, I'd suggest sizing up to a large for a more comfortable fit."
      
      ${generateFAQPrompt()}
      
      ADDITIONAL GUIDELINES:
      - When asked about shipping, returns, payments, or other policy questions, consult the FAQ section above
      - Give accurate and complete answers based on the FAQs provided
      - If a question is slightly different from the FAQ but on the same topic, adapt the answer accordingly
      - If you don't know an answer and it's not in the FAQs, politely say so and suggest contacting customer service
      - Never make up information about policies or products
      
      When answering:
      1. Be conversational and helpful
      2. When recommending products, use this format: "Product Name ($XX.XX)"
      3. Recommend products from ANY category that matches the customer's request
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
        ]) as GenerateContentResult;

        // If we get here, the model worked
        const responseText = result.response.text();
        
        // Process the response to inject product cards with improved matching and user preferences
        const processedResponse = await processResponseWithProductCards(
          responseText, 
          productContext, 
          message,
          userContext // Pass user preferences to the processor
        );
        
        return NextResponse.json({
          success: true,
          response: processedResponse,
          model: modelName,
          productCount: productContext.length,
          cacheAge: Math.floor((Date.now() - lastCacheUpdate) / 1000) // Cache age in seconds
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
