// Server-side performance logging utility
// This file is safe to use in API routes and server components

interface ServerPerformanceLog {
  operation: string;
  timestamp: number;
  duration?: number;
  cacheStatus?: 'HIT' | 'MISS';
  metadata?: Record<string, any>;
}

class ServerPerformanceLogger {
  private logs: ServerPerformanceLog[] = [];
  private readonly MAX_LOGS = 100; // Keep last 100 logs in memory

  log(operation: string, metadata?: Record<string, any>, duration?: number) {
    if (process.env.NODE_ENV === 'development') {
      const logEntry: ServerPerformanceLog = {
        operation,
        timestamp: Date.now(),
        duration,
        metadata
      };
      
      this.logs.push(logEntry);
      
      // Keep only the last MAX_LOGS entries
      if (this.logs.length > this.MAX_LOGS) {
        this.logs.shift();
      }
      
      // Console output for development
      const durationText = duration ? ` (${duration.toFixed(2)}ms)` : '';
      console.log(`🚀 ${operation}${durationText}`, metadata || '');
    }
  }

  logCachePerformance(operation: 'GET' | 'SET' | 'INVALIDATE', hit: boolean, key: string) {
    if (process.env.NODE_ENV === 'development') {
      const status = hit ? 'HIT' : 'MISS';
      console.log(`🗄️ Cache ${operation}: ${status} for key: ${key}`);
      
      this.log(`Cache ${operation}`, { key, status });
    }
  }

  logApiPerformance(endpoint: string, method: string, duration: number, cacheStatus?: 'HIT' | 'MISS' | 'ERROR') {
    if (process.env.NODE_ENV === 'development') {
      const cacheText = cacheStatus ? ` [Cache: ${cacheStatus}]` : '';
      console.log(`🌐 API ${method} ${endpoint} (${duration.toFixed(2)}ms)${cacheText}`);
      
      this.log(`API ${method}`, { endpoint, duration, cacheStatus });
    }
  }

  logDatabasePerformance(operation: string, collection: string, duration: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗃️ DB ${operation} on ${collection} (${duration.toFixed(2)}ms)`);
      
      this.log(`DB ${operation}`, { collection, duration });
    }
  }

  // Get recent logs (useful for debugging)
  getRecentLogs(limit: number = 50): ServerPerformanceLog[] {
    return this.logs.slice(-limit);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }
}

// Global instance for server-side logging
export const serverLogger = new ServerPerformanceLogger();

// Utility functions for common logging patterns
export function logCachePerformance(operation: 'GET' | 'SET' | 'INVALIDATE', hit: boolean, key: string) {
  serverLogger.logCachePerformance(operation, hit, key);
}

export function logApiCall(endpoint: string, method: string = 'GET', duration?: number, cacheStatus?: 'HIT' | 'MISS' | 'ERROR') {
  if (duration !== undefined) {
    serverLogger.logApiPerformance(endpoint, method, duration, cacheStatus);
  } else {
    serverLogger.log(`API ${method}`, { endpoint });
  }
}

export function logDatabaseOperation(operation: string, collection: string, duration: number) {
  serverLogger.logDatabasePerformance(operation, collection, duration);
}

// Timer utility for measuring operation duration
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }

  end(): number {
    return performance.now() - this.startTime;
  }

  endAndLog(operation: string, metadata?: Record<string, any>) {
    const duration = this.end();
    serverLogger.log(operation, metadata, duration);
    return duration;
  }
}

// Helper function to time async operations
export async function timeOperation<T>(
  operation: string, 
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const timer = new PerformanceTimer();
  try {
    const result = await fn();
    timer.endAndLog(operation, metadata);
    return result;
  } catch (error) {
    timer.endAndLog(`${operation} (ERROR)`, { ...metadata, error: error instanceof Error ? error.message : error });
    throw error;
  }
}
