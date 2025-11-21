/**
 * Input Validation Middleware
 * Uses express-validator for request validation
 */

const { validationResult } = require('express-validator');
const { createError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Validate request and return errors if any
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return next(
      createError(
        'Validation failed',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ERROR,
        formattedErrors
      )
    );
  }

  next();
};

module.exports = { validate };
