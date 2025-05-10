/**
 * Utility function to log data with a label in a standardized format
 */
export const debugLog = (label: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${label}: `, data);
  }
};

/**
 * Adds console logging to track component lifecycle
 * Use at the beginning of component function
 */
export const trackComponentLifecycle = (componentName: string, props: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[LIFECYCLE] Rendering ${componentName} with props:`, props);
  }
};
