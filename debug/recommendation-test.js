// Test script to debug product recommendations
// Run this to test the new recommendation logic

const testQuery = "We have a wide variety of items for women!";
const testResponse = "We have a wide variety of items for women! This includes: Dresses, Skirts, Crop Tops, Leggings, Tanks, and Shorts. Would you like me to show you some options?";

// Mock product data structure for testing
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
    name: "Black Skirt",
    category: "Women",
    subCategory: "Skirts",
    keywords: "black skirt women mini midi",
    price: "20.00"
  },
  {
    id: "3",
    name: "Crop Top White",
    category: "Women", 
    subCategory: "Tops",
    keywords: "crop top white women casual",
    price: "15.00"
  },
  {
    id: "4",
    name: "Sports Leggings",
    category: "Women",
    subCategory: "Bottoms", 
    keywords: "leggings sports women workout",
    price: "30.00"
  },
  {
    id: "5",
    name: "Tank Top Blue",
    category: "Women",
    subCategory: "Tops",
    keywords: "tank top blue women summer",
    price: "12.00"
  },
  {
    id: "6",
    name: "Denim Shorts",
    category: "Women",
    subCategory: "Bottoms",
    keywords: "denim shorts women casual summer",
    price: "22.00"
  },
  {
    id: "7",
    name: "Men's Hoodie", 
    category: "Men",
    subCategory: "Hoodies",
    keywords: "hoodie men casual warm",
    price: "45.00"
  },
  {
    id: "8",
    name: "Bag",
    category: "Accessories", 
    subCategory: "Bags",
    keywords: "bag handbag purse",
    price: "1000.00"
  }
];

// Test the response category strategy
const testResponseCategoryStrategy = (query, response, products) => {
  const results = [];
  const responseLower = response.toLowerCase();
  
  const mentionedCategories = [
    'dresses', 'dress', 'skirts', 'skirt', 'crop tops', 'crop top', 
    'leggings', 'tanks', 'tank tops', 'tank top', 'shorts', 'short'
  ];
  
  const foundCategories = [];
  
  for (const category of mentionedCategories) {
    if (responseLower.includes(category)) {
      foundCategories.push(category);
    }
  }
  
  console.log(`Response mentioned categories: ${foundCategories.join(', ')}`);
  
  if (foundCategories.length > 0) {
    products.forEach(product => {
      const productCat = product.category.toLowerCase();
      const productSubCat = product.subCategory.toLowerCase(); 
      const productKeywords = product.keywords.toLowerCase();
      const productName = product.name.toLowerCase();
      
      for (const mentionedCat of foundCategories) {
        let isMatch = false;
        
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
        }
        
        if (isMatch) {
          const alreadyAdded = results.some(r => r.product.id === product.id);
          if (!alreadyAdded) {
            results.push({
              product,
              similarity: 0.9,
              method: 'response-category',
              matchedCategory: mentionedCat
            });
          }
          break;
        }
      }
    });
  }
  
  return results;
};

console.log("Testing Product Recommendation Logic");
console.log("=" * 50);
console.log(`Query: "${testQuery}"`);
console.log(`Response: "${testResponse}"`);
console.log("");

const matches = testResponseCategoryStrategy(testQuery, testResponse, mockProducts);

console.log(`Found ${matches.length} matching products:`);
matches.forEach((match, index) => {
  console.log(`${index + 1}. ${match.product.name} ($${match.product.price})`);
  console.log(`   Category: ${match.product.category}/${match.product.subCategory}`);
  console.log(`   Matched: ${match.matchedCategory}`);
  console.log(`   Similarity: ${match.similarity}`);
  console.log("");
});

if (matches.length === 0) {
  console.log("❌ No matches found! This indicates the strategy needs improvement.");
  console.log("\nAvailable products:");
  mockProducts.forEach(p => {
    console.log(`- ${p.name} (${p.category}/${p.subCategory})`);
  });
} else {
  console.log("✅ Strategy working correctly!");
}

// Test what the old system might have selected
console.log("\n" + "=" * 50);
console.log("Debugging why wrong products were selected:");
console.log("The system was probably falling back to random products when no matches were found.");
console.log("With the new response category strategy, it should now find relevant women's items.");

export {};
