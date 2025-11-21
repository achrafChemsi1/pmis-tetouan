/**
 * JWT Authentication Middleware
 * Verify JWT tokens and attach user info to request
 */

const jwt = require('jsonwebtoken');
const logger = require('./logger');
const { JWT_SECRET } = require('../config/environment');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Authenticate JWT token from Authorization header
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'No token provided. Authorization header required.'
        }
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Token verification failed:', {
          error: err.message,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
        
        if (err.name === 'TokenExpiredError') {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            error: {
              code: ERROR_CODES.UNAUTHORIZED,
              message: 'Token expired. Please refresh your token.'
            }
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            error: {
              code: ERROR_CODES.UNAUTHORIZED,
              message: 'Invalid token. Authentication failed.'
            }
          });
        }
        
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Token verification failed.'
          }
        });
      }
      
      // Attach user info to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        roles: decoded.roles || [],
        permissions: decoded.permissions || []
      };
      
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication error occurred'
      }
    });
  }
};

/**
 * Optional authentication (doesn't fail if no token)
 * Used for endpoints that can work with or without authentication
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.substring(7);
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        roles: decoded.roles || [],
        permissions: decoded.permissions || []
      };
    }
    next();
  });
};

module.exports = {
  authenticate,
  optionalAuth
};
