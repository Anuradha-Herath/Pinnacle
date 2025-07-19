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
    'how do i', 'how can i', 'how long', 'what is', 'what are', 'when do',
    'process', 'procedure', 'steps', 'method', 'way to', 'cost of shipping',
    'free shipping', 'customer service', 'business hours', 'opening hours'
  ];
  
  // Strong FAQ indicators that should never show product recommendations
  const strongFAQIndicators = [
    'return policy', 'shipping policy', 'exchange policy', 'refund policy',
    'how long does shipping take', 'how much does shipping cost',
    'what is your return policy', 'what are your hours',
    'how do i return', 'how do i exchange', 'how do i track',
    'customer service', 'contact information', 'business hours'
  ];
  
  // Product-related keywords that indicate a product query even with FAQ phrasing
  const productQueryKeywords = [
    'have', 'sell', 'offer', 'stock', 'available', 'color', 'size', 
    'price', 'cost', 'shirt', 'top', 'dress', 'pant', 'jean', 'hoodie', 
    'sweater', 'jacket', 'shoe', 'accessory', 'accessories', 'outfit',
    'recommend', 'suggestion', 'looking for', 'need', 'want', 'style'
  ];
  
  const queryLower = query.toLowerCase();
  const responseLower = responseText.toLowerCase();
  
  // Check for strong FAQ indicators first
  if (strongFAQIndicators.some(indicator => queryLower.includes(indicator))) {
    return true;
  }
  
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
  
  // Check if the query is asking for recommendations or suggestions
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

// Optimized model priority based on rate limits - prioritize higher RPM models
const MODEL_PRIORITY = [
  "gemini-2.0-flash-lite",      // 30 RPM, 1M TPM, 200 RPD
  "gemini-2.0-flash",           // 15 RPM, 1M TPM, 200 RPD  
  "gemini-2.5-flash-lite-preview-06-17", // 15 RPM, 250K TPM, 1000 RPD
  "gemini-2.5-flash",           // 10 RPM, 250K TPM, 250 RPD
  "gemini-2.5-pro",             // 5 RPM, 250K TPM, 100 RPD (last resort)
];

const timeoutPromise = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
};

