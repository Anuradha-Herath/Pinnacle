// Browser detection utility for debugging Edge-specific issues

export const getBrowserInfo = () => {
  if (typeof window === 'undefined') return 'Server';
  
  const userAgent = navigator.userAgent;
  const isEdge = /Edge\/|Edg\//.test(userAgent);
  const isChrome = /Chrome\//.test(userAgent) && !/Edge\/|Edg\//.test(userAgent);
  const isFirefox = /Firefox\//.test(userAgent);
  const isSafari = /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent);
  
  return {
    userAgent,
    isEdge,
    isChrome,
    isFirefox,
    isSafari,
    browserName: isEdge ? 'Edge' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Unknown'
  };
};

export const logBrowserInfo = () => {
  const info = getBrowserInfo();
  if (typeof info === 'object') {
    console.log('Browser Info:', info);
  }
};

// Enhanced fetch wrapper with browser-specific debugging
export const debugFetch = async (url: string, options: RequestInit = {}) => {
  const browserInfo = getBrowserInfo();
  
  if (typeof browserInfo === 'object') {
    console.log(`Making request to ${url} from ${browserInfo.browserName}`);
    
    if (browserInfo.isEdge) {
      console.log('Edge browser detected - using enhanced fetch options');
      // Add Edge-specific options
      options = {
        ...options,
        credentials: 'same-origin',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers,
        },
      };
    }
  }
  
  try {
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status} for ${url}`);
    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};
