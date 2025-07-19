/**
 * Utility functions for handling images and URLs with enhanced Cloudinary support
 */

// Default placeholder image to use when images fail to load (SVG data URL to avoid 404s)
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy="0.3em" fill="%236b7280" font-family="Arial, sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';

/**
 * Validates an image URL
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.trim() === '') return false;
  
  // Check for known valid image paths
  const validBasePaths = ['/p1.webp', '/p2.webp', '/p3.webp', '/p4.webp', 
                        '/p5.webp', '/p6.webp', '/p7.webp', '/p8.webp', '/p9.webp'];
  
  if (validBasePaths.includes(url)) return true;
  
  // Allow data URLs for SVG placeholders
  if (url.startsWith('data:image/svg+xml')) return true;
  
  // Path starts with '/' and has a valid image extension
  if (url.startsWith('/') && 
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)) return true;
  
  try {
    // Check if it's a fully qualified URL
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Optimizes Cloudinary URLs for better performance and fallback handling
 * @param url The Cloudinary URL to optimize
 * @param options Optimization options
 * @returns Optimized URL or fallback
 */
export const optimizeCloudinaryUrl = (
  url: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    fallback?: boolean;
  } = {}
): string => {
  if (!url || !url.includes('cloudinary.com')) {
    return getValidImageUrl(url);
  }

  try {
    const cloudinaryUrl = new URL(url);
    
    // If fallback is requested, use Cloudinary's direct URL without Next.js optimization
    if (options.fallback) {
      // Add transformation parameters directly to Cloudinary URL
      const transformations = [];
      if (options.width) transformations.push(`w_${options.width}`);
      if (options.height) transformations.push(`h_${options.height}`);
      if (options.quality) transformations.push(`q_${options.quality}`);
      if (options.format) transformations.push(`f_${options.format}`);
      
      if (transformations.length > 0) {
        const pathParts = cloudinaryUrl.pathname.split('/');
        const uploadIndex = pathParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1) {
          pathParts.splice(uploadIndex + 1, 0, transformations.join(','));
          cloudinaryUrl.pathname = pathParts.join('/');
        }
      }
      
      return cloudinaryUrl.toString();
    }
    
    return url;
  } catch (error) {
    console.warn('Failed to optimize Cloudinary URL:', error);
    return getValidImageUrl(url);
  }
};

/**
 * Returns a valid image URL or fallback to placeholder
 * @param url The URL to check
 * @returns Valid image URL or placeholder
 */
export const getValidImageUrl = (url: string): string => {
  return isValidImageUrl(url) ? url : PLACEHOLDER_IMAGE;
};

/**
 * Enhanced image error handler with Cloudinary fallback and debugging
 * @param e The error event from the image
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
  const target = e.target as HTMLImageElement;
  const originalSrc = target.src;
  console.warn(`Image load failed: ${originalSrc}`);
  
  // Prevent infinite loop
  target.onerror = null;
  
  // If this was a Next.js optimized Cloudinary image that failed, try our proxy
  if (originalSrc.includes('_next/image') && originalSrc.includes('cloudinary.com')) {
    try {
      // Extract the original Cloudinary URL from the Next.js image URL
      const urlParams = new URLSearchParams(originalSrc.split('?')[1]);
      const cloudinaryUrl = urlParams.get('url');
      const width = urlParams.get('w');
      const quality = urlParams.get('q');
      
      if (cloudinaryUrl) {
        const decodedUrl = decodeURIComponent(cloudinaryUrl);
        console.log(`Attempting image proxy fallback: ${decodedUrl}`);
        
        // Try our custom image proxy
        const proxyParams = new URLSearchParams();
        proxyParams.set('url', decodedUrl);
        if (width) proxyParams.set('w', width);
        if (quality) proxyParams.set('q', quality);
        
        const proxyUrl = `/api/image-proxy?${proxyParams.toString()}`;
        target.src = proxyUrl;
        return;
      }
    } catch (error) {
      console.warn('Failed to create image proxy fallback:', error);
    }
  }
  
  // If it's a direct Cloudinary URL that failed, try optimized version
  if (originalSrc.includes('cloudinary.com') && !originalSrc.includes('/api/image-proxy')) {
    try {
      console.log(`Attempting direct Cloudinary optimization fallback: ${originalSrc}`);
      
      const fallbackUrl = optimizeCloudinaryUrl(originalSrc, {
        width: 800,
        quality: 80,
        format: 'webp',
        fallback: true
      });
      
      if (fallbackUrl !== originalSrc) {
        target.src = fallbackUrl;
        return;
      }
    } catch (error) {
      console.warn('Failed to create Cloudinary fallback:', error);
    }
  }
  
  // Final fallback to placeholder
  target.src = PLACEHOLDER_IMAGE;
  console.log(`Image replaced with placeholder for: ${originalSrc}`);
};

/**
 * Creates a robust image component props with error handling
 * @param src Original image source
 * @param alt Alt text for the image
 * @param options Additional options
 * @returns Props object for image component
 */
export const createImageProps = (
  src: string,
  alt: string = 'Product image',
  options: {
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
  } = {}
) => {
  return {
    src: getValidImageUrl(src),
    alt,
    onError: handleImageError,
    loading: options.priority ? 'eager' : 'lazy' as 'eager' | 'lazy',
    placeholder: 'blur' as const,
    blurDataURL: PLACEHOLDER_IMAGE,
    ...options,
  };
};

/**
 * Extract a human-readable color name from a URL or path
 * @param url URL or path that might represent a color
 * @returns A formatted color name
 */
export const getColorNameFromUrl = (url: string | undefined): string => {
  if (!url) return "Default";
  
  // If color is a URL or path
  if (url.startsWith('http') || url.startsWith('/')) {
    // Extract just the filename for simplicity
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Return filename without extension, replacing dashes and underscores with spaces
    return fileName.split('.')[0].replace(/-|_/g, ' ');
  }
  
  return url;
};

/**
 * Normalizes the color value to ensure consistent comparison
 * @param color The color value to normalize
 * @returns Normalized color value for comparison
 */
export const normalizeColor = (color: string | undefined): string => {
  if (!color) return "";
  
  // For URLs, extract just the filename for comparison
  if (color.startsWith('http') || color.startsWith('/')) {
    const parts = color.split('/');
    return parts[parts.length - 1];
  }
  
  return color;
};
