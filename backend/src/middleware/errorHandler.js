/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and formats consistent error responses
 * Prevents sensitive information leakage
 */

const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../config/logger');
const environment = require('../config/environment');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error details
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
  });

  // Default error response
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = err.code || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'Internal server error';
  let details = err.details || [];

  // Handle specific error types
  
  // MySQL errors
  if (err.code && err.code.startsWith('ER_')) {
    errorCode = ERROR_CODES.DATABASE_ERROR;
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    // Duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
      statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
      errorCode = ERROR_CODES.DUPLICATE_ENTRY;
      message = 'Duplicate entry. This record already exists.';
      
      // Extract field from error message
      const match = err.message.match(/for key '(\w+)'/i);
      if (match) {
        details = [{ field: match[1], message: 'Already exists' }];
      }
    } else {
      // Don't expose database errors in production
      message = environment.isProduction 
        ? 'Database error occurred' 
        : err.message;
    }
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Token has expired';
  }
  
  // Validation errors from express-validator
  if (err.array && typeof err.array === 'function') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = err.array().map(error => ({
      field: error.param || error.path,
      message: error.msg,
    }));
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details.length > 0 && { details }),
      ...(environment.isDevelopment && { stack: err.stack }),
    },
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Create custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {Array} details - Error details
 * @returns {Error} Custom error
 */
const createError = (message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = ERROR_CODES.INTERNAL_ERROR, details = []) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

/**
 * Async error wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  createError,
  asyncHandler,
};
