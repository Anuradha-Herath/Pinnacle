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

interface RecommendationStrategy {
  name: string;
  execute: (query: string, response: string, products: ProductContextItem[], userPreferences?: any) => ProductMatch[];
  priority: number; // Lower number = higher priority
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

// Check if a query is about general information/FAQs rather than products
const isGeneralInfoOrFAQ = (query: string, responseText: string): boolean => {
  const faqKeywords = [
    'policy', 'policies', 'shipping', 'delivery', 'return', 'exchange', 'payment', 
    'order', 'track', 'contact', 'help', 'support', 'faq', 'question', 
    'hours', 'store', 'location', 'warranty', 'guarantee', 'refund',
    'how do i', 'how can i', 'how long', 'what is'
    // Removed 'do you' as it's too broad and catches product questions
  ];
  
  // New: Product-related keywords that indicate a product query even with FAQ phrasing
  const productQueryKeywords = [
    'have', 'sell', 'offer', 'stock', 'available', 'color', 'size', 
    'price', 'cost', 'shirt', 'top', 'dress', 'pant', 'jean', 'hoodie', 
    'sweater', 'jacket', 'shoe', 'accessory', 'accessories', 'outfit'
  ];
  
  const queryLower = query.toLowerCase();
  const responseLower = responseText.toLowerCase();
  
  // Check if query contains product-specific terms like "do you have [product]"
  const isProductAvailabilityQuery = 
    (queryLower.includes('do you have') || 
     queryLower.includes('do you sell') || 
     queryLower.includes('do you offer')) && 
    productQueryKeywords.some(keyword => queryLower.includes(keyword));
  
  // If it's clearly asking about product availability, don't classify as FAQ
  if (isProductAvailabilityQuery) {
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
    (responseLower.includes('contact') && responseLower.includes('customer service'));
  
  return containsFAQKeyword || containsPolicyInfo;
};

const MODEL_PRIORITY = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

const timeoutPromise = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
};

let productCache: any[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 2 * 60 * 1000;

let knownCategories = new Set<string>();
let knownSubCategories = new Set<string>();

const shouldRefreshCache = (forceRefresh: boolean = false, newCategory: boolean = false): boolean => {
  const now = Date.now();
  return forceRefresh || 
         !productCache.length || 
         (now - lastCacheUpdate) > CACHE_TTL || 
         newCategory;
};

const fetchFreshProductData = async (forceRefresh: boolean = false): Promise<any[]> => {
  const previousKnownCategories = new Set(knownCategories);
  const previousKnownSubCategories = new Set(knownSubCategories);
  
  try {
    const allProducts = await Product.find()
      .select('category subCategory')
      .lean();
    
    const currentCategories = new Set(allProducts.map(p => p.category?.toLowerCase()).filter(Boolean));
    const currentSubCategories = new Set(allProducts.map(p => p.subCategory?.toLowerCase()).filter(Boolean));
    
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
    
    knownCategories = currentCategories;
    knownSubCategories = currentSubCategories;
    
    if (!shouldRefreshCache(forceRefresh, hasNewCategories)) {
      console.log("Using cached product data, cache age:", (Date.now() - lastCacheUpdate) / 1000, "seconds");
      return productCache;
    }

    console.log("Fetching fresh product data from database");
    
    const products = await Product.find()
      .select('_id productName regularPrice category subCategory sizes gallery description tag createdAt')
      .sort({ createdAt: -1 })
      .limit(200);
    
    productCache = products;
    lastCacheUpdate = Date.now();
    console.log(`Refreshed product cache with ${products.length} products`);
    
    const productNames = products.slice(0, 10).map(p => p.productName);
    console.log("Sample products in cache:", productNames.join(", "));
    
    return products;
  } catch (error) {
    console.error("Error fetching product data:", error);
    return productCache.length > 0 ? productCache : [];
  }
};

export { productCache, lastCacheUpdate, fetchFreshProductData, knownCategories, knownSubCategories };

const prepareProductContext = (products: any[]): ProductContextItem[] => {
  return products.map(product => {
    const colors = Array.isArray(product.gallery) 
      ? product.gallery.map((item: any) => item.color).filter(Boolean)
      : [];
    
    const uniqueColors = [...new Set(colors)] as string[];
    const normalizedName = product.productName.toLowerCase().trim();
    const createdAt = product.createdAt || new Date();
    
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

// Utility function for string similarity calculations
const stringSimilarity = (str1: string, str2: string): number => {
  const a = str1.toLowerCase();
  const b = str2.toLowerCase();
  
  if (a === b) return 1.0;
  if (a.includes(b)) return 0.9;
  if (b.includes(a)) return 0.85;
  
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  
  let wordMatches = 0;
  for (const aWord of aWords) {
    if (aWord.length < 3) continue;
    for (const bWord of bWords) {
      if (bWord.length < 3) continue;
      if (aWord === bWord || aWord.includes(bWord) || bWord.includes(aWord)) {
        wordMatches++;
        break;
      }
    }
  }
  
  const wordSimilarity = wordMatches / Math.max(aWords.length, bWords.length);
  
  const minLength = Math.min(a.length, b.length);
  let charMatches = 0;
  for (let i = 0; i < minLength; i++) {
    if (a[i] === b[i]) charMatches++;
  }
  const charSimilarity = charMatches / Math.max(a.length, b.length);
  
  return Math.max(wordSimilarity * 0.7, charSimilarity * 0.3);
};

// Strategy 1: Explicit Mentions - Find products mentioned with prices
const explicitMentionsStrategy: RecommendationStrategy = {
  name: 'explicitMentions',
  priority: 1,
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const productPriceRegex = /([A-Za-z0-9\s\-&']+)(\s+\(\$\d+(\.\d+)?\))/g;
    let matches: RegExpExecArray | null;
    const explicitProductMatches: string[] = [];
    const results: ProductMatch[] = [];
    
    while ((matches = productPriceRegex.exec(response)) !== null) {
      const potentialProductName = matches[1].trim();
      explicitProductMatches.push(potentialProductName);
    }
    
    explicitProductMatches.forEach(productName => {
      for (const product of products) {
        const similarity = stringSimilarity(product.name, productName);
        if (similarity > 0.5) {
          results.push({ product, similarity, method: 'explicit' });
        }
      }
    });
    
    return results;
  }
};

// Strategy 2: Direct Name Match - Direct product name matching from query
const directNameMatchStrategy: RecommendationStrategy = {
  name: 'directNameMatch',
  priority: 2,
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const matches: ProductMatch[] = [];
    const queryLower = query.toLowerCase();
    
    for (const product of products) {
      const productNameLower = product.normalizedName;
      
      if (queryLower.includes(productNameLower) || productNameLower.includes(queryLower)) {
        matches.push({
          product,
          similarity: stringSimilarity(query, product.name),
          method: 'direct-name'
        });
      }
    }
    
    return matches;
  }
};

// Strategy 3: Category Match - Finding products by category/subcategory
const categoryMatchStrategy: RecommendationStrategy = {
  name: 'categoryMatch',
  priority: 3,
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const queryLower = query.toLowerCase();
    const matches: ProductMatch[] = [];
    
    // Common clothing category terms
    const productCategories = [
      'hoodie', 'hoody', 'hoodies', 'sweater', 'jacket', 'tshirt', 't-shirt', 'shirt', 
      'pants', 'jeans', 'shorts', 'dress', 'skirt', 'blouse', 'coat', 'shoes', 'sneakers', 
      'boots', 'hat', 'cap', 'socks', 'accessories'
    ];
    
    const categoryMatches: string[] = [];
    for (const category of productCategories) {
      if (queryLower.includes(category)) {
        categoryMatches.push(category);
      }
    }
    
    if (categoryMatches.length > 0) {
      products.forEach(product => {
        const productCategories = [product.category, product.subCategory].map(c => c?.toLowerCase() || '');
        
        const matchesCategory = categoryMatches.some(catMatch => 
          productCategories.some(prodCat => {
            if (catMatch === 'hoodie' || catMatch === 'hoodies' || catMatch === 'hoody') {
              return prodCat === 'hoodies' || prodCat.includes('hood') || 
                    (product.keywords && product.keywords.includes('hood'));
            }
            return prodCat === catMatch || prodCat.includes(catMatch);
          })
        );
        
        if (matchesCategory) {
          matches.push({
            product,
            similarity: 0.7,
            method: 'category'
          });
        }
      });
    }
    
    // Match known categories and subcategories
    const matchingCategories = Array.from(knownCategories).filter(cat => 
      queryLower.includes(cat.toLowerCase())
    );
    
    const matchingSubCategories = Array.from(knownSubCategories).filter(subcat => 
      queryLower.includes(subcat.toLowerCase())
    );
    
    if (matchingCategories.length > 0 || matchingSubCategories.length > 0) {
      products.forEach(product => {
        const productCat = (product.category || "").toLowerCase();
        const productSubCat = (product.subCategory || "").toLowerCase();
        
        const matchesCatOrSubCat = 
          matchingCategories.some(cat => productCat.includes(cat.toLowerCase())) ||
          matchingSubCategories.some(subcat => productSubCat.includes(subcat.toLowerCase()));
          
        if (matchesCatOrSubCat) {
          matches.push({
            product,
            similarity: 0.65,
            method: 'category-term'
          });
        }
      });
    }
    
    return matches;
  }
};

// Strategy 4: New Products - Recommend newest products
const newProductsStrategy: RecommendationStrategy = {
  name: 'newProducts',
  priority: 4,
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes("new")) {
      const newestProducts = [...products].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      return newestProducts.slice(0, 5).map((product, idx) => ({
        product,
        similarity: 0.9 - (idx * 0.1),
        method: 'new-products'
      }));
    }
    
    return [];
  }
};

// Strategy 5: Color Match - Finding products by color mentions
const colorMatchStrategy: RecommendationStrategy = {
  name: 'colorMatch',
  priority: 5,
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const colorRegex = /\b(red|blue|green|black|white|yellow|purple|pink|orange|brown|grey|gray)\b/gi;
    const mentionedColors: string[] = [];
    let matches: RegExpExecArray | null;
    const results: ProductMatch[] = [];
    
    while ((matches = colorRegex.exec(query + ' ' + response)) !== null) {
      mentionedColors.push(matches[1].toLowerCase());
    }
    
    if (mentionedColors.length > 0) {
      products.forEach(product => {
        if (Array.isArray(product.colors)) {
          const hasMatchingColor = product.colors.some((color: string) => 
            mentionedColors.includes(color.toLowerCase())
          );
          
          if (hasMatchingColor) {
            results.push({
              product,
              similarity: 0.7,
              method: 'color-match'
            });
          }
        }
      });
    }
    
    return results;
  }
};

// Strategy 6: User Preference - Using user preferences and history
const userPreferenceStrategy: RecommendationStrategy = {
  name: 'userPreference',
  priority: 6,
  execute: (query: string, response: string, products: ProductContextItem[], userPreferences?: any): ProductMatch[] => {
    const results: ProductMatch[] = [];
    
    if (!userPreferences) {
      return results;
    }
    
    for (const product of products) {
      let score = 0;
      
      if (product.category && userPreferences.topCategories && 
          userPreferences.topCategories.includes(product.category.toLowerCase())) {
        score += 3;
      }
      
      if (product.colors && userPreferences.topColors) {
        for (const color of product.colors) {
          if (userPreferences.topColors.some((c: string) => 
              color.toLowerCase().includes(c.toLowerCase()))) {
            score += 2;
            break;
          }
        }
      }
      
      if (product.sizes && userPreferences.topSizes) {
        for (const size of product.sizes) {
          if (userPreferences.topSizes.includes(size)) {
            score += 1;
            break;
          }
        }
      }
      
      if (userPreferences.recentlyViewed && 
          userPreferences.recentlyViewed.some((name: string) => 
            product.name.toLowerCase().includes(name.toLowerCase()) || 
            name.toLowerCase().includes(product.name.toLowerCase()))) {
        score += 2;
      }
      
      if (score > 0) {
        results.push({
          product,
          similarity: score / 8,
          method: 'preferences'
        });
      }
    }
    
    return results;
  }
};

// Refactored findRecommendedProducts function using strategy pattern
const findRecommendedProducts = (responseText: string, productContext: ProductContextItem[], userQuery: string, userPreferences?: any): ProductContextItem[] => {
  console.log(`Finding product recommendations for: "${userQuery.substring(0, 50)}..."`);
  
  if (isGeneralInfoOrFAQ(userQuery, responseText)) {
    console.log("Detected general information or FAQ query - skipping product recommendations");
    return [];
  }
  
  // Define all recommendation strategies with their priorities
  const strategies: RecommendationStrategy[] = [
    explicitMentionsStrategy,
    directNameMatchStrategy,
    categoryMatchStrategy,
    newProductsStrategy,
    colorMatchStrategy,
    userPreferenceStrategy
  ];
  
  // Execute all strategies and collect results
  const strategyResults: Record<string, ProductMatch[]> = {};
  const debug: Record<string, any> = {};
  
  for (const strategy of strategies) {
    const matches = strategy.execute(userQuery, responseText, productContext, userPreferences);
    strategyResults[strategy.name] = matches;
    debug[strategy.name] = { found: matches.length };
  }
  
  // Process results in priority order to build recommendations
  const recommendedProducts: ProductContextItem[] = [];
  const seenProductIds = new Set<string>();
  
  // Process strategies in priority order (lower number = higher priority)
  strategies
    .sort((a, b) => a.priority - b.priority)
    .forEach(strategy => {
      const matches = strategyResults[strategy.name];
      
      if (matches.length > 0) {
        // Sort matches by similarity score
        matches.sort((a, b) => b.similarity - a.similarity);
        
        // Add unique products to recommendations
        for (const match of matches) {
          if (!seenProductIds.has(match.product.id)) {
            recommendedProducts.push(match.product);
            seenProductIds.add(match.product.id);
            
            if (recommendedProducts.length >= 3) {
              break;
            }
          }
        }
      }
    });
  
  // Fallback: If no products found, use newest products
  if (recommendedProducts.length === 0) {
    const newest = productContext.slice(0, 3);
    for (const product of newest) {
      recommendedProducts.push(product);
    }
    debug.fallback = { used: true };
  }
  
  console.log("Recommendation debug info:", JSON.stringify(debug, null, 2));
  console.log(`Found ${recommendedProducts.length} recommended products`);
  if (recommendedProducts.length > 0) {
    console.log("Recommended products:", recommendedProducts.map(p => p.name).join(", "));
  }
  
  return recommendedProducts.slice(0, 3);
};

const processResponseWithProductCards = async (
  responseText: string, 
  productContext: ProductContextItem[], 
  userQuery: string,
  userPreferences?: any
) => {
  const recommendedProducts = findRecommendedProducts(
    responseText, 
    productContext, 
    userQuery, 
    userPreferences
  );
  
  if (recommendedProducts.length > 0 && !isGeneralInfoOrFAQ(userQuery, responseText)) {
    return `${responseText}\n\n[[PRODUCT_RECOMMENDATIONS]]\n${JSON.stringify(recommendedProducts)}`;
  }
  
  return responseText;
};

const isAskingAboutNewProducts = (message: string): boolean => {
  const newProductKeywords = [
    'new product', 'new products', 'newest product', 'newest products', 'latest product', 'latest products',
    'just added', 'recently added', 'recently created', 'new item', 'new items', 'just launched', 'just released',
    'new category', 'new collection', 'new arrival', 'new arrivals'
  ];
  
  const lowercaseMessage = message.toLowerCase();
  return newProductKeywords.some(keyword => lowercaseMessage.includes(keyword));
};

const isSpecificProductQuery = (query: string): boolean => {
  const specificProductTerms = [
    'hoodie', 'hoodies', 'hoody', 't-shirt', 'tshirt', 'jacket', 'sweater',
    'pants', 'jeans', 'shoe', 'shoes', 'dress', 'hat', 'cap', 'socks'
  ];
  
  const queryLower = query.toLowerCase();
  
  return specificProductTerms.some(term => queryLower.includes(term));
}

// New function to make responses more concise
const makeResponseConcise = (text: string): string => {
  if (text.length < 300) return text;
  
  let conciseText = text;
  
  conciseText = conciseText.replace(/\d+\.\s+\*\*([^:]+):\*\*\s+(.*?)(?=\d+\.|$)/gs, '• $1: $2\n');
  conciseText = conciseText.replace(/\n{3,}/g, '\n\n');
  
  const formalities = [
    /However, remember that .+\./g,
    /Please note that .+\./g,
    /I'm happy to help you with .+\./g,
    /I'd be glad to assist you with .+\./g,
    /Feel free to .+\./g,
    /Don't hesitate to .+\./g,
    /If you have any (other|more) questions, .+\./g,
    /If you need anything else, .+\./g
  ];
  
  formalities.forEach(pattern => {
    conciseText = conciseText.replace(pattern, '');
  });
  
  if (conciseText.length > 500) {
    const sentences = conciseText.split(/\.\s+/);
    if (sentences.length > 5) {
      conciseText = [...sentences.slice(0, 2), ...sentences.slice(-3)].join('. ') + '.';
    }
  }
  
  return conciseText.trim();
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { message, chatHistory, userContext } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: "Gemini API key is not configured" 
      }, { status: 500 });
    }

    const forceRefresh = isAskingAboutNewProducts(message);
    
    console.log(`Processing query: "${message}". Force refresh? ${forceRefresh}`);
    
    const products = await fetchFreshProductData(forceRefresh);
    
    const productContext = prepareProductContext(products);
    
    console.log(`Prepared ${productContext.length} products for recommendations`);

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const systemPrompt = `
      You are Pinnacle Assistant, a helpful chatbot for the Pinnacle fashion store.
      
      VERY IMPORTANT: Keep your responses brief and to the point. Aim for 1-3 short sentences when possible.
      Avoid lengthy explanations and excessive formatting. Be direct and friendly but concise.
      
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
      - Be brief but precise about sizing information
      - Mention if a product runs small, large, or true to size
      - Reference user's preferred sizes when available
      
      ${generateFAQPrompt()}
      
      ADDITIONAL GUIDELINES:
      - When asked about shipping, returns, payments, or other policy questions, consult the FAQ section above
      - Keep explanations minimal - users prefer direct answers without lengthy context
      - Never apologize excessively or use overly formal language
      - If you don't know an answer, say so briefly and move on
      
      When answering:
      1. Use short sentences and minimal formatting
      2. Avoid numbered lists unless absolutely necessary 
      3. When recommending products, use this format: "Product Name ($XX.XX)"
      4. Aim to keep total response to 1-3 sentences when possible
    `;

    const formattedChatHistory = chatHistory.map((msg: any) => ({
      role: msg.isUser ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const conversation = [
      { role: "model", parts: [{ text: systemPrompt }] },
      ...formattedChatHistory,
      { role: "user", parts: [{ text: message }] },
    ];

    let lastError = null;
    for (const modelName of MODEL_PRIORITY) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await Promise.race([
          model.generateContent({
            contents: conversation,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
              topP: 0.8,
            },
          }),
          timeoutPromise(15000)
        ]) as GenerateContentResult;

        let responseText = result.response.text();
        
        responseText = makeResponseConcise(responseText);
        
        const processedResponse = await processResponseWithProductCards(
          responseText, 
          productContext, 
          message,
          userContext
        );
        
        return NextResponse.json({
          success: true,
          response: processedResponse,
          model: modelName,
          productCount: productContext.length,
          cacheAge: Math.floor((Date.now() - lastCacheUpdate) / 1000)
        });
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error);
        lastError = error;
      }
    }

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
