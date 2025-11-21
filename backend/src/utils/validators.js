/**
 * Validation Rules
 * Reusable validation rules using express-validator
 */

const { body, param, query } = require('express-validator');

/**
 * Password validation rules
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordRules = () => {
  return body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character');
};

// ============================================================================
// AUTH VALIDATORS
// ============================================================================

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateRefresh = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string')
];

const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Token must be a string'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character')
];

// ============================================================================
// PROJECT VALIDATORS
// ============================================================================

const validateCreateProject = [
  body('projectName')
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 255 })
    .withMessage('Project name must not exceed 255 characters')
    .trim(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  body('projectType')
    .notEmpty()
    .withMessage('Project type is required')
    .isIn(['CONSTRUCTION', 'RENOVATION', 'INFRASTRUCTURE', 'EQUIPMENT', 'OTHER'])
    .withMessage('Invalid project type'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('plannedEndDate')
    .notEmpty()
    .withMessage('Planned end date is required')
    .isISO8601()
    .withMessage('Planned end date must be a valid date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('Planned end date must be after start date');
      }
      return true;
    }),
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim(),
  body('projectManagerId')
    .notEmpty()
    .withMessage('Project manager is required')
    .isInt({ min: 1 })
    .withMessage('Project manager ID must be a positive integer'),
  body('estimatedBudget')
    .notEmpty()
    .withMessage('Estimated budget is required')
    .isFloat({ min: 0 })
    .withMessage('Estimated budget must be a positive number')
];

const validateUpdateProject = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer'),
  ...validateCreateProject
];

const validateProjectId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
];

// ============================================================================
// EQUIPMENT VALIDATORS
// ============================================================================

const validateCreateEquipment = [
  body('equipmentName')
    .notEmpty()
    .withMessage('Equipment name is required')
    .isLength({ max: 255 })
    .withMessage('Equipment name must not exceed 255 characters')
    .trim(),
  body('equipmentType')
    .notEmpty()
    .withMessage('Equipment type is required')
    .isIn(['VEHICLE', 'MACHINERY', 'TOOLS', 'ELECTRONICS', 'FURNITURE', 'OTHER'])
    .withMessage('Invalid equipment type'),
  body('purchaseDate')
    .notEmpty()
    .withMessage('Purchase date is required')
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),
  body('purchasePrice')
    .notEmpty()
    .withMessage('Purchase price is required')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .trim(),
  body('usefulLifeYears')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Useful life must be a positive integer')
];

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateId = (paramName = 'id') => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} must be a positive integer`)
];

module.exports = {
  // Auth validators
  validateLogin,
  validateRefresh,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  
  // Project validators
  validateCreateProject,
  validateUpdateProject,
  validateProjectId,
  
  // Equipment validators
  validateCreateEquipment,
  
  // Common validators
  validatePagination,
  validateId
};
