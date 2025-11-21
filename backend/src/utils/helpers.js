/**
 * Helper Utility Functions
 * Reusable utility functions throughout the application
 */

const { PAGINATION, HTTP_STATUS } = require('../config/constants');

/**
 * Calculate pagination offset
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {number} Offset value
 */
const calculateOffset = (page, limit) => {
  return (page - 1) * limit;
};

/**
 * Build pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages: totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Parse pagination from query parameters
 * @param {Object} query - Express request query object
 * @returns {Object} Parsed pagination parameters
 */
const parsePagination = (query) => {
  const page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );

  return { page, limit, offset: calculateOffset(page, limit) };
};

/**
 * Format success response
 * @param {Object} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object} Formatted success response
 */
const successResponse = (data, message = null) => {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return response;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Array} details - Error details
 * @returns {Object} Formatted error response
 */
const errorResponse = (message, code, details = []) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details.length > 0) {
    response.error.details = details;
  }

  return response;
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} dataKey - Key name for data array (default: 'items')
 */
const sendPaginatedResponse = (res, items, page, limit, total, dataKey = 'items') => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      [dataKey]: items,
      pagination: buildPagination(page, limit, total),
    },
  });
};

/**
 * Sanitize user object (remove sensitive fields)
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
  const sanitized = { ...user };
  delete sanitized.password_hash;
  delete sanitized.password_reset_token;
  delete sanitized.password_reset_expires;
  delete sanitized.two_factor_secret;
  return sanitized;
};

/**
 * Convert snake_case to camelCase
 * @param {Object} obj - Object with snake_case keys
 * @returns {Object} Object with camelCase keys
 */
const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }

  return obj;
};

/**
 * Convert camelCase to snake_case
 * @param {Object} obj - Object with camelCase keys
 * @returns {Object} Object with snake_case keys
 */
const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {});
  }

  return obj;
};

/**
 * Generate random string
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  calculateOffset,
  buildPagination,
  parsePagination,
  successResponse,
  errorResponse,
  sendPaginatedResponse,
  sanitizeUser,
  toCamelCase,
  toSnakeCase,
  generateRandomString,
  sleep,
};
