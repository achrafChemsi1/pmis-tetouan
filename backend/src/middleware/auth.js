/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user information to request
 */

const jwt = require('jsonwebtoken');
const environment = require('../config/environment');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../config/logger');

/**
 * Verify JWT token and attach user to request
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path,
      });
      
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required. Please provide a valid token.',
        },
      });
    }

    // Verify token
    jwt.verify(token, environment.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn('Authentication failed: Invalid token', {
          error: err.message,
          ip: req.ip,
          path: req.path,
        });
        
        let message = 'Invalid or expired token';
        if (err.name === 'TokenExpiredError') {
          message = 'Token has expired. Please refresh your token.';
        } else if (err.name === 'JsonWebTokenError') {
          message = 'Invalid token. Please login again.';
        }
        
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message,
          },
        });
      }

      // Attach user info to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      };

      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Internal server error during authentication',
      },
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work for both authenticated and anonymous users
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, environment.jwt.secret, (err, decoded) => {
    if (!err) {
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
      };
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
