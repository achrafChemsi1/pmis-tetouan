/**
 * Error Handler Utilities
 * 
 * This module provides custom error classes and utility functions for consistent
 * error handling across the application.
 * 
 * @module utils/errorHandler
 */

/**
 * Base API Error class
 * All custom errors extend from this class
 */
class APIError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Operational errors are expected errors
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format for API response
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.errorCode || this.name,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    };
  }
}

/**
 * Validation Error - 422 Unprocessable Entity
 * Used when request validation fails
 */
class ValidationError extends APIError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error - 401 Unauthorized
 * Used when authentication fails or token is invalid
 */
class AuthenticationError extends APIError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Authorization Error - 403 Forbidden
 * Used when user doesn't have permission to access resource
 */
class AuthorizationError extends APIError {
  constructor(message = 'Access forbidden', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Not Found Error - 404 Not Found
 * Used when requested resource doesn't exist
 */
class NotFoundError extends APIError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * Conflict Error - 409 Conflict
 * Used when request conflicts with current state (e.g., duplicate entry)
 */
class ConflictError extends APIError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

/**
 * Bad Request Error - 400 Bad Request
 * Used when request is malformed or invalid
 */
class BadRequestError extends APIError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 * Used when rate limit is exceeded
 */
class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded', details = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

/**
 * Internal Server Error - 500 Internal Server Error
 * Used for unexpected server errors
 */
class InternalServerError extends APIError {
  constructor(message = 'Internal server error', details = null) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
    this.isOperational = false; // Internal errors are not operational
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Used for database operation failures
 */
class DatabaseError extends APIError {
  constructor(message = 'Database error', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.isOperational = false;
  }
}

/**
 * Format validation errors from express-validator
 * @param {Array} errors - Array of validation errors from express-validator
 * @returns {Array} Formatted validation error details
 */
function formatValidationErrors(errors) {
  return errors.map(error => ({
    field: error.param || error.path,
    message: error.msg,
    value: error.value
  }));
}

/**
 * Create error response object
 * @param {Error} error - Error object
 * @param {Boolean} includeStack - Whether to include stack trace (dev only)
 * @returns {Object} Formatted error response
 */
function createErrorResponse(error, includeStack = false) {
  const response = {
    success: false,
    error: {
      code: error.errorCode || error.name || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred'
    }
  };

  // Add error details if available
  if (error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development mode
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Check if error is operational (expected) or programming error
 * @param {Error} error - Error object
 * @returns {Boolean} True if error is operational
 */
function isOperationalError(error) {
  if (error instanceof APIError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Sanitize error for client response
 * Removes sensitive information from error messages
 * @param {Error} error - Error object
 * @returns {Error} Sanitized error
 */
function sanitizeError(error) {
  // Don't expose database errors to client
  if (error.code && error.code.startsWith('ER_')) {
    return new DatabaseError('Database operation failed');
  }

  // Don't expose internal paths or sensitive info
  if (error.message && error.message.includes('ENOENT')) {
    return new InternalServerError('File operation failed');
  }

  return error;
}

/**
 * Wrap async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle specific database errors and convert to appropriate API errors
 * @param {Error} error - Database error
 * @returns {APIError} Converted API error
 */
function handleDatabaseError(error) {
  // Duplicate entry error
  if (error.code === 'ER_DUP_ENTRY') {
    const match = error.message.match(/Duplicate entry '(.*)' for key '(.*)'/i);
    const field = match ? match[2].replace(/.*\./, '') : 'field';
    return new ConflictError(`Duplicate entry for ${field}`);
  }

  // Foreign key constraint error
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return new BadRequestError('Referenced resource does not exist');
  }

  // Connection error
  if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    return new DatabaseError('Database connection failed');
  }

  // Generic database error
  return new DatabaseError('Database operation failed');
}

module.exports = {
  // Error classes
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  RateLimitError,
  InternalServerError,
  DatabaseError,

  // Utility functions
  formatValidationErrors,
  createErrorResponse,
  isOperationalError,
  sanitizeError,
  asyncHandler,
  handleDatabaseError
};
