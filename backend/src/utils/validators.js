/**
 * Validation Rules
 * Reusable validation rules using express-validator
 */

const { body, param, query } = require('express-validator');
const { PASSWORD } = require('../config/constants');

/**
 * Email validation
 */
const emailValidator = body('email')
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .isEmail()
  .withMessage('Invalid email format')
  .normalizeEmail();

/**
 * Password validation
 */
const passwordValidator = body('password')
  .notEmpty()
  .withMessage('Password is required')
  .isLength({ min: PASSWORD.MIN_LENGTH, max: PASSWORD.MAX_LENGTH })
  .withMessage(`Password must be between ${PASSWORD.MIN_LENGTH} and ${PASSWORD.MAX_LENGTH} characters`)
  .matches(PASSWORD.REGEX)
  .withMessage(
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

/**
 * Simple password validation (for login)
 */
const passwordLoginValidator = body('password')
  .notEmpty()
  .withMessage('Password is required');

/**
 * ID parameter validation
 */
const idParamValidator = param('id')
  .isInt({ min: 1 })
  .withMessage('Invalid ID parameter');

/**
 * Pagination query validation
 */
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

/**
 * Date validation
 */
const dateValidator = (field) =>
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid date in ISO 8601 format`);

/**
 * Decimal/currency validation
 */
const currencyValidator = (field) =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage(`${field} must be a valid decimal number`)
    .custom((value) => parseFloat(value) >= 0)
    .withMessage(`${field} must be non-negative`);

/**
 * Percentage validation
 */
const percentageValidator = (field) =>
  body(field)
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage(`${field} must be between 0 and 100`);

/**
 * Enum validation
 */
const enumValidator = (field, allowedValues) =>
  body(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);

/**
 * Optional enum validation
 */
const optionalEnumValidator = (field, allowedValues) =>
  body(field)
    .optional()
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);

module.exports = {
  emailValidator,
  passwordValidator,
  passwordLoginValidator,
  idParamValidator,
  paginationValidators,
  dateValidator,
  currencyValidator,
  percentageValidator,
  enumValidator,
  optionalEnumValidator,
};
