/**
 * Vendor Model
 * Database queries for vendor/supplier management
 * @module models/vendorModel
 */

const db = require('../config/database');

/**
 * Get all vendors with optional filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Vendor list with pagination
 */
const getAllVendors = async (filters = {}, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        v.*,
        COUNT(DISTINCT bt.transaction_id) as transaction_count,
        COALESCE(SUM(bt.amount), 0) as total_transactions_amount
      FROM vendors v
      LEFT JOIN budget_transactions bt ON v.vendor_id = bt.vendor_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (filters.status) {
      query += ' AND v.status = ?';
      params.push(filters.status);
    }
    
    if (filters.category) {
      query += ' AND v.category = ?';
      params.push(filters.category);
    }
    
    if (filters.rating_min) {
      query += ' AND v.rating >= ?';
      params.push(filters.rating_min);
    }
    
    if (filters.search) {
      query += ' AND (v.vendor_name LIKE ? OR v.contact_person LIKE ? OR v.email LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' GROUP BY v.vendor_id';
    query += ' ORDER BY v.vendor_name ASC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM vendors v WHERE 1=1';
    const countParams = [];
    
    if (filters.status) {
      countQuery += ' AND v.status = ?';
      countParams.push(filters.status);
    }
    
    if (filters.category) {
      countQuery += ' AND v.category = ?';
      countParams.push(filters.category);
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
 * Get vendor by ID with detailed information
 * @param {number} vendorId - Vendor ID
 * @returns {Promise<Object>} Vendor details
 */
const getVendorById = async (vendorId) => {
  try {
    const query = `
      SELECT 
        v.*,
        COUNT(DISTINCT bt.transaction_id) as transaction_count,
        COALESCE(SUM(CASE WHEN bt.status = 'approved' THEN bt.amount ELSE 0 END), 0) as total_approved_amount,
        COALESCE(SUM(CASE WHEN bt.status = 'pending' THEN bt.amount ELSE 0 END), 0) as total_pending_amount
      FROM vendors v
      LEFT JOIN budget_transactions bt ON v.vendor_id = bt.vendor_id
      WHERE v.vendor_id = ?
      GROUP BY v.vendor_id
    `;
    
    const [rows] = await db.query(query, [vendorId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Create new vendor
 * @param {Object} vendorData - Vendor data
 * @returns {Promise<Object>} Created vendor
 */
const createVendor = async (vendorData) => {
  try {
    const query = `
      INSERT INTO vendors (
        vendor_name, category, contact_person, email,
        phone, address, city, country,
        tax_id, registration_number, payment_terms,
        bank_account, rating, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      vendorData.vendor_name,
      vendorData.category,
      vendorData.contact_person,
      vendorData.email,
      vendorData.phone || null,
      vendorData.address || null,
      vendorData.city || null,
      vendorData.country || 'Morocco',
      vendorData.tax_id || null,
      vendorData.registration_number || null,
      vendorData.payment_terms || 'net_30',
      vendorData.bank_account || null,
      vendorData.rating || null,
      vendorData.status || 'active',
      vendorData.notes || null
    ];
    
    const [result] = await db.query(query, params);
    
    return await getVendorById(result.insertId);
  } catch (error) {
    throw error;
  }
};

/**
 * Update vendor
 * @param {number} vendorId - Vendor ID
 * @param {Object} vendorData - Updated vendor data
 * @returns {Promise<Object>} Updated vendor
 */
const updateVendor = async (vendorId, vendorData) => {
  try {
    const fields = [];
    const params = [];
    
    // Build dynamic update query
    Object.keys(vendorData).forEach(key => {
      if (vendorData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(vendorData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    fields.push('updated_at = NOW()');
    params.push(vendorId);
    
    const query = `UPDATE vendors SET ${fields.join(', ')} WHERE vendor_id = ?`;
    
    await db.query(query, params);
    
    return await getVendorById(vendorId);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete vendor (soft delete)
 * @param {number} vendorId - Vendor ID
 * @returns {Promise<boolean>} Success status
 */
const deleteVendor = async (vendorId) => {
  try {
    const query = `
      UPDATE vendors 
      SET status = 'inactive', updated_at = NOW() 
      WHERE vendor_id = ?
    `;
    
    const [result] = await db.query(query, [vendorId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Get vendor transactions
 * @param {number} vendorId - Vendor ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Transaction list
 */
const getVendorTransactions = async (vendorId, filters = {}) => {
  try {
    let query = `
      SELECT 
        bt.*,
        b.allocated_amount as budget_amount,
        bc.category_name as budget_category,
        p.project_name,
        u.full_name as created_by_name
      FROM budget_transactions bt
      LEFT JOIN budgets b ON bt.budget_id = b.budget_id
      LEFT JOIN budget_categories bc ON b.category_id = bc.category_id
      LEFT JOIN projects p ON b.project_id = p.project_id
      LEFT JOIN users u ON bt.created_by = u.user_id
      WHERE bt.vendor_id = ?
    `;
    
    const params = [vendorId];
    
    if (filters.status) {
      query += ' AND bt.status = ?';
      params.push(filters.status);
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
 * Get vendor performance metrics
 * @param {number} vendorId - Vendor ID
 * @returns {Promise<Object>} Performance metrics
 */
const getVendorPerformance = async (vendorId) => {
  try {
    const vendor = await getVendorById(vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    
    // Get transaction statistics
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as total_approved,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN amount ELSE 0 END), 0) as total_rejected,
        COALESCE(AVG(amount), 0) as avg_transaction_amount
      FROM budget_transactions
      WHERE vendor_id = ?`,
      [vendorId]
    );
    
    // Get recent transactions (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const [recentStats] = await db.query(
      `SELECT COUNT(*) as recent_transactions
      FROM budget_transactions
      WHERE vendor_id = ? AND transaction_date >= ?`,
      [vendorId, threeMonthsAgo]
    );
    
    return {
      vendor_id: vendorId,
      vendor_name: vendor.vendor_name,
      rating: vendor.rating,
      total_transactions: stats[0].total_transactions,
      total_approved_amount: parseFloat(stats[0].total_approved).toFixed(2),
      total_pending_amount: parseFloat(stats[0].total_pending).toFixed(2),
      total_rejected_amount: parseFloat(stats[0].total_rejected).toFixed(2),
      avg_transaction_amount: parseFloat(stats[0].avg_transaction_amount).toFixed(2),
      recent_transactions: recentStats[0].recent_transactions,
      status: vendor.status
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Update vendor rating
 * @param {number} vendorId - Vendor ID
 * @param {number} rating - New rating (1-5)
 * @param {string} review - Review comments
 * @returns {Promise<boolean>} Success status
 */
const updateVendorRating = async (vendorId, rating, review = null) => {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const query = `
      UPDATE vendors 
      SET rating = ?, 
          updated_at = NOW() 
      WHERE vendor_id = ?
    `;
    
    const [result] = await db.query(query, [rating, vendorId]);
    
    // Optionally store review in a separate table
    if (review) {
      await db.query(
        `INSERT INTO vendor_reviews (vendor_id, rating, review, review_date) 
         VALUES (?, ?, ?, NOW())`,
        [vendorId, rating, review]
      );
    }
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorTransactions,
  getVendorPerformance,
  updateVendorRating
};
