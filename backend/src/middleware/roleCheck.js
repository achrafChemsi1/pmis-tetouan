/**
 * Role-Based Authorization Middleware
 * Check user roles and permissions
 */

const logger = require('./logger');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Check if user has required role(s)
 * @param {String|Array} allowedRoles - Role or array of roles
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Authentication required'
          }
        });
      }
      
      // Convert to array if single role provided
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user has any of the required roles
      const hasRole = req.user.roles.some(role => roles.includes(role));
      
      if (!hasRole) {
        logger.warn('Authorization failed - insufficient role:', {
          userId: req.user.id,
          userRoles: req.user.roles,
          requiredRoles: roles,
          path: req.path,
          method: req.method
        });
        
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'You do not have permission to perform this action',
            details: [{
              role: roles.join(', '),
              message: 'Required role not found'
            }]
          }
        });
      }
      
      next();
    } catch (error) {
      logger.error('Role check middleware error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Authorization error occurred'
        }
      });
    }
  };
};

/**
 * Check if user has required permission(s)
 * @param {String|Array} requiredPermissions - Permission or array of permissions
 * @returns {Function} Express middleware
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Authentication required'
          }
        });
      }
      
      // Convert to array if single permission provided
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];
      
      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        req.user.permissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        logger.warn('Authorization failed - insufficient permissions:', {
          userId: req.user.id,
          userPermissions: req.user.permissions,
          requiredPermissions: permissions,
          path: req.path,
          method: req.method
        });
        
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'You do not have permission to perform this action',
            details: permissions.map(p => ({
              permission: p,
              message: 'Missing required permission'
            }))
          }
        });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check middleware error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Authorization error occurred'
        }
      });
    }
  };
};

/**
 * Check if user is admin
 * @returns {Function} Express middleware
 */
const requireAdmin = () => {
  return requireRole('ADMIN');
};

module.exports = {
  requireRole,
  requirePermission,
  requireAdmin
};
