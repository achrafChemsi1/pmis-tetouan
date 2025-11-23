/**
 * User Controller
 * Handles HTTP requests for user management
 * @module controllers/userController
 */

const userService = require('../services/userService');
const { validationResult } = require('express-validator');
const logger = require('../middleware/logger');

/**
 * Get all users with pagination and filtering
 * @route GET /api/users
 * @access Private (ADMIN, SUPERVISOR)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, department, status, search } = req.query;
    
    const filters = {
      role,
      department,
      status,
      search
    };

    const result = await userService.getAllUsers(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        itemsPerPage: result.itemsPerPage
      }
    });
  } catch (error) {
    logger.error('Error in getAllUsers:', error);
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(parseInt(id));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getUserById:', error);
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/users/me
 * @access Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getCurrentUser:', error);
    next(error);
  }
};

/**
 * Create new user
 * @route POST /api/users
 * @access Private (ADMIN)
 */
const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const userData = {
      ...req.body,
      created_by: req.user.id
    };

    const user = await userService.createUser(userData);

    logger.info(`User created: ${user.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email or username already exists'
        }
      });
    }
    logger.error('Error in createUser:', error);
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private (ADMIN or own profile)
 */
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    
    // Check if user is updating own profile or is admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only update your own profile'
        }
      });
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    // Only admins can update role
    if (req.user.role !== 'ADMIN' && updateData.role) {
      delete updateData.role;
    }

    const user = await userService.updateUser(parseInt(id), updateData);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    logger.info(`User updated: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateUser:', error);
    next(error);
  }
};

/**
 * Delete user (soft delete)
 * @route DELETE /api/users/:id
 * @access Private (ADMIN)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_DELETE',
          message: 'Cannot delete your own account'
        }
      });
    }

    const result = await userService.deleteUser(parseInt(id), req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    logger.info(`User deleted: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    next(error);
  }
};

/**
 * Update user status
 * @route PATCH /api/users/:id/status
 * @access Private (ADMIN)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status value'
        }
      });
    }

    const user = await userService.updateUserStatus(parseInt(id), status, req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    logger.info(`User status updated: ${id} to ${status} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User status updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateUserStatus:', error);
    next(error);
  }
};

/**
 * Get user activity logs
 * @route GET /api/users/:id/activity
 * @access Private (ADMIN or own profile)
 */
const getUserActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user is viewing own activity or is admin
    if (req.user.id !== parseInt(id) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own activity'
        }
      });
    }

    const result = await userService.getUserActivity(
      parseInt(id),
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result.activities,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }
    });
  } catch (error) {
    logger.error('Error in getUserActivity:', error);
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getCurrentUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserActivity
};
