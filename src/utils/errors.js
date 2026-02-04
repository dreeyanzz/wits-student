/**
 * Custom Error Classes
 */

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ApiError extends Error {
  constructor(message, statusCode = 0, response = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Error Handler Utility
 */
export class ErrorHandler {
  static handle(error, context = '') {
    console.error(`[${context}]`, error);
    
    if (error instanceof ValidationError) {
      return {
        type: 'validation',
        message: error.message,
        field: error.field
      };
    }
    
    if (error instanceof AuthenticationError) {
      return {
        type: 'authentication',
        message: error.message
      };
    }
    
    if (error instanceof ApiError) {
      return {
        type: 'api',
        message: error.message,
        statusCode: error.statusCode
      };
    }
    
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred'
    };
  }
}
