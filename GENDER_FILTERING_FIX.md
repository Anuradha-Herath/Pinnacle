# Gender-Based Product Filtering Fix

## Issue Identified ❌
When asking for "gym outfit for women", the chatbot was showing mixed gender products:
- ✅ Inevitable Tank Women (Women)
- ❌ T-shirt (Men) 
- ❌ Parker Cargo Pant (Men)
- ✅ MVT Shorts (Women)

## Root Cause
The recommendation strategies weren't filtering products by gender when users explicitly mentioned "women", "men", or gender-specific categories.

## Solution Implemented ✅

### 1. Gender Detection Function
**`detectGenderPreference(query, response)`**
- Analyzes both user query and AI response for gender keywords
- Returns: `'women'`, `'men'`, or `'neutral'`
- Keywords detected:
  - **Women**: women, ladies, woman, lady, for women, women's, ladies'
  - **Men**: men, man, guys, male, for men, men's, guys'

### 2. Gender Filtering Function  
**`filterProductsByGender(products, genderPreference)`**
- Filters product list based on detected gender preference
- **For Women**: Includes products with women in category/keywords OR typical women's items (dress, skirt, crop, legging)
- **For Men**: Includes products with men in category/keywords AND excludes obvious women's items
- **Neutral**: Returns all products unchanged

### 3. Updated Recommendation Strategies

All major strategies now use gender filtering:

#### ✅ Response Category Strategy (Priority 1)
```typescript
const genderPreference = detectGenderPreference(query, response);
const filteredProducts = filterProductsByGender(products, genderPreference);
// Then find products from filtered list only
```

#### ✅ Direct Name Match Strategy (Priority 2)
- Now searches only gender-appropriate products

#### ✅ Category Match Strategy (Priority 3) 
- Enhanced with gender detection and filtering
- Added gym/workout/sports category matching

#### ✅ User Preference Strategy (Priority 7)
- Respects gender preference even when using user history

### 4. Enhanced Debugging
Added console logs to track:
- Detected gender preference
- Number of products before/after filtering
- Which strategy found which products

## Expected Results

### Before Fix:
```
Query: "gym outfit for women"
Results: ❌ Mixed Men's and Women's products
```

### After Fix:
```
Query: "gym outfit for women" 
Gender Detected: "women"
Filtered Products: Only women's items
Results: ✅ Only women's gym/workout products
```

## Test Cases

### Women-Specific Queries:
- "gym outfit for women" → Only women's products
- "women's dresses" → Only women's products  
- "i want leggings" → Only women's products (leggings are women-specific)

### Men-Specific Queries:
- "men's workout clothes" → Only men's products
- "guys need shirts" → Only men's products

### Neutral Queries:
- "casual weekend outfit" → All products (no gender specified)
- "do you have accessories" → All accessories

## Implementation Details

### Product Filtering Logic:
**Women's Products Include:**
- Category/subcategory/keywords/name contains: women, ladies
- OR contains women-specific items: dress, skirt, crop, legging

**Men's Products Include:**  
- Category/subcategory/keywords/name contains: men, male, guys
- AND does NOT contain women-specific items

**Neutral/Accessories:**
- All products shown when no gender preference detected
- Accessories shown for all unless specifically gendered

### Logging Added:
```
Gender preference strategy: Gender preference women, filtered from 50 to 23 products
Response mentioned categories: gym, workout, shorts
```

## Files Modified:
1. `app/api/chatbot/route.tsx` - Main recommendation logic
2. `debug/gender-filtering-test.js` - Testing utilities

## Testing:
```bash
node debug/gender-filtering-test.js
```

## Result:
Now when you ask "gym outfit for women", you should ONLY see women's gym/workout products in the recommendations, not mixed gender items! 🎉

The system now properly respects gender preferences while maintaining the ability to show all products for neutral queries.
