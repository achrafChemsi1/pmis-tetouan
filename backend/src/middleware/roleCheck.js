/**
 * Role-Based Authorization Middleware
 * 
 * Checks if authenticated user has required roles or permissions
 */

const { HTTP_STATUS, ERROR_CODES, ROLES } = require('../config/constants');
const logger = require('../config/logger');

/**
 * Check if user has one of the required roles
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
    }

    // Admin has access to everything
    if (req.user.roles.includes(ROLES.ADMIN)) {
      return next();
    }

    // Check if user has any of the allowed roles
    const hasRole = allowedRoles.some(role => req.user.roles.includes(role));

    if (!hasRole) {
      logger.warn('Authorization failed: Insufficient role', {
        userId: req.user.id,
        userRoles: req.user.roles,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have permission to perform this action',
          details: {
            requiredRoles: allowedRoles,
            yourRoles: req.user.roles,
          },
        },
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission
 * @param {string} requiredPermission - Required permission code
 * @returns {Function} Express middleware
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
    }

    // Admin has all permissions
    if (req.user.roles.includes(ROLES.ADMIN)) {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions.includes(requiredPermission)) {
      logger.warn('Authorization failed: Insufficient permission', {
        userId: req.user.id,
        requiredPermission,
        userPermissions: req.user.permissions,
        path: req.path,
        method: req.method,
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have permission to perform this action',
          details: {
            requiredPermission,
          },
        },
      });
    }

    next();
  };
};

/**
 * Check if user has any of the required permissions
 * @param {Array<string>} permissions - Array of permission codes
 * @returns {Function} Express middleware
 */
const requireAnyPermission = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
    }

    // Admin has all permissions
    if (req.user.roles.includes(ROLES.ADMIN)) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn('Authorization failed: None of required permissions', {
        userId: req.user.id,
        requiredPermissions: permissions,
        userPermissions: req.user.permissions,
        path: req.path,
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: 'You do not have permission to perform this action',
        },
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
};
