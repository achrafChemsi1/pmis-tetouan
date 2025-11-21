/**
 * Utility Helper Functions
 * Common helper functions used across the application
 */

const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/environment');

/**
 * Convert snake_case to camelCase
 * @param {Object} obj - Object with snake_case keys
 * @returns {Object} Object with camelCase keys
 */
const toCamelCase = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
    return result;
  }, {});
};

/**
 * Convert camelCase to snake_case
 * @param {Object} obj - Object with camelCase keys
 * @returns {Object} Object with snake_case keys
 */
const toSnakeCase = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  return Object.keys(obj).reduce((result, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(obj[key]);
    return result;
  }, {});
};

/**
 * Parse pagination parameters from query
 * @param {Object} query - Request query object
 * @returns {Object} Pagination parameters
 */
const parsePagination = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Build pagination metadata
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (page, limit, total) => {
  const pages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
};

/**
 * Format success response
 * @param {any} data - Response data
 * @returns {Object} Formatted response
 */
const successResponse = (data) => {
  return {
    success: true,
    data
  };
};

/**
 * Format error response
 * @param {String} code - Error code
 * @param {String} message - Error message
 * @param {Array} details - Error details
 * @returns {Object} Formatted error
 */
const errorResponse = (code, message, details = []) => {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 && { details })
    }
  };
};

/**
 * Sanitize user object (remove sensitive fields)
 * @param {Object} user - User object
 * @returns {Object} Sanitized user
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  
  const { passwordHash, passwordResetToken, passwordResetExpires, twoFactorSecret, ...sanitized } = user;
  return sanitized;
};

/**
 * Parse sort parameters
 * @param {String} sortBy - Sort field
 * @param {String} sortOrder - Sort order (asc/desc)
 * @returns {Object} Sort parameters
 */
const parseSort = (sortBy, sortOrder = 'asc') => {
  const validSortOrders = ['asc', 'desc'];
  const order = validSortOrders.includes(sortOrder?.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
  
  return {
    sortBy: sortBy || 'created_at',
    sortOrder: order
  };
};

/**
 * Parse field selection
 * @param {String} fields - Comma-separated field names
 * @param {Array} allowedFields - Allowed field names
 * @returns {Array} Selected fields
 */
const parseFields = (fields, allowedFields = []) => {
  if (!fields) return allowedFields;
  
  const requestedFields = fields.split(',').map(f => f.trim());
  
  if (allowedFields.length === 0) {
    return requestedFields;
  }
  
  // Return only allowed fields
  return requestedFields.filter(f => allowedFields.includes(f));
};

/**
 * Generate unique code
 * @param {String} prefix - Code prefix (e.g., 'PROJ', 'EQP')
 * @param {Number} id - Entity ID
 * @param {Number} year - Year
 * @returns {String} Generated code
 */
const generateCode = (prefix, id, year = new Date().getFullYear()) => {
  const paddedId = String(id).padStart(4, '0');
  return `${prefix}-${year}-${paddedId}`;
};

/**
 * Calculate percentage
 * @param {Number} value - Current value
 * @param {Number} total - Total value
 * @param {Number} decimals - Decimal places
 * @returns {Number} Percentage
 */
const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return 0;
  return parseFloat(((value / total) * 100).toFixed(decimals));
};

/**
 * Format currency
 * @param {Number} amount - Amount
 * @param {String} currency - Currency code
 * @returns {String} Formatted amount
 */
const formatCurrency = (amount, currency = 'MAD') => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Get date range filter SQL
 * @param {String} dateFrom - Start date
 * @param {String} dateTo - End date
 * @param {String} column - Date column name
 * @returns {Object} SQL fragment and params
 */
const getDateRangeFilter = (dateFrom, dateTo, column = 'created_at') => {
  const conditions = [];
  const params = [];
  
  if (dateFrom) {
    conditions.push(`${column} >= ?`);
    params.push(dateFrom);
  }
  
  if (dateTo) {
    conditions.push(`${column} <= ?`);
    params.push(dateTo);
  }
  
  return {
    sql: conditions.length > 0 ? conditions.join(' AND ') : '',
    params
  };
};

module.exports = {
  toCamelCase,
  toSnakeCase,
  parsePagination,
  buildPaginationMeta,
  successResponse,
  errorResponse,
  sanitizeUser,
  parseSort,
  parseFields,
  generateCode,
  calculatePercentage,
  formatCurrency,
  getDateRangeFilter
};
