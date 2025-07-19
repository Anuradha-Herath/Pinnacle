/**
 * Gender Filtering Fix Verification Test
 * Tests the exact scenario reported by the user
 */

console.log('🔍 TESTING DRESS QUERY GENDER FILTERING FIX\n');

// Test query exactly as user reported
const userQuery = 'do you have dresses';
const aiResponse = 'Yes, we do! We have the Delia Dress ($8.40) in the Women\'s category.';

// Simulate products from user's example
const mockProducts = [
  {
    id: '1',
    name: 'Delia Dress',
    category: 'Women',
    subCategory: 'Dresses',
    keywords: 'women dress elegant formal',
    price: '8.40'
  },
  {
    id: '2',
    name: 'Delia Dress',
    category: 'Women',
    subCategory: 'Dresses', 
    keywords: 'women dress casual',
    price: '20.00'
  },
  {
    id: '3',
    name: 'Sanit Joggers',
    category: 'Men',
    subCategory: 'Joggers',
    keywords: 'men joggers sports casual',
    price: '20.00'
  }
];

// Copy the exact functions from route.tsx
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

const filterProductsByGender = (products, genderPreference) => {
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

console.log('🧪 Step 1: Test Gender Detection');
console.log(`Query: "${userQuery}"`);
console.log(`Response: "${aiResponse}"`);

const detectedGender = detectGenderPreference(userQuery, aiResponse);
console.log(`Detected Gender: ${detectedGender}`);
console.log(`Expected: women (because query asks for "dresses")`);
console.log(`✅ Gender Detection: ${detectedGender === 'women' ? 'PASS' : 'FAIL'}\n`);

console.log('🧪 Step 2: Test Product Filtering');
console.log('Original products:');
mockProducts.forEach(p => console.log(`  - ${p.name} (${p.category})`));

const filteredProducts = filterProductsByGender(mockProducts, detectedGender);
console.log(`\nAfter ${detectedGender} gender filter:`);
filteredProducts.forEach(p => console.log(`  - ${p.name} (${p.category})`));

console.log('\n🎯 Step 3: Verify Fix');
const sanitJoggers = filteredProducts.find(p => p.name === 'Sanit Joggers');
if (sanitJoggers) {
  console.log('❌ FAILED: Sanit Joggers still appears in women\'s dress recommendations!');
  console.log('❌ The gender filtering is not working correctly.');
} else {
  console.log('✅ SUCCESS: Sanit Joggers correctly filtered out!');
  console.log('✅ Gender filtering is working correctly.');
}

const deliaCount = filteredProducts.filter(p => p.name === 'Delia Dress').length;
console.log(`\n📊 Results Summary:`);
console.log(`  - Total products after filter: ${filteredProducts.length}`);
console.log(`  - Delia Dress count: ${deliaCount}`);
console.log(`  - Sanit Joggers present: ${sanitJoggers ? 'YES (❌ BAD)' : 'NO (✅ GOOD)'}`);

console.log('\n🔧 What should happen in the chatbot:');
console.log('1. User asks: "do you have dresses"');
console.log('2. AI detects gender preference: "women"'); 
console.log('3. All recommendation strategies apply women filter');
console.log('4. Only women\'s products (Delia Dress) are recommended');
console.log('5. Men\'s products (Sanit Joggers) are filtered out');
console.log('6. Safety filter catches any remaining mismatches');

if (detectedGender === 'women' && !sanitJoggers && deliaCount > 0) {
  console.log('\n🎉 OVERALL RESULT: GENDER FILTERING FIX IS WORKING! 🎉');
} else {
  console.log('\n⚠️  OVERALL RESULT: GENDER FILTERING NEEDS MORE WORK ⚠️');
}
