/**
 * Budget Model
 * Database queries for budget allocation and transaction management
 * @module models/budgetModel
 */

const db = require('../config/database');

/**
 * Get all budgets with optional filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Budget list with pagination
 */
const getAllBudgets = async (filters = {}, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        b.*,
        p.project_name,
        bc.category_name,
        u.full_name as allocated_by_name,
        COALESCE(SUM(bt.amount), 0) as total_spent,
        (b.allocated_amount - COALESCE(SUM(bt.amount), 0)) as remaining_amount
      FROM budgets b
      LEFT JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN budget_categories bc ON b.category_id = bc.category_id
      LEFT JOIN users u ON b.allocated_by = u.user_id
      LEFT JOIN budget_transactions bt ON b.budget_id = bt.budget_id AND bt.status = 'approved'
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (filters.project_id) {
      query += ' AND b.project_id = ?';
      params.push(filters.project_id);
    }
    
    if (filters.category_id) {
      query += ' AND b.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.fiscal_year) {
      query += ' AND b.fiscal_year = ?';
      params.push(filters.fiscal_year);
    }
    
    if (filters.status) {
      query += ' AND b.status = ?';
      params.push(filters.status);
    }
    
    query += ' GROUP BY b.budget_id';
    query += ' ORDER BY b.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(DISTINCT b.budget_id) as total FROM budgets b WHERE 1=1';
    const countParams = [];
    
    if (filters.project_id) {
      countQuery += ' AND b.project_id = ?';
      countParams.push(filters.project_id);
    }
    
    if (filters.category_id) {
      countQuery += ' AND b.category_id = ?';
      countParams.push(filters.category_id);
    }
    
    if (filters.fiscal_year) {
      countQuery += ' AND b.fiscal_year = ?';
      countParams.push(filters.fiscal_year);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get budget by ID with transaction details
 * @param {number} budgetId - Budget ID
 * @returns {Promise<Object>} Budget details
 */
const getBudgetById = async (budgetId) => {
  try {
    const query = `
      SELECT 
        b.*,
        p.project_name,
        bc.category_name,
        u.full_name as allocated_by_name,
        COALESCE(SUM(CASE WHEN bt.status = 'approved' THEN bt.amount ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(CASE WHEN bt.status = 'pending' THEN bt.amount ELSE 0 END), 0) as committed_amount,
        (b.allocated_amount - COALESCE(SUM(CASE WHEN bt.status = 'approved' THEN bt.amount ELSE 0 END), 0)) as remaining_amount
      FROM budgets b
      LEFT JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN budget_categories bc ON b.category_id = bc.category_id
      LEFT JOIN users u ON b.allocated_by = u.user_id
      LEFT JOIN budget_transactions bt ON b.budget_id = bt.budget_id
      WHERE b.budget_id = ?
      GROUP BY b.budget_id
    `;
    
    const [rows] = await db.query(query, [budgetId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Create new budget
 * @param {Object} budgetData - Budget data
 * @returns {Promise<Object>} Created budget
 */
const createBudget = async (budgetData) => {
  try {
    const query = `
      INSERT INTO budgets (
        project_id, category_id, allocated_amount,
        fiscal_year, start_date, end_date,
        allocated_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      budgetData.project_id,
      budgetData.category_id,
      budgetData.allocated_amount,
      budgetData.fiscal_year,
      budgetData.start_date,
      budgetData.end_date,
      budgetData.allocated_by,
      budgetData.status || 'active',
      budgetData.notes || null
    ];
    
    const [result] = await db.query(query, params);
    
    return await getBudgetById(result.insertId);
  } catch (error) {
    throw error;
  }
};

/**
 * Update budget
 * @param {number} budgetId - Budget ID
 * @param {Object} budgetData - Updated budget data
 * @returns {Promise<Object>} Updated budget
 */
const updateBudget = async (budgetId, budgetData) => {
  try {
    const fields = [];
    const params = [];
    
    // Build dynamic update query
    Object.keys(budgetData).forEach(key => {
      if (budgetData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(budgetData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    fields.push('updated_at = NOW()');
    params.push(budgetId);
    
    const query = `UPDATE budgets SET ${fields.join(', ')} WHERE budget_id = ?`;
    
    await db.query(query, params);
    
    return await getBudgetById(budgetId);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete budget (soft delete)
 * @param {number} budgetId - Budget ID
 * @returns {Promise<boolean>} Success status
 */
const deleteBudget = async (budgetId) => {
  try {
    const query = `
      UPDATE budgets 
      SET status = 'closed', updated_at = NOW() 
      WHERE budget_id = ?
    `;
    
    const [result] = await db.query(query, [budgetId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Get budget transactions
 * @param {number} budgetId - Budget ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Transaction list
 */
const getBudgetTransactions = async (budgetId, filters = {}) => {
  try {
    let query = `
      SELECT 
        bt.*,
        u.full_name as created_by_name,
        v.vendor_name
      FROM budget_transactions bt
      LEFT JOIN users u ON bt.created_by = u.user_id
      LEFT JOIN vendors v ON bt.vendor_id = v.vendor_id
      WHERE bt.budget_id = ?
    `;
    
    const params = [budgetId];
    
    if (filters.status) {
      query += ' AND bt.status = ?';
      params.push(filters.status);
    }
    
    if (filters.transaction_type) {
      query += ' AND bt.transaction_type = ?';
      params.push(filters.transaction_type);
    }
    
    if (filters.start_date) {
      query += ' AND bt.transaction_date >= ?';
      params.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ' AND bt.transaction_date <= ?';
      params.push(filters.end_date);
    }
    
    query += ' ORDER BY bt.transaction_date DESC';
    
    const [rows] = await db.query(query, params);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Create budget transaction
 * @param {Object} transactionData - Transaction data
 * @returns {Promise<number>} Transaction ID
 */
const createTransaction = async (transactionData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const query = `
      INSERT INTO budget_transactions (
        budget_id, transaction_type, amount, transaction_date,
        description, vendor_id, invoice_number, payment_method,
        created_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      transactionData.budget_id,
      transactionData.transaction_type,
      transactionData.amount,
      transactionData.transaction_date || new Date(),
      transactionData.description,
      transactionData.vendor_id || null,
      transactionData.invoice_number || null,
      transactionData.payment_method || null,
      transactionData.created_by,
      transactionData.status || 'pending',
      transactionData.notes || null
    ];
    
    const [result] = await connection.query(query, params);
    
    // Update budget spent amount if transaction is approved
    if (transactionData.status === 'approved') {
      await connection.query(
        'UPDATE budgets SET updated_at = NOW() WHERE budget_id = ?',
        [transactionData.budget_id]
      );
    }
    
    await connection.commit();
    
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update transaction status
 * @param {number} transactionId - Transaction ID
 * @param {string} status - New status
 * @param {number} approvedBy - User ID who approved
 * @returns {Promise<boolean>} Success status
 */
const updateTransactionStatus = async (transactionId, status, approvedBy = null) => {
  try {
    const query = `
      UPDATE budget_transactions 
      SET status = ?,
          approved_by = ?,
          approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE NULL END
      WHERE transaction_id = ?
    `;
    
    const params = [status, approvedBy, status, transactionId];
    
    const [result] = await db.query(query, params);
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate budget utilization percentage
 * @param {number} budgetId - Budget ID
 * @returns {Promise<Object>} Utilization metrics
 */
const calculateUtilization = async (budgetId) => {
  try {
    const budget = await getBudgetById(budgetId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    const allocatedAmount = parseFloat(budget.allocated_amount);
    const totalSpent = parseFloat(budget.total_spent);
    const committedAmount = parseFloat(budget.committed_amount);
    const remainingAmount = parseFloat(budget.remaining_amount);
    
    const utilizationRate = (totalSpent / allocatedAmount) * 100;
    const commitmentRate = ((totalSpent + committedAmount) / allocatedAmount) * 100;
    
    return {
      allocated_amount: allocatedAmount.toFixed(2),
      total_spent: totalSpent.toFixed(2),
      committed_amount: committedAmount.toFixed(2),
      remaining_amount: remainingAmount.toFixed(2),
      utilization_rate: utilizationRate.toFixed(2),
      commitment_rate: commitmentRate.toFixed(2),
      status: utilizationRate >= 90 ? 'critical' : utilizationRate >= 75 ? 'warning' : 'normal'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get budget alerts (overruns, approaching limits)
 * @param {number} budgetId - Budget ID (optional)
 * @returns {Promise<Array>} Alert list
 */
const getBudgetAlerts = async (budgetId = null) => {
  try {
    let query = `
      SELECT 
        b.budget_id,
        b.allocated_amount,
        p.project_name,
        bc.category_name,
        COALESCE(SUM(CASE WHEN bt.status = 'approved' THEN bt.amount ELSE 0 END), 0) as total_spent,
        ((COALESCE(SUM(CASE WHEN bt.status = 'approved' THEN bt.amount ELSE 0 END), 0) / b.allocated_amount) * 100) as utilization_rate
      FROM budgets b
      LEFT JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN budget_categories bc ON b.category_id = bc.category_id
      LEFT JOIN budget_transactions bt ON b.budget_id = bt.budget_id
      WHERE b.status = 'active'
    `;
    
    const params = [];
    
    if (budgetId) {
      query += ' AND b.budget_id = ?';
      params.push(budgetId);
    }
    
    query += ' GROUP BY b.budget_id';
    query += ' HAVING utilization_rate >= 75';
    query += ' ORDER BY utilization_rate DESC';
    
    const [rows] = await db.query(query, params);
    
    return rows.map(row => ({
      ...row,
      alert_level: row.utilization_rate >= 100 ? 'critical' : row.utilization_rate >= 90 ? 'high' : 'warning',
      message: row.utilization_rate >= 100 
        ? 'Budget exceeded' 
        : row.utilization_rate >= 90 
        ? 'Budget almost depleted' 
        : 'Budget approaching limit'
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Get budget forecast
 * @param {number} budgetId - Budget ID
 * @returns {Promise<Object>} Forecast data
 */
const getBudgetForecast = async (budgetId) => {
  try {
    const budget = await getBudgetById(budgetId);
    
    if (!budget) {
      throw new Error('Budget not found');
    }
    
    // Calculate daily spending rate
    const startDate = new Date(budget.start_date);
    const currentDate = new Date();
    const endDate = new Date(budget.end_date);
    
    const daysElapsed = Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
    
    const totalSpent = parseFloat(budget.total_spent);
    const dailySpendRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    
    const projectedTotal = dailySpendRate * totalDays;
    const projectedOverrun = Math.max(0, projectedTotal - parseFloat(budget.allocated_amount));
    
    return {
      current_spent: totalSpent.toFixed(2),
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
      daily_spend_rate: dailySpendRate.toFixed(2),
      projected_total: projectedTotal.toFixed(2),
      projected_overrun: projectedOverrun.toFixed(2),
      will_exceed: projectedTotal > parseFloat(budget.allocated_amount)
    };
  } catch (error) {
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
  createTransaction,
  updateTransactionStatus,
  calculateUtilization,
  getBudgetAlerts,
  getBudgetForecast
};
