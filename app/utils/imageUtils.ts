/**
 * Utility functions for optimizing and handling images
 */

/**
 * Returns an optimized image URL for display 
 * @param imageUrl Original image URL
 * @param width Optional width parameter for resizing
 * @param height Optional height parameter for resizing
 */
export const getOptimizedImageUrl = (imageUrl: string, width?: number, height?: number): string => {
  if (!imageUrl) return '';
  
  // If image is already a Cloudinary URL, add transformations
  if (imageUrl.includes('cloudinary.com')) {
    // Add width and height parameters if provided
    const transformations = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    
    // If any transformations are specified, add them to the URL
    if (transformations.length > 0) {
      // Insert transformations into the URL path
      const transformString = transformations.join(',');
      
      // Split URL to insert transformations before upload
      const parts = imageUrl.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/${transformString}/${parts[1]}`;
      }
    }
  }
  
  // Return original URL if no transformations applied
  return imageUrl;
};

/**
 * Generates a placeholder image URL for use when actual image is unavailable
 */
export const getPlaceholderImage = (category?: string): string => {
  const defaultImage = '/placeholder-product.png';
  
  // Could return different placeholder images based on category
  return defaultImage;
};

/**
 * Handles image loading errors by replacing the source with a placeholder
 * @param event The error event from the image
 * @param fallbackSrc Optional custom fallback image source
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc?: string
): void => {
  const target = event.currentTarget;
  
  // Prevent infinite error loop if fallback also fails
  if (!target.src.includes('placeholder')) {
    // Use provided fallback or default placeholder
    target.src = fallbackSrc || '/placeholder-product.png';
    
    // Add a class to indicate this is a fallback image (optional)
    target.classList.add('fallback-image');
  }
};
