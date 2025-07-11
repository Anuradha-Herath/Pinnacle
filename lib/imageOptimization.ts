// Simple image optimization utilities - conservative approach

export const imageOptimization = {
  // Simple preload function for critical images
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve();
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't reject, just resolve to continue
      img.src = src;
    });
  },

  // Get optimized image URL with proper sizing for Next.js
  getOptimizedImageUrl: (originalUrl: string, width: number, quality: number = 75): string => {
    if (!originalUrl || originalUrl === '') return '/placeholder.png';
    
    // For Cloudinary URLs, don't modify them as they're already optimized
    if (originalUrl.includes('cloudinary.com')) {
      return originalUrl;
    }
    
    // For local images, use Next.js optimization
    if (originalUrl.startsWith('/')) {
      return originalUrl;
    }
    
    // For external URLs, use Next.js Image optimization
    try {
      const encodedUrl = encodeURIComponent(originalUrl);
      return `/_next/image?url=${encodedUrl}&w=${width}&q=${quality}`;
    } catch (error) {
      console.warn('Failed to encode image URL:', originalUrl);
      return '/placeholder.png';
    }
  },

  // Simple image validation
  isValidImageUrl: (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    
    try {
      // Check for data URLs (base64)
      if (url.startsWith('data:image/')) return true;
      
      // Check for local paths
      if (url.startsWith('/')) return true;
      
      // Check for valid URLs
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Image size presets for different use cases
export const imageSizes = {
  thumbnail: 96,
  small: 256,
  medium: 640,
  large: 1024,
  xlarge: 1920
};

// Add CSS for better image loading experience
export const imageLoadingCSS = `
  .image-loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .image-error {
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
  }
`;
