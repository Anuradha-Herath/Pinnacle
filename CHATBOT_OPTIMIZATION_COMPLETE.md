# Chatbot Optimization Implementation

## Issues Fixed

### 1. FAQ Questions Getting Product Recommendations ❌➡️✅

**Problem**: Users asking questions like "What is your return policy?" were getting unwanted product recommendations.

**Solution**:
- Enhanced `isGeneralInfoOrFAQ()` function with stronger FAQ detection
- Added explicit product request detection with `isExplicitProductRequest()`
- Product recommendations now only show when users explicitly request them

**Test**: Try asking "What is your return policy?" - should get policy info without product cards.

### 2. Rate Limit Optimization 🚀

**Problem**: High risk of hitting Gemini API rate limits due to inefficient model usage.

**Solution**:
- Reordered model priority to use higher RPM models first:
  1. `gemini-2.0-flash-lite` (30 RPM) 
  2. `gemini-2.0-flash` (15 RPM)
  3. `gemini-2.5-flash-lite-preview-06-17` (15 RPM)
  4. `gemini-2.5-flash` (10 RPM)
  5. `gemini-2.5-pro` (5 RPM)
- Added rate limiting with 25 requests/minute cap
- Increased cache TTL from 2 minutes to 5 minutes
- Reduced timeout from 15s to 12s
- Reduced max tokens from 300 to 250

### 3. Improved Recommendation Accuracy 🎯

**Problem**: Irrelevant product recommendations being shown too frequently.

**Solution**:
- Increased relevance threshold from 0.4 to 0.6
- Added explicit product request requirement
- Enhanced FAQ filtering to prevent false positives
- Better rate limit handling with 429 status responses

## Performance Monitoring

### Key Metrics to Track:
1. **Rate Limit Usage**: Monitor requests per minute per model
2. **Cache Hit Rate**: Should be >70% with 5-minute TTL
3. **Recommendation Accuracy**: Track when recommendations are shown vs requested
4. **Response Time**: Should average <3 seconds

### Testing Commands:

```bash
# Test FAQ detection
node debug/chatbot-test.js

# Monitor rate limits in production
tail -f logs/chatbot.log | grep "Rate limit"

# Check cache performance
tail -f logs/chatbot.log | grep "cache"
```

## Configuration

### Environment Variables:
- `GEMINI_API_KEY`: Your Gemini API key
- `MONGODB_URI`: Database connection string

### Rate Limits (per model):
```
Gemini 2.0 Flash-Lite: 30 RPM, 1M TPM, 200 RPD
Gemini 2.0 Flash: 15 RPM, 1M TPM, 200 RPD  
Gemini 2.5 Flash-Lite Preview: 15 RPM, 250K TPM, 1000 RPD
Gemini 2.5 Flash: 10 RPM, 250K TPM, 250 RPD
Gemini 2.5 Pro: 5 RPM, 250K TPM, 100 RPD
```

## Usage Examples

### ✅ FAQ Questions (No Product Recommendations):
- "What is your return policy?"
- "How long does shipping take?"
- "What are your business hours?"
- "How do I track my order?"

### ✅ Product Requests (With Recommendations):
- "Do you have any hoodies?"
- "Can you recommend a dress for a wedding?"
- "Show me some jeans"
- "I'm looking for a winter jacket"
- "What should I wear to work?"

## Next Steps

1. **Monitor Performance**: Watch rate limit usage for the first week
2. **A/B Testing**: Compare recommendation accuracy before/after changes
3. **User Feedback**: Collect feedback on recommendation relevance
4. **Cache Optimization**: Consider extending cache TTL if hit rate is high

## Troubleshooting

### Common Issues:

**Rate Limit Errors (429)**:
- Check if exceeding 25 requests/minute
- Verify model fallback is working
- Consider implementing user-based rate limiting

**No Product Recommendations**:
- Verify user is using explicit request terms
- Check if query is being classified as FAQ
- Review relevance threshold (currently 0.6)

**Slow Responses**:
- Check database connection
- Monitor cache hit rate
- Review product data size

## Files Modified:

1. `app/api/chatbot/route.tsx` - Main chatbot logic
2. `app/components/Chatbot.tsx` - Frontend rate limit handling
3. `debug/chatbot-test.js` - Testing utilities
