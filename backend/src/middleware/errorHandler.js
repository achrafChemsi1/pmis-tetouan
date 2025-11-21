/**
 * Global Error Handler Middleware
 * Catch and format all errors consistently
 */

const logger = require('./logger');
const { HTTP_STATUS, ERROR_CODES, NODE_ENV } = require('../config/environment');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log error with context
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Default error response
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = err.code || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || [];
  
  // Handle specific error types
  
  // MySQL/Database errors
  if (err.code && err.code.startsWith('ER_')) {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    errorCode = ERROR_CODES.DATABASE_ERROR;
    
    // Duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
      statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
      errorCode = ERROR_CODES.DUPLICATE_ENTRY;
      message = 'Duplicate entry. This record already exists.';
      
      // Extract field name from error message
      const match = err.message.match(/for key '([^']+)'/);
      if (match) {
        details = [{
          field: match[1],
          message: 'Value already exists'
        }];
      }
    } else {
      // Don't expose database errors in production
      message = NODE_ENV === 'production' 
        ? 'A database error occurred' 
        : err.message;
    }
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid or expired token';
  }
  
  // Validation errors (express-validator)
  if (err.array && typeof err.array === 'function') {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = err.array().map(e => ({
      field: e.param,
      message: e.msg,
      value: e.value
    }));
  }
  
  // Construct error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(details.length > 0 && { details }),
      ...(NODE_ENV === 'development' && { stack: err.stack }),
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Create custom error
 * @param {Number} statusCode - HTTP status code
 * @param {String} code - Error code
 * @param {String} message - Error message
 * @param {Array} details - Error details
 * @returns {Error} Custom error
 */
const createError = (statusCode, code, message, details = []) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

/**
 * Async error wrapper
 * Wrap async route handlers to catch errors
 * @param {Function} fn - Async function
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
  asyncHandler
};
