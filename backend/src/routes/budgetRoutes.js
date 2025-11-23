/**
 * Budget Routes
 * Route definitions for budget management endpoints
 * @module routes/budgetRoutes
 */

const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateBudget, validateTransaction } = require('../utils/validators');

/**
 * @route   GET /api/budgets
 * @desc    Get all budgets with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  auth,
  budgetController.getAllBudgets
);

/**
 * @route   GET /api/budgets/:id
 * @desc    Get budget by ID
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  budgetController.getBudgetById
);

/**
 * @route   POST /api/budgets
 * @desc    Create new budget
 * @access  Private (Admin, Finance Manager)
 */
router.post(
  '/',
  auth,
  checkRole(['admin', 'finance_manager']),
  validateBudget,
  budgetController.createBudget
);

/**
 * @route   PUT /api/budgets/:id
 * @desc    Update budget
 * @access  Private (Admin, Finance Manager)
 */
router.put(
  '/:id',
  auth,
  checkRole(['admin', 'finance_manager']),
  validateBudget,
  budgetController.updateBudget
);

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete (close) budget
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  auth,
  checkRole(['admin']),
  budgetController.deleteBudget
);

/**
 * @route   GET /api/budgets/:id/transactions
 * @desc    Get budget transactions
 * @access  Private
 */
router.get(
  '/:id/transactions',
  auth,
  budgetController.getTransactions
);

/**
 * @route   POST /api/budgets/:id/transactions
 * @desc    Create budget transaction
 * @access  Private (Admin, Finance Manager, Project Manager)
 */
router.post(
  '/:id/transactions',
  auth,
  checkRole(['admin', 'finance_manager', 'project_manager']),
  validateTransaction,
  budgetController.createTransaction
);

/**
 * @route   GET /api/budgets/:id/utilization
 * @desc    Get budget utilization metrics
 * @access  Private
 */
router.get(
  '/:id/utilization',
  auth,
  budgetController.getUtilization
);

/**
 * @route   GET /api/budgets/:id/forecast
 * @desc    Get budget forecast
 * @access  Private
 */
router.get(
  '/:id/forecast',
  auth,
  budgetController.getForecast
);

/**
 * @route   GET /api/budgets/alerts/all
 * @desc    Get all budget alerts
 * @access  Private (Admin, Finance Manager)
 */
router.get(
  '/alerts/all',
  auth,
  checkRole(['admin', 'finance_manager']),
  budgetController.getAllAlerts
);

module.exports = router;
