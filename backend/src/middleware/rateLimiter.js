/**
 * Rate Limiter Middleware
 * 
 * Prevents API abuse with configurable rate limits
 */

const rateLimit = require('express-rate-limit');
const environment = require('../config/environment');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../config/logger');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: environment.rateLimit.windowMs, // 1 minute
  max: environment.rateLimit.maxRequests, // 100 requests per window
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id,
    });
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(environment.rateLimit.windowMs / 1000),
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: environment.rateLimit.windowMs, // 1 minute
  max: environment.rateLimit.authMax, // 5 requests per window
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many authentication attempts. Please try again in 1 minute.',
        retryAfter: 60,
      },
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