let productCache: any[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 5 * 60 * 1000; // Increased to 5 minutes to reduce DB calls

// Rate limiting tracking
let requestCount = 0;
let lastRequestReset = Date.now();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 25; // Conservative limit

// Check rate limits
const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Reset counter if window has passed
  if (now - lastRequestReset > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    lastRequestReset = now;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    console.warn(`Rate limit exceeded: ${requestCount} requests in current window`);
    return false;
  }
  
  requestCount++;
  return true;
};

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
  priority: 2, // Changed from 1 to 2 to avoid conflict with responseCategoryStrategy
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const productPriceRegex = /([A-Za-z0-9\s\-&']+)(\s+\(\$\d+(\.\d+)?\))/g;
    let matches: RegExpExecArray | null;
    const explicitProductMatches: string[] = [];
    const results: ProductMatch[] = [];
    
    // Apply gender filtering
    const genderPreference = detectGenderPreference(query, response);
    const filteredProducts = filterProductsByGender(products, genderPreference);
    
    console.log(`Explicit mentions strategy: Gender preference ${genderPreference}, filtered from ${products.length} to ${filteredProducts.length} products`);
    
    while ((matches = productPriceRegex.exec(response)) !== null) {
      const potentialProductName = matches[1].trim();
      explicitProductMatches.push(potentialProductName);
    }
    
    explicitProductMatches.forEach(productName => {
      for (const product of filteredProducts) { // Use filtered products instead of all products
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
  priority: 3, // Changed from 2 to 3
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const matches: ProductMatch[] = [];
    const queryLower = query.toLowerCase();
    
    // Apply gender filtering
    const genderPreference = detectGenderPreference(query, response);
    const filteredProducts = filterProductsByGender(products, genderPreference);
    
    console.log(`Direct name strategy: Gender preference ${genderPreference}, filtered from ${products.length} to ${filteredProducts.length} products`);
    
    for (const product of filteredProducts) {
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
  priority: 4, // Changed from 3 to 4
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const queryLower = query.toLowerCase();
    const responseLower = response.toLowerCase();
    const matches: ProductMatch[] = [];
    
    // Detect gender preference and filter products accordingly
    const genderPreference = detectGenderPreference(query, response);
    const filteredProducts = filterProductsByGender(products, genderPreference);
    
    console.log(`Category strategy: Gender preference ${genderPreference}, filtered from ${products.length} to ${filteredProducts.length} products`);
    
    // Enhanced clothing category terms with more variations
    const productCategories = [
      'hoodie', 'hoody', 'hoodies', 'sweater', 'jacket', 'tshirt', 't-shirt', 'shirt', 
      'pants', 'jeans', 'shorts', 'dress', 'dresses', 'skirt', 'skirts', 'blouse', 'coat', 
      'shoes', 'sneakers', 'boots', 'hat', 'cap', 'socks', 'accessories', 'crop top', 
      'crop tops', 'leggings', 'tanks', 'tank top', 'tank tops', 'joggers', 'sweatshirt',
      'gym', 'workout', 'sports', 'athletic'
    ];
    
    // Gender-specific categories
    const womenCategories = [
      'dress', 'dresses', 'skirt', 'skirts', 'crop top', 'crop tops', 'leggings', 
      'tanks', 'tank top', 'tank tops', 'blouse', 'women', 'ladies'
    ];
    
    const menCategories = [
      'men', 'mens', 'guys', 'male'
    ];
    
    // Check for gender-specific requests
    const isWomenQuery = queryLower.includes('women') || queryLower.includes('ladies') || 
                         womenCategories.some(cat => queryLower.includes(cat) || responseLower.includes(cat));
    const isMenQuery = queryLower.includes('men') || queryLower.includes('guys') || 
                       menCategories.some(cat => queryLower.includes(cat));
    
    // Find category matches in query and response
    const categoryMatches: string[] = [];
    for (const category of productCategories) {
      if (queryLower.includes(category) || responseLower.includes(category)) {
        categoryMatches.push(category);
      }
    }
    
    // If we have category matches, find matching products
    if (categoryMatches.length > 0 || isWomenQuery || isMenQuery) {
      filteredProducts.forEach(product => {
        const productCategories = [product.category, product.subCategory].map(c => c?.toLowerCase() || '');
        const productKeywords = product.keywords.toLowerCase();
        
        let isMatch = false;
        let similarity = 0.5;
        
        // Check for specific category matches
        if (categoryMatches.length > 0) {
          const matchesCategory = categoryMatches.some(catMatch => 
            productCategories.some(prodCat => {
              // Special handling for different category variations
              if (catMatch.includes('hoodie') || catMatch.includes('hoody')) {
                return prodCat.includes('hoodie') || prodCat.includes('hoody') || productKeywords.includes('hood');
              }
              if (catMatch.includes('dress')) {
                return prodCat.includes('dress') || productKeywords.includes('dress');
              }
              if (catMatch.includes('skirt')) {
                return prodCat.includes('skirt') || productKeywords.includes('skirt');
              }
              if (catMatch.includes('crop')) {
                return prodCat.includes('crop') || productKeywords.includes('crop');
              }
              if (catMatch.includes('leggings')) {
                return prodCat.includes('legging') || productKeywords.includes('legging');
              }
              if (catMatch.includes('tank')) {
                return prodCat.includes('tank') || productKeywords.includes('tank');
              }
              if (catMatch.includes('short')) {
                return prodCat.includes('short') || productKeywords.includes('short');
              }
              if (catMatch.includes('gym') || catMatch.includes('workout') || catMatch.includes('sports') || catMatch.includes('athletic')) {
                return prodCat.includes('sport') || prodCat.includes('gym') || prodCat.includes('athletic') ||
                       productKeywords.includes('sport') || productKeywords.includes('gym') || productKeywords.includes('athletic');
              }
              return prodCat.includes(catMatch) || productKeywords.includes(catMatch);
            })
          );
          
          if (matchesCategory) {
            isMatch = true;
            similarity = 0.8;
          }
        }
        
        // Check for gender-specific matches (already filtered, so this adds confidence)
        if (isWomenQuery && genderPreference === 'women') {
          isMatch = true;
          similarity = Math.max(similarity, 0.75);
        }
        
        if (isMenQuery && genderPreference === 'men') {
          isMatch = true;
          similarity = Math.max(similarity, 0.75);
        }
        
        if (isMatch) {
          matches.push({
            product,
            similarity,
            method: 'category'
          });
        }
      });
    }
    
    // Match known categories and subcategories from database
    const matchingCategories = Array.from(knownCategories).filter(cat => 
      queryLower.includes(cat.toLowerCase()) || responseLower.includes(cat.toLowerCase())
    );
    
    const matchingSubCategories = Array.from(knownSubCategories).filter(subcat => 
      queryLower.includes(subcat.toLowerCase()) || responseLower.includes(subcat.toLowerCase())
    );
    
    if (matchingCategories.length > 0 || matchingSubCategories.length > 0) {
      filteredProducts.forEach(product => {
        const productCat = (product.category || "").toLowerCase();
        const productSubCat = (product.subCategory || "").toLowerCase();
        
        const matchesCatOrSubCat = 
          matchingCategories.some(cat => productCat.includes(cat.toLowerCase())) ||
          matchingSubCategories.some(subcat => productSubCat.includes(subcat.toLowerCase()));
          
        if (matchesCatOrSubCat) {
          // Check if already added to avoid duplicates
          const alreadyAdded = matches.some(match => match.product.id === product.id);
          if (!alreadyAdded) {
            matches.push({
              product,
              similarity: 0.7,
              method: 'category-term'
            });
          }
        }
      });
    }
    
    return matches;
  }
};

// Strategy 4: New Products - Recommend newest products
const newProductsStrategy: RecommendationStrategy = {
  name: 'newProducts',
  priority: 5, // Changed from 4 to 5
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes("new")) {
      // Apply gender filtering
      const genderPreference = detectGenderPreference(query, response);
      const filteredProducts = filterProductsByGender(products, genderPreference);
      
      console.log(`New products strategy: Gender preference ${genderPreference}, filtered from ${products.length} to ${filteredProducts.length} products`);
      
      const newestProducts = [...filteredProducts].sort((a, b) => {
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
  priority: 6, // Changed from 5 to 6
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const colorRegex = /\b(red|blue|green|black|white|yellow|purple|pink|orange|brown|grey|gray)\b/gi;
    const mentionedColors: string[] = [];
    let matches: RegExpExecArray | null;
    const results: ProductMatch[] = [];
    
    // Apply gender filtering
    const genderPreference = detectGenderPreference(query, response);
    const filteredProducts = filterProductsByGender(products, genderPreference);
    
    console.log(`Color match strategy: Gender preference ${genderPreference}, filtered from ${products.length} to ${filteredProducts.length} products`);
    
    while ((matches = colorRegex.exec(query + ' ' + response)) !== null) {
      mentionedColors.push(matches[1].toLowerCase());
    }
    
    if (mentionedColors.length > 0) {
      filteredProducts.forEach(product => { // Use filtered products instead of all products
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

// Helper function to detect gender preference from query
const detectGenderPreference = (query: string, response: string): 'men' | 'women' | 'neutral' => {
  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();
  const combined = `${queryLower} ${responseLower}`;
  
  // Check for explicit gender mentions
  const womenKeywords = ['women', 'ladies', 'woman', 'lady', 'for women', 'women\'s', 'ladies\''];
  const menKeywords = ['men', 'man', 'guys', 'male', 'for men', 'men\'s', 'guys\''];
  
  const hasWomenKeywords = womenKeywords.some(keyword => combined.includes(keyword));
  const hasMenKeywords = menKeywords.some(keyword => combined.includes(keyword));
  
  if (hasWomenKeywords && !hasMenKeywords) return 'women';
  if (hasMenKeywords && !hasWomenKeywords) return 'men';
  return 'neutral';
};

// Helper function to filter products by gender preference
const filterProductsByGender = (products: ProductContextItem[], genderPreference: 'men' | 'women' | 'neutral'): ProductContextItem[] => {
  if (genderPreference === 'neutral') return products;
  
  return products.filter(product => {
    const category = product.category.toLowerCase();
    const subCategory = product.subCategory.toLowerCase();
    const keywords = product.keywords.toLowerCase();
    const name = product.name.toLowerCase();
    
    // Define clear gender indicators
    const womenIndicators = ['women', 'ladies', 'woman', 'lady'];
    const menIndicators = ['men', 'man', 'mens', 'male', 'guys', 'boy', 'boys'];
    
    // Define category-specific items
    const womenCategories = ['dress', 'dresses', 'skirt', 'skirts', 'crop', 'legging', 'bra', 'blouse'];
    const menCategories = ['suit', 'tie', 'boxers', 'briefs'];
    
    const hasWomenIndicator = womenIndicators.some(indicator => 
      category.includes(indicator) || subCategory.includes(indicator) || 
      keywords.includes(indicator) || name.includes(indicator)
    );
    
    const hasMenIndicator = menIndicators.some(indicator => 
      category.includes(indicator) || subCategory.includes(indicator) || 
      keywords.includes(indicator) || name.includes(indicator)
    );
    
    const hasWomenCategory = womenCategories.some(cat => 
      category.includes(cat) || subCategory.includes(cat) || 
      keywords.includes(cat) || name.includes(cat)
    );
    
    const hasMenCategory = menCategories.some(cat => 
      category.includes(cat) || subCategory.includes(cat) || 
      keywords.includes(cat) || name.includes(cat)
    );
    
    if (genderPreference === 'women') {
      // For women: include if has women indicators OR women categories
      // Exclude if has men indicators (unless it also has women indicators)
      return (hasWomenIndicator || hasWomenCategory) && !hasMenIndicator;
    } else {
      // For men: include if has men indicators OR men categories  
      // Also include gender-neutral items (no clear gender indicators)
      // Exclude if has women indicators or women categories
      if (hasWomenIndicator || hasWomenCategory) {
        return false; // Definitely exclude women's items
      }
      return hasMenIndicator || hasMenCategory || (!hasWomenIndicator && !hasWomenCategory);
    }
  });
};

// Strategy 7: Response Category Extraction - Find products mentioned in AI response
const responseCategoryStrategy: RecommendationStrategy = {
  name: 'responseCategory',
  priority: 1, // High priority since AI specifically mentioned these
  execute: (query: string, response: string, products: ProductContextItem[]): ProductMatch[] => {
    const results: ProductMatch[] = [];
    const responseLower = response.toLowerCase();
    
    // Detect gender preference first
    const genderPreference = detectGenderPreference(query, response);
    console.log(`Detected gender preference: ${genderPreference}`);
    
    // Filter products by gender preference
    const filteredProducts = filterProductsByGender(products, genderPreference);
    console.log(`Filtered products from ${products.length} to ${filteredProducts.length} based on gender preference`);
    
    // Extract categories mentioned in the response
    const mentionedCategories = [
      'dresses', 'dress', 'skirts', 'skirt', 'crop tops', 'crop top', 
      'leggings', 'tanks', 'tank tops', 'tank top', 'shorts', 'short',
      'hoodies', 'hoodie', 'jackets', 'jacket', 'jeans', 'pants', 
      'shirts', 'shirt', 't-shirts', 't-shirt', 'accessories',
      'gym', 'workout', 'sports', 'joggers', 'jogger'
    ];
    
    const foundCategories: string[] = [];
    
    for (const category of mentionedCategories) {
      if (responseLower.includes(category) || query.toLowerCase().includes(category)) {
        foundCategories.push(category);
      }
    }
    
    console.log(`Response mentioned categories: ${foundCategories.join(', ')}`);
    
    if (foundCategories.length > 0) {
      filteredProducts.forEach(product => {
        const productCat = (product.category || "").toLowerCase();
        const productSubCat = (product.subCategory || "").toLowerCase();
        const productKeywords = product.keywords.toLowerCase();
        const productName = product.name.toLowerCase();
        
        for (const mentionedCat of foundCategories) {
          let isMatch = false;
          
          // Check various ways this category might match
          if (mentionedCat.includes('dress')) {
            isMatch = productCat.includes('dress') || productSubCat.includes('dress') || 
                     productKeywords.includes('dress') || productName.includes('dress');
          } else if (mentionedCat.includes('skirt')) {
            isMatch = productCat.includes('skirt') || productSubCat.includes('skirt') || 
                     productKeywords.includes('skirt') || productName.includes('skirt');
          } else if (mentionedCat.includes('crop')) {
            isMatch = productCat.includes('crop') || productSubCat.includes('crop') || 
                     productKeywords.includes('crop') || productName.includes('crop');
          } else if (mentionedCat.includes('legging')) {
            isMatch = productCat.includes('legging') || productSubCat.includes('legging') || 
                     productKeywords.includes('legging') || productName.includes('legging');
          } else if (mentionedCat.includes('tank')) {
            isMatch = productCat.includes('tank') || productSubCat.includes('tank') || 
                     productKeywords.includes('tank') || productName.includes('tank');
          } else if (mentionedCat.includes('short')) {
            isMatch = productCat.includes('short') || productSubCat.includes('short') || 
                     productKeywords.includes('short') || productName.includes('short');
          } else if (mentionedCat.includes('gym') || mentionedCat.includes('workout') || mentionedCat.includes('sports')) {
            isMatch = productKeywords.includes('gym') || productKeywords.includes('workout') || 
                     productKeywords.includes('sport') || productName.includes('gym') ||
                     productName.includes('sport') || productSubCat.includes('sport');
          } else if (mentionedCat.includes('jogger')) {
            isMatch = productCat.includes('jogger') || productSubCat.includes('jogger') || 
                     productKeywords.includes('jogger') || productName.includes('jogger');
          } else {
            // Generic matching for other categories
            isMatch = productCat.includes(mentionedCat) || productSubCat.includes(mentionedCat) || 
                     productKeywords.includes(mentionedCat) || productName.includes(mentionedCat);
          }
          
          if (isMatch) {
            // Check if already added to avoid duplicates
            const alreadyAdded = results.some(r => r.product.id === product.id);
            if (!alreadyAdded) {
              results.push({
                product,
                similarity: 0.9, // High similarity since AI mentioned this category
                method: 'response-category'
              });
            }
            break; // Only add once per product
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
  priority: 7, // Updated priority (remains 7)
  execute: (query: string, response: string, products: ProductContextItem[], userPreferences?: any): ProductMatch[] => {
    const results: ProductMatch[] = [];
    
    if (!userPreferences) {
      return results;
    }
    
    // Apply gender filtering
    const genderPreference = detectGenderPreference(query, response);
    const filteredProducts = filterProductsByGender(products, genderPreference);
    
    console.log(`User preference strategy: Gender preference ${genderPreference}, filtered from ${products.length} to ${filteredProducts.length} products`);
    
    for (const product of filteredProducts) {
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

// Function to detect if user is specifically requesting product recommendations
const isExplicitProductRequest = (query: string): boolean => {
  const explicitRequestTerms = [
    'recommend', 'recommendation', 'suggest', 'suggestion', 'show me', 'help me find',
    'looking for', 'need', 'want to buy', 'shopping for', 'browse',
    'what should i wear', 'what to wear', 'outfit for', 'clothes for',
    'do you have', 'do you sell', 'do you offer', 'available',
    'in stock', 'find me', 'help me choose', 'pick out', 'options',
    'would you like me to show', 'some options', 'wide variety'
  ];
  
  // Gender and category specific terms that indicate product interest
  const productCategoryTerms = [
    'women', 'ladies', 'men', 'guys', 'items for women', 'items for men',
    'dress', 'dresses', 'skirt', 'skirts', 'crop top', 'crop tops',
    'leggings', 'tanks', 'tank tops', 'shorts', 'hoodie', 'hoodies',
    'jacket', 'jackets', 'jeans', 'pants', 'shirt', 'shirts', 'accessories'
  ];
  
  const queryLower = query.toLowerCase();
  
  return explicitRequestTerms.some(term => queryLower.includes(term)) ||
         productCategoryTerms.some(term => queryLower.includes(term));
};

// Refactored findRecommendedProducts function using strategy pattern
const findRecommendedProducts = (responseText: string, productContext: ProductContextItem[], userQuery: string, userPreferences?: any): { products: ProductContextItem[], relevanceScore: number } => {
  console.log(`Finding product recommendations for: "${userQuery.substring(0, 50)}..."`);
  
  // First check: Is this a FAQ/general info query?
  if (isGeneralInfoOrFAQ(userQuery, responseText)) {
    console.log("Detected general information or FAQ query - skipping product recommendations");
    return { products: [], relevanceScore: 0 };
  }
  
  // Second check: Is user explicitly asking for product recommendations?
  const isExplicitRequest = isExplicitProductRequest(userQuery);
  if (!isExplicitRequest) {
    console.log("User not explicitly requesting products - skipping recommendations");
    return { products: [], relevanceScore: 0 };
  }
  
  // Define all recommendation strategies with their priorities
  const strategies: RecommendationStrategy[] = [
    responseCategoryStrategy,     // NEW: High priority for AI-mentioned categories
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
    debug[strategy.name] = { 
      found: matches.length,
      products: matches.map(m => ({ name: m.product.name, similarity: m.similarity, method: m.method }))
    };
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
  
  // Calculate overall relevance score (average of matches, or 0 if none)
  const overallRelevanceScore = matchesFound > 0 ? totalRelevanceScore / matchesFound : 0;
  
  // FINAL SAFETY CHECK: Apply gender filtering one more time to ensure no leaks
  const detectedGender = detectGenderPreference(userQuery, responseText);
  const finalFilteredProducts = filterProductsByGender(recommendedProducts, detectedGender);
  
  if (finalFilteredProducts.length !== recommendedProducts.length) {
    console.log(`🚨 SAFETY FILTER ACTIVATED: Removed ${recommendedProducts.length - finalFilteredProducts.length} mismatched products`);
    console.log(`Detected gender preference: ${detectedGender}`);
    console.log(`Original products: ${recommendedProducts.map(p => `${p.name} (${p.category})`).join(', ')}`);
    console.log(`After safety filter: ${finalFilteredProducts.map(p => `${p.name} (${p.category})`).join(', ')}`);
  }
  
  console.log("Recommendation debug info:", JSON.stringify(debug, null, 2));
  console.log(`Found ${finalFilteredProducts.length} recommended products with relevance score: ${overallRelevanceScore.toFixed(2)}`);
  console.log(`Query: "${userQuery}"`);
  console.log(`Response excerpt: "${responseText.substring(0, 100)}..."`);
  
  if (finalFilteredProducts.length > 0) {
    console.log("Final recommended products:", finalFilteredProducts.map(p => `${p.name} (${p.category}/${p.subCategory})`).join(", "));
  } else {
    console.log("No products found. Sample product categories:", productContext.slice(0, 5).map(p => `${p.name} (${p.category}/${p.subCategory})`));
  }
  
  return { 
    products: finalFilteredProducts.slice(0, 3),
    relevanceScore: overallRelevanceScore
  };
};

// Reduce threshold to be more inclusive for debugging
const RELEVANCE_THRESHOLD = 0.3; // Reduced from 0.6 to see more matches

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
    return responseText;
  }
  
  // Check if this is explicitly a FAQ/policy question
  if (isGeneralInfoOrFAQ(userQuery, responseText)) {
    console.log("FAQ/Policy question detected - no product recommendations");
    return responseText;
  }
  
  const { products: recommendedProducts, relevanceScore } = findRecommendedProducts(
    responseText, 
    productContext, 
    userQuery, 
    userPreferences
  );
  
  // Determine if the query appears to be asking for specific products
  const isProductQuery = isSpecificProductQuery(userQuery) || isExplicitProductRequest(userQuery);
  
  // Handle case where we have no relevant product recommendations but the user was explicitly asking for products
  if (recommendedProducts.length === 0 && isProductQuery && !isGeneralInfoOrFAQ(userQuery, responseText)) {
    return `${responseText}\n\nI'm sorry, but we don't currently have products that match your specific request in our inventory. We regularly update our collections, so please check back later or browse our available items on the website.`;
  } 
  // Include recommendations only when they're highly relevant and explicitly requested
  else if (recommendedProducts.length > 0 && relevanceScore >= RELEVANCE_THRESHOLD && isProductQuery) {
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
    'outfit', 'wear', 'clothing', 'clothes', 'apparel', 'wardrobe', 'attire'
  ];
  
  const outfitPhrases = [
    'what should i wear', 'what to wear', 'outfit for', 'dress for',
    'clothes for', 'look for', 'attire for'
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

export async function POST(request: NextRequest) {
  try {
    // Check rate limits first
    if (!checkRateLimit()) {
      return NextResponse.json({ 
        success: false, 
        error: "Rate limit exceeded. Please wait a moment before trying again.",
        fallbackResponse: "I'm receiving too many requests right now. Please wait a moment and try again."
      }, { status: 429 });
    }

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
      - ONLY recommend products when specifically asked or when the user is clearly shopping for items
      - Do NOT include product recommendations for policy questions, FAQ, or general inquiries
      
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
              maxOutputTokens: 250, // Reduced from 300 to save tokens
              topP: 0.8,
            },
          }),
          timeoutPromise(12000) // Reduced timeout to avoid rate limit issues
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
