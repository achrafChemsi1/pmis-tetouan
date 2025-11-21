/**
 * Validation Middleware
 * 
 * Input validation using express-validator
 * Returns consistent error responses for validation failures
 */

const { validationResult } = require('express-validator');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Validate request and return errors if validation fails
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        details: formattedErrors,
      },
    });
  }

  next();
};

module.exports = { validate };
