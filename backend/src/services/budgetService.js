/**
 * Budget Service
 * Business logic for budget management
 * @module services/budgetService
 */

const budgetModel = require('../models/budgetModel');
const logger = require('../middleware/logger');

/**
 * Get all budgets with pagination and filtering
 */
const getAllBudgets = async (page, limit, filters) => {
  try {
    const offset = (page - 1) * limit;
    
    const budgets = await budgetModel.findAll(limit, offset, filters);
    const total = await budgetModel.count(filters);

    return {
      budgets,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    };
  } catch (error) {
    logger.error('Error in getAllBudgets service:', error);
    throw error;
  }
};

/**
 * Get budget by ID with full details
 */
const getBudgetById = async (id) => {
  try {
    const budget = await budgetModel.findById(id);
    
    if (budget) {
      // Get spending summary
      const summary = await budgetModel.getSpendingSummary(id);
      budget.spent = parseFloat(summary.total_spent) || 0;
      budget.committed = parseFloat(summary.total_committed) || 0;
      budget.available = budget.allocated_amount - budget.spent - budget.committed;
      budget.utilization_percentage = (budget.spent / budget.allocated_amount) * 100;
    }
    
    return budget;
  } catch (error) {
    logger.error('Error in getBudgetById service:', error);
    throw error;
  }
};

/**
 * Create new budget allocation
 */
const createBudget = async (budgetData) => {
  try {
    // Validate budget data
    validateBudgetData(budgetData);
    
    const budgetId = await budgetModel.create(budgetData);
    const budget = await budgetModel.findById(budgetId);
    
    return budget;
  } catch (error) {
    logger.error('Error in createBudget service:', error);
    throw error;
  }
};

/**
 * Update budget
 */
const updateBudget = async (id, updateData) => {
  try {
    const existing = await budgetModel.findById(id);
    if (!existing) {
      return null;
    }
    
    // Validate update data
    if (updateData.allocated_amount) {
      validateBudgetData(updateData, true);
      
      // Check if new amount is less than already spent
      const summary = await budgetModel.getSpendingSummary(id);
      const totalSpent = parseFloat(summary.total_spent) || 0;
      
      if (updateData.allocated_amount < totalSpent) {
        throw new Error(`Cannot reduce budget below spent amount (${totalSpent})`);
      }
    }
    
    await budgetModel.update(id, updateData);
    const budget = await budgetModel.findById(id);
    
    return budget;
  } catch (error) {
    logger.error('Error in updateBudget service:', error);
    throw error;
  }
};

/**
 * Delete budget
 */
const deleteBudget = async (id, userId) => {
  try {
    const existing = await budgetModel.findById(id);
    if (!existing) {
      return null;
    }
    
    // Check if budget has transactions
    const transactionCount = await budgetModel.countTransactions(id);
    if (transactionCount > 0) {
      throw new Error('Cannot delete budget with existing transactions');
    }
    
    await budgetModel.softDelete(id, userId);
    return true;
  } catch (error) {
    logger.error('Error in deleteBudget service:', error);
    throw error;
  }
};

/**
 * Get budget transactions
 */
const getBudgetTransactions = async (budgetId, page, limit, filters) => {
  try {
    const offset = (page - 1) * limit;
    
    const transactions = await budgetModel.getTransactions(budgetId, limit, offset, filters);
    const total = await budgetModel.countTransactions(budgetId, filters);
    
    return {
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    };
  } catch (error) {
    logger.error('Error in getBudgetTransactions service:', error);
    throw error;
  }
};

/**
 * Record budget transaction
 */
