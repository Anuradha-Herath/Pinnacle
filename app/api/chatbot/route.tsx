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

const MODEL_PRIORITY = ["gemini-1.5-flash", "gemini-1.5-pro"];

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
const findRecommendedProducts = (responseText: string, productContext: ProductContextItem[], userQuery: string, userPreferences?: any): { products: ProductContextItem[], relevanceScore: number } => {
  console.log(`Finding product recommendations for: "${userQuery.substring(0, 50)}..."`);
  
  // Restore this check to filter out FAQ queries
  if (isGeneralInfoOrFAQ(userQuery, responseText)) {
    console.log("Detected general information or FAQ query - skipping product recommendations");
    return { products: [], relevanceScore: 0 };
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
  let totalRelevanceScore = 0;
  let matchesFound = 0;
  
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
            totalRelevanceScore += match.similarity;
            matchesFound++;
            
            if (recommendedProducts.length >= 3) {
              break;
            }
          }
        }
      }
    });
  
  // Remove the fallback random product recommendation code
  // Don't provide fallback recommendations
  
  // Calculate overall relevance score (average of matches, or 0 if none)
  const overallRelevanceScore = matchesFound > 0 ? totalRelevanceScore / matchesFound : 0;
  
  console.log("Recommendation debug info:", JSON.stringify(debug, null, 2));
  console.log(`Found ${recommendedProducts.length} recommended products with relevance score: ${overallRelevanceScore.toFixed(2)}`);
  
  if (recommendedProducts.length > 0) {
    console.log("Recommended products:", recommendedProducts.map(p => p.name).join(", "));
  }
  
  // Do not provide fallback recommendations
  return { 
    products: recommendedProducts.slice(0, 3),
    relevanceScore: overallRelevanceScore
  };
};

// Restore original threshold for determining if recommendations are relevant enough
const RELEVANCE_THRESHOLD = 0.4; // Change back from 0.2 to 0.4

// New function to detect when the response is saying we don't have a product
const isNegativeProductResponse = (responseText: string): boolean => {
  const negativePatterns = [
    /don't (currently )?have|don't (currently )?offer|don't (currently )?sell|not available|not in stock|out of stock|not in our inventory|not carry|don't carry|we don't stock|isn't available|aren't available/i,
    /we (currently )?don't have|we (currently )?don't offer|we (currently )?don't sell|we don't stock/i,
    /sorry.{1,30}(don't|doesn't|not).{1,30}(have|offer|carry|stock|available)/i
  ];
  
  return negativePatterns.some(pattern => pattern.test(responseText));
};

const processResponseWithProductCards = async (
  responseText: string, 
  productContext: ProductContextItem[], 
  userQuery: string,
  userPreferences?: any
) => {
  // First check if this is a negative product response
  if (isNegativeProductResponse(responseText)) {
    console.log("Detected negative product response - skipping recommendations");
    // Return the response without any product recommendations
    return responseText;
  }
  
  const { products: recommendedProducts, relevanceScore } = findRecommendedProducts(
    responseText, 
    productContext, 
    userQuery, 
    userPreferences
  );
  
  // Determine if the query appears to be asking for specific products
  const isProductQuery = isSpecificProductQuery(userQuery) || userQuery.toLowerCase().includes('recommend');
  
  // Handle case where we have no relevant product recommendations but the user was asking for products
  if (recommendedProducts.length === 0 && isProductQuery) {
    // Add a message about not having matching products
    return `${responseText}\n\nI'm sorry, but we don't currently have products that match your specific request in our inventory. We regularly update our collections, so please check back later or browse our available items on the website.`;
  } 
  // Include recommendations only when they're relevant and not for FAQ queries
  else if (recommendedProducts.length > 0 && relevanceScore >= RELEVANCE_THRESHOLD && !isGeneralInfoOrFAQ(userQuery, responseText)) {
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
    'pants', 'jeans', 'shoe', 'shoes', 'dress', 'hat', 'cap', 'socks',
    'outfit', 'wear', 'clothing', 'clothes', 'apparel', 'wardrobe', 'attire',
    'recommend', 'recommendation', 'suggestion', 'suggest',
    'do you have', 'do you sell', 'do you offer', 'looking for'
  ];
  
  const outfitPhrases = [
    'what should i wear', 'what to wear', 'outfit for', 'dress for',
    'clothes for', 'look for', 'attire for', 'recommend something for'
  ];
  
  const queryLower = query.toLowerCase();
  
  return specificProductTerms.some(term => queryLower.includes(term)) ||
         outfitPhrases.some(phrase => queryLower.includes(phrase));
}

