/**
 * Budget Controller
 * Handles HTTP requests for budget management
 * @module controllers/budgetController
 */

const budgetService = require('../services/budgetService');
const { validationResult } = require('express-validator');
const logger = require('../middleware/logger');

/**
 * Get all budgets with pagination and filtering
 * @route GET /api/budgets
 * @access Private
 */
const getAllBudgets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, projectId, category, fiscalYear, status } = req.query;
    
    const filters = {
      projectId: projectId ? parseInt(projectId) : undefined,
      category,
      fiscalYear: fiscalYear ? parseInt(fiscalYear) : undefined,
      status
    };

    const result = await budgetService.getAllBudgets(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.status(200).json({
      success: true,
      data: result.budgets,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        itemsPerPage: result.itemsPerPage
      }
    });
  } catch (error) {
    logger.error('Error in getAllBudgets:', error);
    next(error);
  }
};

/**
 * Get budget by ID with full details
 * @route GET /api/budgets/:id
 * @access Private
 */
const getBudgetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const budget = await budgetService.getBudgetById(parseInt(id));

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    logger.error('Error in getBudgetById:', error);
    next(error);
  }
};

/**
 * Create new budget allocation
 * @route POST /api/budgets
 * @access Private (ADMIN, FINANCE_CONTROLLER, PROJECT_MANAGER)
 */
const createBudget = async (req, res, next) => {
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

    const budgetData = {
      ...req.body,
      created_by: req.user.id
    };

    const budget = await budgetService.createBudget(budgetData);

    logger.info(`Budget created: ${budget.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });
  } catch (error) {
    logger.error('Error in createBudget:', error);
    next(error);
  }
};

/**
 * Update budget
 * @route PUT /api/budgets/:id
 * @access Private (ADMIN, FINANCE_CONTROLLER)
 */
const updateBudget = async (req, res, next) => {
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
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    const budget = await budgetService.updateBudget(parseInt(id), updateData);

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found'
        }
      });
    }

    logger.info(`Budget updated: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateBudget:', error);
    next(error);
  }
};

/**
 * Delete budget
 * @route DELETE /api/budgets/:id
 * @access Private (ADMIN)
 */
const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await budgetService.deleteBudget(parseInt(id), req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found'
        }
      });
    }

    logger.info(`Budget deleted: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteBudget:', error);
    next(error);
  }
};

/**
 * Get budget transactions
 * @route GET /api/budgets/:id/transactions
 * @access Private
 */
const getBudgetTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;

    const filters = {
      type,
      startDate,
      endDate
    };

    const result = await budgetService.getBudgetTransactions(
      parseInt(id),
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }
    });
  } catch (error) {
    logger.error('Error in getBudgetTransactions:', error);
    next(error);
  }
};

/**
 * Record budget transaction
 * @route POST /api/budgets/:id/transactions
 * @access Private (ADMIN, FINANCE_CONTROLLER, PROJECT_MANAGER)
 */
const recordTransaction = async (req, res, next) => {
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
    const transactionData = {
      ...req.body,
      budgetId: parseInt(id),
      created_by: req.user.id
    };

    const transaction = await budgetService.recordTransaction(transactionData);

    logger.info(`Transaction recorded for budget ${id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction recorded successfully'
    });
  } catch (error) {
    logger.error('Error in recordTransaction:', error);
    next(error);
  }
};

/**
 * Get budget summary and analytics
 * @route GET /api/budgets/:id/summary
 * @access Private
 */
const getBudgetSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const summary = await budgetService.getBudgetSummary(parseInt(id));

    if (!summary) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error in getBudgetSummary:', error);
    next(error);
  }
};

/**
 * Get budget alerts (overruns, approaching limits)
 * @route GET /api/budgets/alerts
 * @access Private
 */
const getBudgetAlerts = async (req, res, next) => {
  try {
    const { threshold = 75 } = req.query;
    const alerts = await budgetService.getBudgetAlerts(parseInt(threshold));

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Error in getBudgetAlerts:', error);
    next(error);
  }
};

/**
 * Get budget forecast
 * @route GET /api/budgets/:id/forecast
 * @access Private
 */
const getBudgetForecast = async (req, res, next) => {
  try {
    const { id } = req.params;
    const forecast = await budgetService.getBudgetForecast(parseInt(id));

    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error) {
    logger.error('Error in getBudgetForecast:', error);
    next(error);
  }
};

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetTransactions,
  recordTransaction,
  getBudgetSummary,
  getBudgetAlerts,
  getBudgetForecast
};
