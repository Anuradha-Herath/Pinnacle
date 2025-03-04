/**
 * Utility functions for handling images and URLs
 */

// Default placeholder image to use when images fail to load
export const PLACEHOLDER_IMAGE = '/placeholder.png';

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
                        '/p5.webp', '/p6.webp', '/p7.webp', '/p8.webp', '/p9.webp',
                        '/placeholder.png'];
  
  if (validBasePaths.includes(url)) return true;
  
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
 * Returns a valid image URL or fallback to placeholder
 * @param url The URL to check
 * @returns Valid image URL or placeholder
 */
export const getValidImageUrl = (url: string): string => {
  return isValidImageUrl(url) ? url : PLACEHOLDER_IMAGE;
};

/**
 * Event handler for image loading errors
 * @param e The error event from the image
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
  const target = e.target as HTMLImageElement;
  target.onerror = null; // Prevent infinite loop
  target.src = PLACEHOLDER_IMAGE;
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
