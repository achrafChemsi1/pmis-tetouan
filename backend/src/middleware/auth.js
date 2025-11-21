/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */

const jwt = require('jsonwebtoken');
const { createError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const config = require('../config/environment');
const logger = require('../utils/logger');

/**
 * Extract JWT token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Verify JWT token and attach user info to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token
    const token = extractToken(req);

    if (!token) {
      throw createError(
        'Authentication token is required',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };

    // Log authentication success
    logger.debug('User authenticated:', { userId: req.user.id, email: req.user.email });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired token attempted:', { exp: error.expiredAt });
      return next(
        createError(
          'Authentication token has expired',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.TOKEN_EXPIRED
        )
      );
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token attempted:', { message: error.message });
      return next(
        createError(
          'Invalid authentication token',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.INVALID_TOKEN
        )
      );
    }

    // Pass other errors to error handler
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      };
    }

    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
};

module.exports = {
  authenticate,
  authenticateOptional,
  extractToken,
};
