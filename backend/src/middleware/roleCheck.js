/**
 * Role-Based Authorization Middleware
 * Checks if user has required roles or permissions
 */

const { createError } = require('./errorHandler');
const { HTTP_STATUS, ERROR_CODES, ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Check if user has any of the required roles
 * @param {Array<string>} allowedRoles - Array of allowed role names
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      logger.warn('Authorization attempted without authentication');
      return next(
        createError(
          'Authentication required',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        )
      );
    }

    // Check if user has any of the allowed roles
    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      logger.warn('Authorization failed:', {
        userId: req.user.id,
        userRoles,
        requiredRoles: allowedRoles,
        endpoint: req.originalUrl,
      });

      return next(
        createError(
          'You do not have permission to access this resource',
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    logger.debug('Authorization successful:', {
      userId: req.user.id,
      role: userRoles.find((role) => allowedRoles.includes(role)),
    });

    next();
  };
};

/**
 * Check if user has all of the required roles
 * @param {Array<string>} requiredRoles - Array of required role names
 * @returns {Function} Express middleware function
 */
const requireAllRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        createError(
          'Authentication required',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        )
      );
    }

    const userRoles = req.user.roles || [];
    const hasAllRoles = requiredRoles.every((role) => userRoles.includes(role));

    if (!hasAllRoles) {
      logger.warn('Authorization failed - missing required roles:', {
        userId: req.user.id,
        userRoles,
        requiredRoles,
      });

      return next(
        createError(
          'Insufficient permissions',
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };
};

/**
 * Check if user has specific permission
 * @param {string} permission - Required permission code
 * @returns {Function} Express middleware function
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        createError(
          'Authentication required',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        )
      );
    }

    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(permission)) {
      logger.warn('Authorization failed - missing permission:', {
        userId: req.user.id,
        requiredPermission: permission,
        userPermissions,
      });

      return next(
        createError(
          'You do not have permission to perform this action',
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN
        )
      );
    }

    next();
  };
};

/**
 * Check if user is admin
 * @returns {Function} Express middleware function
 */
const requireAdmin = () => requireRole([ROLES.ADMIN]);

/**
 * Check if user can manage projects (Admin or Project Manager)
 * @returns {Function} Express middleware function
 */
const canManageProjects = () => requireRole([ROLES.ADMIN, ROLES.PROJECT_MANAGER]);

/**
 * Check if user can manage equipment (Admin or Equipment Officer)
 * @returns {Function} Express middleware function
 */
const canManageEquipment = () => requireRole([ROLES.ADMIN, ROLES.EQUIPMENT_OFFICER]);

/**
 * Check if user can approve budgets (Admin or Finance Controller)
 * @returns {Function} Express middleware function
 */
const canApproveBudgets = () => requireRole([ROLES.ADMIN, ROLES.FINANCE_CONTROLLER]);

module.exports = {
  requireRole,
  requireAllRoles,
  requirePermission,
  requireAdmin,
  canManageProjects,
  canManageEquipment,
  canApproveBudgets,
};
