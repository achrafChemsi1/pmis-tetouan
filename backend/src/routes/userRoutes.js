/**
 * User Routes
 * Route definitions for user management endpoints
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateUser, validateUserUpdate } = require('../utils/validators');

/**
 * @route   GET /api/users
 * @desc    Get all users with filters and pagination
 * @access  Private (Admin, HR Manager)
 */
router.get(
  '/',
  auth,
  checkRole(['admin', 'hr_manager']),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  userController.getUserById
);

/**
 * @route   GET /api/users/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile/me',
  auth,
  userController.getCurrentUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin, HR Manager)
 */
router.post(
  '/',
  auth,
  checkRole(['admin', 'hr_manager']),
  validateUser,
  userController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin, HR Manager, or own profile)
 */
router.put(
  '/:id',
  auth,
  validateUserUpdate,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete (deactivate) user
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  auth,
  checkRole(['admin']),
  userController.deleteUser
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put(
  '/:id/role',
  auth,
  checkRole(['admin']),
  userController.updateUserRole
);

/**
 * @route   PUT /api/users/:id/status
 * @desc    Update user status (active/inactive)
 * @access  Private (Admin)
 */
router.put(
  '/:id/status',
  auth,
  checkRole(['admin']),
  userController.updateUserStatus
);

/**
 * @route   PUT /api/users/profile/me
 * @desc    Update own profile
 * @access  Private
 */
router.put(
  '/profile/me',
  auth,
  validateUserUpdate,
  userController.updateOwnProfile
);

/**
 * @route   GET /api/users/:id/projects
 * @desc    Get user's projects
 * @access  Private
 */
router.get(
  '/:id/projects',
  auth,
  userController.getUserProjects
);

/**
 * @route   GET /api/users/:id/activities
 * @desc    Get user's activity log
 * @access  Private (Admin, or own activities)
 */
router.get(
  '/:id/activities',
  auth,
  userController.getUserActivities
);

module.exports = router;
