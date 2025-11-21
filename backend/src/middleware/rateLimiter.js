/**
 * Rate Limiting Middleware
 * Prevent API abuse with configurable rate limits
 */

const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_AUTH_MAX_REQUESTS, HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent')
    });
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
      }
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * Authentication endpoint rate limiter
 * 5 requests per minute per IP (stricter)
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_AUTH_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
      body: { email: req.body?.email },
      userAgent: req.get('user-agent')
    });
    
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
      }
    });
  }
});

/**
 * Export rate limiter
 * 10 requests per hour for export endpoints
 */
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many export requests. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  exportLimiter
};
