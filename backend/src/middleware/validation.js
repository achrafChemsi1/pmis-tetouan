/**
 * Input Validation Middleware
 * Validate request body, params, and query using express-validator
 */

const { validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('./logger');

/**
 * Validate request and return errors if validation fails
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });
    
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value,
          location: err.location
        }))
      }
    });
  }
  
  next();
};

module.exports = {
  validate
};
