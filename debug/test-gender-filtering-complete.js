/**
 * Complete Gender Filtering Test
 * This script tests the gender filtering system to ensure men's products
 * don't appear in women's queries and vice versa.
 */

// Simulate the gender detection function
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

// Simulate the gender filtering function
const filterProductsByGender = (products, genderPreference) => {
  if (genderPreference === 'neutral') return products;
  
  return products.filter(product => {
    const category = product.category.toLowerCase();
    const subCategory = product.subCategory.toLowerCase();
    const keywords = product.keywords.toLowerCase();
    const name = product.name.toLowerCase();
    
    if (genderPreference === 'women') {
      // Women's products
      return category.includes('women') || 
             subCategory.includes('women') || 
             keywords.includes('women') ||
             name.includes('women') ||
             // Also include categories that are typically for women
             ['dress', 'dresses', 'skirt', 'skirts', 'crop', 'legging'].some(womenItem => 
               category.includes(womenItem) || subCategory.includes(womenItem) || 
               keywords.includes(womenItem) || name.includes(womenItem)
             );
    } else {
      // Men's products
      return category.includes('men') || 
             subCategory.includes('men') || 
             keywords.includes('men') ||
             name.includes('men') ||
             // Exclude obviously women's items
             !(['dress', 'dresses', 'skirt', 'skirts', 'crop', 'legging', 'women', 'ladies'].some(womenItem => 
               category.includes(womenItem) || subCategory.includes(womenItem) || 
               keywords.includes(womenItem) || name.includes(womenItem)
             ));
    }
  });
};

// Test data with mixed products
const testProducts = [
  {
    id: '1',
    name: 'Delia Dress',
    category: 'Women',
    subCategory: 'Dresses',
    keywords: 'women dress formal elegant',
    price: '8.40'
  },
  {
    id: '2',
    name: 'Sanit Joggers',
    category: 'Men',
    subCategory: 'Joggers',
    keywords: 'men joggers casual sports',
    price: '20.00'
  },
  {
    id: '3',
    name: 'Women\'s Crop Top',
    category: 'Women',
    subCategory: 'Tops',
    keywords: 'women crop top casual summer',
    price: '15.00'
  },
  {
    id: '4',
    name: 'Men\'s Hoodie',
    category: 'Men',
    subCategory: 'Hoodies',
    keywords: 'men hoodie casual winter',
    price: '45.00'
  },
  {
    id: '5',
    name: 'Floral Skirt',
    category: 'Fashion',
    subCategory: 'Skirts',
    keywords: 'skirt floral women feminine',
    price: '25.00'
  }
];

// Test cases
const testCases = [
  {
    query: 'do you have dresses',
    response: 'Yes, we do! We have the Delia Dress ($8.40) in the Women\'s category.',
    expectedGender: 'women',
    description: 'Direct dress query should detect women preference'
  },
  {
    query: 'I need gym outfit for women',
    response: 'I can help you find women\'s gym clothing.',
    expectedGender: 'women',
    description: 'Explicit women preference should be detected'
  },
  {
    query: 'men\'s joggers available?',
    response: 'Yes, we have joggers for men.',
    expectedGender: 'men',
    description: 'Men\'s specific query should detect men preference'
  },
  {
    query: 'what hoodies do you have',
    response: 'We have various hoodies in our collection.',
    expectedGender: 'neutral',
    description: 'Generic hoodie query should be neutral'
  }
];

console.log('🧪 Testing Gender Filtering System\n');

// Test gender detection
console.log('=== GENDER DETECTION TESTS ===');
testCases.forEach((testCase, index) => {
  const detectedGender = detectGenderPreference(testCase.query, testCase.response);
  const passed = detectedGender === testCase.expectedGender;
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Query: "${testCase.query}"`);
  console.log(`  Expected: ${testCase.expectedGender}, Got: ${detectedGender}`);
  console.log(`  Description: ${testCase.description}\n`);
});

// Test product filtering
console.log('=== PRODUCT FILTERING TESTS ===');

// Test women's filter
console.log('🔍 Testing Women\'s Filter:');
const womenFiltered = filterProductsByGender(testProducts, 'women');
console.log(`Original products: ${testProducts.length}`);
console.log(`After women filter: ${womenFiltered.length}`);
console.log('Filtered products:');
womenFiltered.forEach(product => {
  console.log(`  - ${product.name} (${product.category}/${product.subCategory})`);
});

// Check if any men's products leaked through
const menProductsInWomenFilter = womenFiltered.filter(p => 
  p.category.toLowerCase().includes('men') || 
  p.subCategory.toLowerCase().includes('men') ||
  p.keywords.toLowerCase().includes('men') ||
  p.name.toLowerCase() === 'sanit joggers'
);
console.log(`❌ Men's products leaked: ${menProductsInWomenFilter.length === 0 ? 'None' : menProductsInWomenFilter.map(p => p.name).join(', ')}\n`);

// Test men's filter
console.log('🔍 Testing Men\'s Filter:');
const menFiltered = filterProductsByGender(testProducts, 'men');
console.log(`Original products: ${testProducts.length}`);
console.log(`After men filter: ${menFiltered.length}`);
console.log('Filtered products:');
menFiltered.forEach(product => {
  console.log(`  - ${product.name} (${product.category}/${product.subCategory})`);
});

// Check if any women's products leaked through
const womenProductsInMenFilter = menFiltered.filter(p => 
  p.category.toLowerCase().includes('women') || 
  p.subCategory.toLowerCase().includes('women') ||
  p.keywords.toLowerCase().includes('women') ||
  ['dress', 'skirt', 'crop'].some(item => p.name.toLowerCase().includes(item))
);
console.log(`❌ Women's products leaked: ${womenProductsInMenFilter.length === 0 ? 'None' : womenProductsInMenFilter.map(p => p.name).join(', ')}\n`);

// Test neutral filter
console.log('🔍 Testing Neutral Filter:');
const neutralFiltered = filterProductsByGender(testProducts, 'neutral');
console.log(`Original products: ${testProducts.length}`);
console.log(`After neutral filter: ${neutralFiltered.length} (should be same as original)`);

// Test the specific problematic case
console.log('=== SPECIFIC PROBLEM TEST ===');
console.log('🔍 Testing "do you have dresses" scenario:');
const dressQuery = 'do you have dresses';
const dressResponse = 'Yes, we do! We have the Delia Dress ($8.40) in the Women\'s category.';
const genderPref = detectGenderPreference(dressQuery, dressResponse);
const filteredForDresses = filterProductsByGender(testProducts, genderPref);

console.log(`Query: "${dressQuery}"`);
console.log(`Response: "${dressResponse}"`);
console.log(`Detected gender: ${genderPref}`);
console.log(`Products after filtering: ${filteredForDresses.length}`);
console.log('Should NOT include Sanit Joggers:');
filteredForDresses.forEach(product => {
  const shouldNotBeHere = product.name === 'Sanit Joggers';
  console.log(`  ${shouldNotBeHere ? '❌' : '✅'} ${product.name} (${product.category})`);
});

console.log('\n🎯 SUMMARY:');
console.log('If gender filtering is working correctly:');
console.log('✅ "dresses" query should only return women\'s products');
console.log('✅ Sanit Joggers should NOT appear in women\'s dress recommendations');
console.log('✅ All strategies should apply this filtering consistently');
