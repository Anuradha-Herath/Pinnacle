// Error utilities for better debugging and user experience

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
  path: string;
}

export const createApiError = (
  status: number,
  message: string,
  path: string,
  code?: string,
  details?: any
): ApiError => ({
  status,
  message,
  code,
  details,
  timestamp: new Date().toISOString(),
  path
});

export const handleApiError = (error: any, path: string) => {
  console.error(`API Error at ${path}:`, error);
  
  // MongoDB connection errors
  if (error.name === 'MongoNetworkError' || error.message?.includes('ENOTFOUND')) {
    return createApiError(503, 'Database connection failed. Please try again later.', path, 'DB_CONNECTION_ERROR', error.message);
  }
  
  // MongoDB timeout errors
  if (error.name === 'MongoTimeoutError' || error.message?.includes('timeout')) {
    return createApiError(504, 'Request timeout. Please try again.', path, 'TIMEOUT_ERROR', error.message);
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return createApiError(400, 'Invalid data provided.', path, 'VALIDATION_ERROR', error.errors);
  }
  
  // Duplicate key errors
  if (error.code === 11000) {
    return createApiError(409, 'Resource already exists.', path, 'DUPLICATE_ERROR', error.keyValue);
  }
  
  // Cast errors (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    return createApiError(400, 'Invalid ID format.', path, 'CAST_ERROR', error.message);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return createApiError(401, 'Authentication failed.', path, 'AUTH_ERROR', error.message);
  }
  
  // Cloudinary errors
  if (error.message?.includes('cloudinary')) {
    return createApiError(502, 'Image upload service unavailable.', path, 'UPLOAD_ERROR', error.message);
  }
  
  // Default server error
  return createApiError(
    500,
    process.env.NODE_ENV === 'development' 
      ? error.message || 'Internal server error'
      : 'Internal server error. Please try again later.',
    path,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development' ? error.stack : undefined
  );
};

export const isRetryableError = (error: ApiError): boolean => {
  return ['DB_CONNECTION_ERROR', 'TIMEOUT_ERROR', 'UPLOAD_ERROR'].includes(error.code || '');
};
