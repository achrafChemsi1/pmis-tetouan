/**
 * Approval Model
 * Database queries for approval workflow management
 * @module models/approvalModel
 */

const db = require('../config/database');

/**
 * Get all approvals with optional filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} Approval list with pagination
 */
const getAllApprovals = async (filters = {}, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        a.*,
        aw.workflow_name,
        awl.level_name,
        awl.required_role,
        u_req.full_name as requested_by_name,
        u_app.full_name as approver_name
      FROM approvals a
      LEFT JOIN approval_workflows aw ON a.workflow_id = aw.workflow_id
      LEFT JOIN approval_workflow_levels awl ON a.current_level_id = awl.level_id
      LEFT JOIN users u_req ON a.requested_by = u_req.user_id
      LEFT JOIN users u_app ON a.approver_id = u_app.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (filters.status) {
      query += ' AND a.status = ?';
      params.push(filters.status);
    }
    
    if (filters.entity_type) {
      query += ' AND a.entity_type = ?';
      params.push(filters.entity_type);
    }
    
    if (filters.requested_by) {
      query += ' AND a.requested_by = ?';
      params.push(filters.requested_by);
    }
    
    if (filters.approver_id) {
      query += ' AND a.approver_id = ?';
      params.push(filters.approver_id);
    }
    
    if (filters.priority) {
      query += ' AND a.priority = ?';
      params.push(filters.priority);
    }
    
    query += ' ORDER BY a.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM approvals a WHERE 1=1';
    const countParams = [];
    
    if (filters.status) {
      countQuery += ' AND a.status = ?';
      countParams.push(filters.status);
    }
    
    if (filters.entity_type) {
      countQuery += ' AND a.entity_type = ?';
      countParams.push(filters.entity_type);
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
 * Get approval by ID with full details
 * @param {number} approvalId - Approval ID
 * @returns {Promise<Object>} Approval details
 */
const getApprovalById = async (approvalId) => {
  try {
    const query = `
      SELECT 
        a.*,
        aw.workflow_name,
        awl.level_name,
        awl.level_order,
        awl.required_role,
        u_req.full_name as requested_by_name,
        u_req.email as requested_by_email,
        u_app.full_name as approver_name,
        u_app.email as approver_email
      FROM approvals a
      LEFT JOIN approval_workflows aw ON a.workflow_id = aw.workflow_id
      LEFT JOIN approval_workflow_levels awl ON a.current_level_id = awl.level_id
      LEFT JOIN users u_req ON a.requested_by = u_req.user_id
      LEFT JOIN users u_app ON a.approver_id = u_app.user_id
      WHERE a.approval_id = ?
    `;
    
    const [rows] = await db.query(query, [approvalId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Create new approval request
 * @param {Object} approvalData - Approval data
 * @returns {Promise<Object>} Created approval
 */
const createApproval = async (approvalData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get the first workflow level
    const [levels] = await connection.query(
      `SELECT level_id, required_role 
       FROM approval_workflow_levels 
       WHERE workflow_id = ? 
       ORDER BY level_order ASC 
       LIMIT 1`,
      [approvalData.workflow_id]
    );
    
    if (levels.length === 0) {
      throw new Error('No workflow levels found');
    }
    
    const firstLevel = levels[0];
    
    // Find an approver with the required role
    const [approvers] = await connection.query(
      `SELECT user_id 
       FROM users 
       WHERE role = ? AND status = 'active' 
       LIMIT 1`,
      [firstLevel.required_role]
    );
    
    const approverId = approvers.length > 0 ? approvers[0].user_id : null;
    
    const query = `
      INSERT INTO approvals (
        workflow_id, entity_type, entity_id, requested_by,
        current_level_id, approver_id, status, priority,
        request_data, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      approvalData.workflow_id,
      approvalData.entity_type,
      approvalData.entity_id,
      approvalData.requested_by,
      firstLevel.level_id,
      approverId,
      'pending',
      approvalData.priority || 'medium',
      JSON.stringify(approvalData.request_data || {}),
      approvalData.notes || null
    ];
    
    const [result] = await connection.query(query, params);
    
    // Create approval history entry
    await connection.query(
      `INSERT INTO approval_history (
        approval_id, level_id, approver_id, action, comments
      ) VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, firstLevel.level_id, approvalData.requested_by, 'submitted', 'Approval request submitted']
    );
    
    await connection.commit();
    
    return await getApprovalById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Process approval (approve/reject)
 * @param {number} approvalId - Approval ID
 * @param {Object} actionData - Action data (action, comments, userId)
 * @returns {Promise<Object>} Updated approval
 */
const processApproval = async (approvalId, actionData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const approval = await getApprovalById(approvalId);
    
    if (!approval) {
      throw new Error('Approval not found');
    }
    
    if (approval.status !== 'pending') {
      throw new Error('Approval is not in pending status');
    }
    
    const action = actionData.action; // 'approved' or 'rejected'
    const comments = actionData.comments || null;
    const userId = actionData.userId;
    
    // Record approval history
    await connection.query(
      `INSERT INTO approval_history (
        approval_id, level_id, approver_id, action, comments
      ) VALUES (?, ?, ?, ?, ?)`,
      [approvalId, approval.current_level_id, userId, action, comments]
    );
    
    if (action === 'rejected') {
      // Rejection ends the workflow
      await connection.query(
        `UPDATE approvals 
         SET status = 'rejected', 
             processed_at = NOW(), 
             updated_at = NOW() 
         WHERE approval_id = ?`,
        [approvalId]
      );
    } else if (action === 'approved') {
      // Check if there are more levels
      const [nextLevel] = await connection.query(
        `SELECT awl.level_id, awl.required_role
         FROM approval_workflow_levels awl
         WHERE awl.workflow_id = ? AND awl.level_order > ?
         ORDER BY awl.level_order ASC
         LIMIT 1`,
        [approval.workflow_id, approval.level_order]
      );
      
      if (nextLevel.length > 0) {
        // Move to next level
        const [nextApprovers] = await connection.query(
          `SELECT user_id 
           FROM users 
           WHERE role = ? AND status = 'active' 
           LIMIT 1`,
          [nextLevel[0].required_role]
        );
        
        const nextApproverId = nextApprovers.length > 0 ? nextApprovers[0].user_id : null;
        
        await connection.query(
          `UPDATE approvals 
           SET current_level_id = ?, 
               approver_id = ?, 
               updated_at = NOW() 
           WHERE approval_id = ?`,
          [nextLevel[0].level_id, nextApproverId, approvalId]
        );
      } else {
        // Final approval - workflow complete
        await connection.query(
          `UPDATE approvals 
           SET status = 'approved', 
               processed_at = NOW(), 
               updated_at = NOW() 
           WHERE approval_id = ?`,
          [approvalId]
        );
      }
    }
    
    await connection.commit();
    
    return await getApprovalById(approvalId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get approval history
 * @param {number} approvalId - Approval ID
 * @returns {Promise<Array>} History entries
 */
const getApprovalHistory = async (approvalId) => {
  try {
    const query = `
      SELECT 
        ah.*,
        awl.level_name,
        u.full_name as approver_name,
        u.email as approver_email
      FROM approval_history ah
      LEFT JOIN approval_workflow_levels awl ON ah.level_id = awl.level_id
      LEFT JOIN users u ON ah.approver_id = u.user_id
      WHERE ah.approval_id = ?
      ORDER BY ah.action_date ASC
    `;
    
    const [rows] = await db.query(query, [approvalId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Get pending approvals for a specific user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Pending approvals
 */
const getPendingApprovalsForUser = async (userId) => {
  try {
    const query = `
      SELECT 
        a.*,
        aw.workflow_name,
        awl.level_name,
        u_req.full_name as requested_by_name
      FROM approvals a
      LEFT JOIN approval_workflows aw ON a.workflow_id = aw.workflow_id
      LEFT JOIN approval_workflow_levels awl ON a.current_level_id = awl.level_id
      LEFT JOIN users u_req ON a.requested_by = u_req.user_id
      WHERE a.approver_id = ? AND a.status = 'pending'
      ORDER BY 
        CASE a.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        a.created_at ASC
    `;
    
    const [rows] = await db.query(query, [userId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel approval request
 * @param {number} approvalId - Approval ID
 * @param {number} userId - User ID (must be requester)
 * @returns {Promise<boolean>} Success status
 */
const cancelApproval = async (approvalId, userId) => {
  try {
    const query = `
      UPDATE approvals 
      SET status = 'cancelled', 
          updated_at = NOW() 
      WHERE approval_id = ? 
        AND requested_by = ? 
        AND status = 'pending'
    `;
    
    const [result] = await db.query(query, [approvalId, userId]);
    
    if (result.affectedRows > 0) {
      // Record in history
      await db.query(
        `INSERT INTO approval_history (
          approval_id, approver_id, action, comments
        ) VALUES (?, ?, ?, ?)`,
        [approvalId, userId, 'cancelled', 'Cancelled by requester']
      );
    }
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Get approval workflow by entity type
 * @param {string} entityType - Entity type (project, budget, equipment, etc.)
 * @returns {Promise<Object>} Workflow details
 */
const getWorkflowByEntityType = async (entityType) => {
  try {
    const query = `
      SELECT * FROM approval_workflows 
      WHERE entity_type = ? AND is_active = 1
      LIMIT 1
    `;
    
    const [rows] = await db.query(query, [entityType]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const workflow = rows[0];
    
    // Get workflow levels
    const [levels] = await db.query(
      `SELECT * FROM approval_workflow_levels 
       WHERE workflow_id = ? 
       ORDER BY level_order ASC`,
      [workflow.workflow_id]
    );
    
    workflow.levels = levels;
    
    return workflow;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllApprovals,
  getApprovalById,
  createApproval,
  processApproval,
  getApprovalHistory,
  getPendingApprovalsForUser,
  cancelApproval,
  getWorkflowByEntityType
};