// New function to make responses more concise
const makeResponseConcise = (text: string): string => {
  if (text.length < 300) return text;
  
  let conciseText = text;
  
  conciseText = conciseText.replace(/\d+\.\s+\*\*([^:]+):\*\*\s+(.*?)(?=\d+\.|$)/g, '• $1: $2\n');
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

// Fallback response system for when AI models are unavailable
const generateFallbackResponse = (query: string, productContext: ProductContextItem[], userContext?: any): { response: string, includeProducts: boolean } => {
  const queryLower = query.toLowerCase();
  
  // FAQ responses
  if (queryLower.includes('shipping') || queryLower.includes('delivery')) {
    return {
      response: "We offer free shipping on orders over $50. Standard delivery takes 3-5 business days, and express delivery takes 1-2 business days.",
      includeProducts: false
    };
  }
  
  if (queryLower.includes('return') || queryLower.includes('exchange')) {
    return {
      response: "We offer a 30-day return policy for all items in original condition. Returns are free, and exchanges are available for different sizes or colors.",
      includeProducts: false
    };
  }
  
  if (queryLower.includes('payment') || queryLower.includes('pay')) {
    return {
      response: "We accept all major credit cards, PayPal, and buy-now-pay-later options. All payments are secured with SSL encryption.",
      includeProducts: false
    };
  }
  
  if (queryLower.includes('size') || queryLower.includes('sizing')) {
    return {
      response: "You can find our size guide on each product page. We offer sizes from XS to XXL, and our customer service team can help with specific fit questions.",
      includeProducts: false
    };
  }
  
  if (queryLower.includes('contact') || queryLower.includes('help') || queryLower.includes('support')) {
    return {
      response: "You can reach our customer service team at support@pinnacle.com or through our live chat. We're available 24/7 to help!",
      includeProducts: false
    };
  }
  
  if (queryLower.includes('track') || queryLower.includes('order status')) {
    return {
      response: "You can track your order by logging into your account and visiting the 'My Orders' section. You'll also receive tracking information via email.",
      includeProducts: false
    };
  }
  
  // Product-related queries
  if (queryLower.includes('new') && (queryLower.includes('product') || queryLower.includes('arrival'))) {
    const newestProducts = [...productContext]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    if (newestProducts.length > 0) {
      return {
        response: `Here are our latest arrivals: ${newestProducts.map(p => `${p.name} ($${p.price})`).join(', ')}. Check them out!`,
        includeProducts: true
      };
    }
  }
  
  // Category-based product queries
  const categoryKeywords = ['hoodie', 'hoodies', 't-shirt', 'tshirt', 'shirt', 'jacket', 'pants', 'jeans', 'dress', 'shoes'];
  const mentionedCategory = categoryKeywords.find(cat => queryLower.includes(cat));
  
  if (mentionedCategory) {
    const categoryProducts = productContext.filter(product => {
      const productKeywords = product.keywords.toLowerCase();
      const productCategory = product.category?.toLowerCase() || '';
      const productSubCategory = product.subCategory?.toLowerCase() || '';
      
      return productKeywords.includes(mentionedCategory) || 
             productCategory.includes(mentionedCategory) ||
             productSubCategory.includes(mentionedCategory);
    }).slice(0, 3);
    
    if (categoryProducts.length > 0) {
      return {
        response: `I found these ${mentionedCategory}s for you: ${categoryProducts.map(p => `${p.name} ($${p.price})`).join(', ')}.`,
        includeProducts: true
      };
    }
  }
  
  // Color-based queries
  const colorRegex = /\b(red|blue|green|black|white|yellow|purple|pink|orange|brown|grey|gray)\b/i;
  const colorMatch = query.match(colorRegex);
  
  if (colorMatch) {
    const color = colorMatch[1].toLowerCase();
    const colorProducts = productContext.filter(product => 
      product.colors.some(c => c.toLowerCase().includes(color))
    ).slice(0, 3);
    
    if (colorProducts.length > 0) {
      return {
        response: `Here are some ${color} items: ${colorProducts.map(p => `${p.name} ($${p.price})`).join(', ')}.`,
        includeProducts: true
      };
    }
  }
  
  // User preference-based recommendations
  if ((queryLower.includes('recommend') || queryLower.includes('suggest')) && userContext) {
    const preferredProducts = productContext.filter(product => {
      if (userContext.topCategories && userContext.topCategories.includes(product.category?.toLowerCase())) {
        return true;
      }
      if (userContext.topColors && product.colors.some(color => 
        userContext.topColors.some((prefColor: string) => color.toLowerCase().includes(prefColor.toLowerCase()))
      )) {
        return true;
      }
      return false;
    }).slice(0, 3);
    
    if (preferredProducts.length > 0) {
      return {
        response: `Based on your preferences, I recommend: ${preferredProducts.map(p => `${p.name} ($${p.price})`).join(', ')}.`,
        includeProducts: true
      };
    }
  }
  
  // Generic product query
  if (queryLower.includes('do you have') || queryLower.includes('do you sell') || queryLower.includes('looking for')) {
    const randomProducts = productContext.slice(0, 3);
    if (randomProducts.length > 0) {
      return {
        response: `We have a wide selection of fashion items. Here are some popular choices: ${randomProducts.map(p => `${p.name} ($${p.price})`).join(', ')}.`,
        includeProducts: true
      };
    }
  }
  
  // Default response
  return {
    response: "I'm currently experiencing technical difficulties, but I'm here to help! Please try rephrasing your question, or contact our customer service team for immediate assistance.",
    includeProducts: false
  };
};

// Rate limiting to prevent quota exhaustion
const REQUEST_CACHE = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 50; // Adjust based on your quota
const CACHE_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

const checkRateLimit = (identifier: string): { allowed: boolean, resetTime?: number } => {
  const now = Date.now();
  const hourStart = Math.floor(now / CACHE_CLEANUP_INTERVAL) * CACHE_CLEANUP_INTERVAL;
  
  const userCache = REQUEST_CACHE.get(identifier);
  
  if (!userCache || userCache.resetTime !== hourStart) {
    REQUEST_CACHE.set(identifier, { count: 1, resetTime: hourStart });
    return { allowed: true };
  }
  
  if (userCache.count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, resetTime: hourStart + CACHE_CLEANUP_INTERVAL };
  }
  
  userCache.count++;
  return { allowed: true };
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of REQUEST_CACHE.entries()) {
    if (now - value.resetTime > CACHE_CLEANUP_INTERVAL) {
      REQUEST_CACHE.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

export async function POST(request: NextRequest) {
  let message = "";
  let userContext: any = null;
  
  try {
    await connectDB();

    const requestData = await request.json();
    message = requestData.message;
    const chatHistory = requestData.chatHistory;
    userContext = requestData.userContext;

    // Check rate limiting to prevent quota exhaustion
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitCheck = checkRateLimit(clientIP);
    
    if (!rateLimitCheck.allowed) {
      console.log(`Rate limit exceeded for ${clientIP}`);
      // Use fallback system when rate limited
      const products = await fetchFreshProductData(false);
      const productContext = prepareProductContext(products);
      const fallbackResult = generateFallbackResponse(message, productContext, userContext);
      
      return NextResponse.json({
        success: true,
        response: `${fallbackResult.response}\n\n*Note: I'm currently in simplified mode to manage server load. Full AI features will be available again shortly.*`,
        model: "rate-limited-fallback",
        productCount: productContext.length,
        fallback: true,
        rateLimited: true
      });
    }

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

    // Use fallback response system when AI models fail
    console.log("All AI models failed, using fallback response system");
    const fallbackResult = generateFallbackResponse(message, productContext, userContext);
    
    let finalResponse = fallbackResult.response;
    
    // Add product recommendations if appropriate
    if (fallbackResult.includeProducts) {
      finalResponse = await processResponseWithProductCards(
        fallbackResult.response,
        productContext,
        message,
        userContext
      );
    }
    
    return NextResponse.json({
      success: true,
      response: finalResponse,
      model: "fallback-system",
      productCount: productContext.length,
      cacheAge: Math.floor((Date.now() - lastCacheUpdate) / 1000),
      fallback: true
    });
    
  } catch (error) {
    console.error("Error processing chatbot request:", error);
    
    // Try to provide a helpful fallback even in critical errors
    try {
      await connectDB();
      const products = await fetchFreshProductData(false);
      const productContext = prepareProductContext(products);
      const fallbackResult = generateFallbackResponse(message || "help", productContext, userContext);
      
      return NextResponse.json({ 
        success: true, 
        response: fallbackResult.response,
        model: "emergency-fallback",
        productCount: productContext.length,
        fallback: true
      });
    } catch (fallbackError) {
      console.error("Fallback system also failed:", fallbackError);
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to process request",
        fallbackResponse: "I'm sorry, but I'm experiencing technical difficulties at the moment. Please try again later or contact our customer support team for assistance."
      }, { status: 500 });
    }
  }
}
