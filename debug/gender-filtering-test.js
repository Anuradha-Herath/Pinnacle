// Test Gender Filtering Logic
// Run this to test the gender detection and filtering

// Mock product data for testing
const mockProducts = [
  {
    id: "1",
    name: "Summer Dress",
    category: "Women",
    subCategory: "Dresses", 
    keywords: "summer dress women formal casual",
    price: "25.00"
  },
  {
    id: "2",
    name: "MVT Shorts",
    category: "Women",
    subCategory: "Bottoms",
    keywords: "shorts women mvt sports",
    price: "15.36"
  },
  {
    id: "3",
    name: "Inevitable Tank Women",
    category: "Women",
    subCategory: "Tops",
    keywords: "tank top women inevitable workout",
    price: "10.32"
  },
  {
    id: "4",
    name: "T-shirt",
    category: "Men",
    subCategory: "Tops",
    keywords: "tshirt men casual",
    price: "25.00"
  },
  {
    id: "5",
    name: "Parker Cargo Pant",
    category: "Men", 
    subCategory: "Bottoms",
    keywords: "cargo pants men parker casual",
    price: "29.70"
  },
  {
    id: "6",
    name: "Crossbody Bag",
    category: "Accessories",
    subCategory: "Bags",
    keywords: "bag crossbody accessories",
    price: "19.00"
  }
];

// Test gender detection function
const detectGenderPreference = (query, response) => {
  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();
  const combined = `${queryLower} ${responseLower}`;
  
  const womenKeywords = ['women', 'ladies', 'woman', 'lady', 'for women', 'women\'s', 'ladies\''];
  const menKeywords = ['men', 'man', 'guys', 'male', 'for men', 'men\'s', 'guys\''];
  
  const hasWomenKeywords = womenKeywords.some(keyword => combined.includes(keyword));
  const hasMenKeywords = menKeywords.some(keyword => combined.includes(keyword));
  
  if (hasWomenKeywords && !hasMenKeywords) return 'women';
  if (hasMenKeywords && !hasWomenKeywords) return 'men';
  return 'neutral';
};

// Test gender filtering function
const filterProductsByGender = (products, genderPreference) => {
  if (genderPreference === 'neutral') return products;
  
  return products.filter(product => {
    const category = product.category.toLowerCase();
    const subCategory = product.subCategory.toLowerCase();
    const keywords = product.keywords.toLowerCase();
    const name = product.name.toLowerCase();
    
    if (genderPreference === 'women') {
      return category.includes('women') || 
             subCategory.includes('women') || 
             keywords.includes('women') ||
             name.includes('women') ||
             ['dress', 'dresses', 'skirt', 'skirts', 'crop', 'legging'].some(womenItem => 
               category.includes(womenItem) || subCategory.includes(womenItem) || 
               keywords.includes(womenItem) || name.includes(womenItem)
             );
    } else {
      return category.includes('men') || 
             subCategory.includes('men') || 
             keywords.includes('men') ||
             name.includes('men') ||
             !(['dress', 'dresses', 'skirt', 'skirts', 'crop', 'legging', 'women', 'ladies'].some(womenItem => 
               category.includes(womenItem) || subCategory.includes(womenItem) || 
               keywords.includes(womenItem) || name.includes(womenItem)
             ));
    }
  });
};

// Test cases
const testCases = [
  {
    query: "i want gym outfit for women",
    response: "I can help with that! Based on your preferences...",
    expectedGender: "women",
    description: "Women's gym outfit request"
  },
  {
    query: "Build me a casual weekend outfit",  
    response: "I can help with that! Since you like black, grey, and blue...",
    expectedGender: "neutral",
    description: "Neutral outfit request"
  },
  {
    query: "men's workout clothes",
    response: "Here are some great options for men...",
    expectedGender: "men", 
    description: "Men's workout request"
  },
  {
    query: "do you have dresses",
    response: "Yes, we have several dresses available",
    expectedGender: "women",
    description: "Dress inquiry (implicitly women's)"
  }
];

console.log("Testing Gender Detection and Filtering Logic");
console.log("=" * 60);

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.description}`);
  console.log(`Query: "${testCase.query}"`);
  console.log(`Response: "${testCase.response}"`);
  
  const detectedGender = detectGenderPreference(testCase.query, testCase.response);
  const isCorrect = detectedGender === testCase.expectedGender;
  
  console.log(`Expected Gender: ${testCase.expectedGender}`);
  console.log(`Detected Gender: ${detectedGender} ${isCorrect ? '✅' : '❌'}`);
  
  // Test filtering
  const filteredProducts = filterProductsByGender(mockProducts, detectedGender);
  console.log(`Original products: ${mockProducts.length}`);
  console.log(`Filtered products: ${filteredProducts.length}`);
  console.log("Filtered products:");
  filteredProducts.forEach(p => {
    console.log(`  - ${p.name} (${p.category})`);
  });
});

console.log("\n" + "=" * 60);
console.log("Summary:");
console.log("This logic should ensure that:");
console.log("- 'gym outfit for women' → Only shows women's products");
console.log("- 'men's workout clothes' → Only shows men's products"); 
console.log("- Neutral queries → Shows all products");
console.log("- Accessories → Shows for all genders unless specified");

export {};