const recordTransaction = async (transactionData) => {
  try {
    // Validate transaction
    validateTransactionData(transactionData);
    
    // Get budget and check availability
    const budget = await getBudgetById(transactionData.budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    if (transactionData.type === 'expense' || transactionData.type === 'commitment') {
      const requiredAmount = parseFloat(transactionData.amount);
      if (requiredAmount > budget.available) {
        throw new Error(`Insufficient budget. Available: ${budget.available}, Required: ${requiredAmount}`);
      }
    }
    
    const transactionId = await budgetModel.createTransaction(transactionData);
    
    // Check for budget alerts
    await checkBudgetAlerts(budget.id);
    
    return await budgetModel.getTransactionById(transactionId);
  } catch (error) {
    logger.error('Error in recordTransaction service:', error);
    throw error;
  }
};

/**
 * Get budget summary and analytics
 */
const getBudgetSummary = async (budgetId) => {
  try {
    const budget = await getBudgetById(budgetId);
    if (!budget) {
      return null;
    }
    
    const summary = await budgetModel.getSpendingSummary(budgetId);
    const categoryBreakdown = await budgetModel.getSpendingByCategory(budgetId);
    const monthlyTrend = await budgetModel.getMonthlySpending(budgetId);
    
    return {
      budget,
      summary: {
        allocated: budget.allocated_amount,
        spent: parseFloat(summary.total_spent) || 0,
        committed: parseFloat(summary.total_committed) || 0,
        available: budget.available,
        utilization_percentage: budget.utilization_percentage
      },
      categoryBreakdown,
      monthlyTrend
    };
  } catch (error) {
    logger.error('Error in getBudgetSummary service:', error);
    throw error;
  }
};

/**
 * Get budget alerts (overruns, approaching limits)
 */
const getBudgetAlerts = async (threshold = 75) => {
  try {
    return await budgetModel.getAlertsAboveThreshold(threshold);
  } catch (error) {
    logger.error('Error in getBudgetAlerts service:', error);
    throw error;
  }
};

/**
 * Get budget forecast
 */
const getBudgetForecast = async (budgetId) => {
  try {
    const budget = await getBudgetById(budgetId);
    if (!budget) {
      return null;
    }
    
    const monthlySpending = await budgetModel.getMonthlySpending(budgetId);
    
    // Calculate average monthly spending
    if (monthlySpending.length === 0) {
      return {
        budget_id: budgetId,
        average_monthly_spending: 0,
        projected_total_spending: budget.spent,
        projected_completion_date: null,
        risk_level: 'low'
      };
    }
    
    const totalSpent = monthlySpending.reduce((sum, month) => sum + parseFloat(month.spent), 0);
    const averageMonthly = totalSpent / monthlySpending.length;
    
    // Project when budget will be exhausted
    const remainingBudget = budget.available;
    const monthsRemaining = remainingBudget / averageMonthly;
    
    const projectedCompletionDate = new Date();
    projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + Math.ceil(monthsRemaining));
    
    // Determine risk level
    let riskLevel = 'low';
    if (budget.utilization_percentage >= 90) riskLevel = 'critical';
    else if (budget.utilization_percentage >= 75) riskLevel = 'high';
    else if (budget.utilization_percentage >= 50) riskLevel = 'medium';
    
    return {
      budget_id: budgetId,
      average_monthly_spending: averageMonthly,
      projected_total_spending: budget.spent + (averageMonthly * monthsRemaining),
      projected_completion_date: projectedCompletionDate,
      months_remaining: monthsRemaining,
      risk_level: riskLevel
    };
  } catch (error) {
    logger.error('Error in getBudgetForecast service:', error);
    throw error;
  }
};

/**
 * Check budget alerts and create notifications
 */
const checkBudgetAlerts = async (budgetId) => {
  try {
    const budget = await getBudgetById(budgetId);
    
    const thresholds = [50, 75, 90, 100];
    const utilizationPercentage = budget.utilization_percentage;
    
    for (const threshold of thresholds) {
      if (utilizationPercentage >= threshold && utilizationPercentage < threshold + 5) {
        // Create alert (this would integrate with a notification system)
        logger.warn(`Budget alert: Budget ${budgetId} is at ${utilizationPercentage.toFixed(2)}% utilization`);
        
        // In a real system, you would create a notification record here
        // await notificationModel.create({
        //   type: 'budget_alert',
        //   budget_id: budgetId,
        //   threshold: threshold,
        //   message: `Budget utilization has reached ${threshold}%`
        // });
      }
    }
  } catch (error) {
    logger.error('Error in checkBudgetAlerts:', error);
    // Don't throw - this is a background task
  }
};

/**
 * Validate budget data
 */
const validateBudgetData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate && !data.project_id) {
    errors.push('Project ID is required');
  }
  
  if (!isUpdate && !data.category) {
    errors.push('Budget category is required');
  }
  
  if (data.category && ![
    'personnel',
    'materials',
    'equipment',
    'services',
    'overhead',
    'contingency',
    'other'
  ].includes(data.category)) {
    errors.push('Invalid budget category');
  }
  
  if (!isUpdate && (!data.allocated_amount || data.allocated_amount <= 0)) {
    errors.push('Allocated amount must be greater than 0');
  }
  
  if (data.allocated_amount && data.allocated_amount <= 0) {
    errors.push('Allocated amount must be greater than 0');
  }
  
  if (!isUpdate && !data.fiscal_year) {
    errors.push('Fiscal year is required');
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.errors = errors;
    throw error;
  }
};

/**
 * Validate transaction data
 */
const validateTransactionData = (data) => {
  const errors = [];
  
  if (!data.budgetId) {
    errors.push('Budget ID is required');
  }
  
  if (!data.type) {
    errors.push('Transaction type is required');
  }
  
  if (data.type && !['expense', 'commitment', 'adjustment', 'refund'].includes(data.type)) {
    errors.push('Invalid transaction type');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!data.description) {
    errors.push('Transaction description is required');
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.errors = errors;
    throw error;
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
