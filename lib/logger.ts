/**
 * Logging utility that only logs in development environment
 * Prevents console logs from appearing in production client
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isServer = typeof window === 'undefined';

  private log(level: LogLevel, message: string, ...args: any[]) {
    // Only log in development OR on server side
    if (this.isDevelopment || this.isServer) {
      console[level](message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', `[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', `[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', `[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', `[DEBUG] ${message}`, ...args);
  }

  // Server-only logging (always logs on server, never on client)
  serverOnly(level: LogLevel, message: string, ...args: any[]) {
    if (this.isServer) {
      console[level](`[SERVER] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();

// Helper function to suppress client-side errors in production
export const suppressClientErrors = () => {
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Override console methods in production on client
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.debug = () => {};
    
    // Suppress unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
      // Optionally send to error tracking service
      // reportErrorToService(event.reason);
    });
    
    // Suppress JavaScript errors
    window.addEventListener('error', (event) => {
      event.preventDefault();
      // Optionally send to error tracking service
      // reportErrorToService(event.error);
    });
  }
};
