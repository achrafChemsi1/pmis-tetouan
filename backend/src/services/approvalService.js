/**
 * Approval Service
 * Business logic for approval workflows
 * @module services/approvalService
 */

const approvalModel = require('../models/approvalModel');
const logger = require('../middleware/logger');

/**
 * Get all approvals with pagination and filtering
 */
const getAllApprovals = async (page, limit, filters) => {
  try {
    const offset = (page - 1) * limit;
    
    const approvals = await approvalModel.findAll(limit, offset, filters);
    const total = await approvalModel.count(filters);

    return {
      approvals,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    };
  } catch (error) {
    logger.error('Error in getAllApprovals service:', error);
    throw error;
  }
};

/**
 * Get approval by ID
 */
const getApprovalById = async (id) => {
  try {
    return await approvalModel.findById(id);
  } catch (error) {
    logger.error('Error in getApprovalById service:', error);
    throw error;
  }
};

/**
 * Create new approval request
 */
const createApproval = async (approvalData) => {
  try {
    // Validate approval data
    validateApprovalData(approvalData);
    
    // Determine approver based on type and amount
    const approverId = await determineApprover(approvalData);
    
    const approvalToCreate = {
      ...approvalData,
      approver_id: approverId,
      status: 'pending',
      submitted_at: new Date()
    };
    
    const approvalId = await approvalModel.create(approvalToCreate);
    const approval = await approvalModel.findById(approvalId);
    
    // Send notification to approver (would integrate with notification system)
    logger.info(`Approval request ${approvalId} created and sent to approver ${approverId}`);
    
    return approval;
  } catch (error) {
    logger.error('Error in createApproval service:', error);
    throw error;
  }
};

/**
 * Approve a request
 */
const approveRequest = async (approvalId, approverId, comments) => {
  try {
    const approval = await approvalModel.findById(approvalId);
    if (!approval) {
      return null;
    }
    
    // Check if user is authorized to approve
    if (approval.approver_id !== approverId) {
      throw new Error('UNAUTHORIZED_APPROVER');
    }
    
    // Check if already processed
    if (approval.status !== 'pending') {
      throw new Error('ALREADY_PROCESSED');
    }
    
    const updateData = {
      status: 'approved',
      decision_date: new Date(),
      approver_comments: comments,
      processed_by: approverId
    };
    
    await approvalModel.update(approvalId, updateData);
    
    // Execute approval action (update related entity)
    await executeApprovalAction(approval);
    
    const updatedApproval = await approvalModel.findById(approvalId);
    
    // Send notification to requester
    logger.info(`Approval ${approvalId} approved by user ${approverId}`);
    
    return updatedApproval;
  } catch (error) {
    logger.error('Error in approveRequest service:', error);
    throw error;
  }
};

/**
 * Reject a request
 */
const rejectRequest = async (approvalId, approverId, comments) => {
  try {
    const approval = await approvalModel.findById(approvalId);
    if (!approval) {
      return null;
    }
    
    // Check if user is authorized to reject
    if (approval.approver_id !== approverId) {
      throw new Error('UNAUTHORIZED_APPROVER');
    }
    
    // Check if already processed
    if (approval.status !== 'pending') {
      throw new Error('ALREADY_PROCESSED');
    }
    
    const updateData = {
      status: 'rejected',
      decision_date: new Date(),
      approver_comments: comments,
      processed_by: approverId
    };
    
    await approvalModel.update(approvalId, updateData);
    const updatedApproval = await approvalModel.findById(approvalId);
    
    // Send notification to requester
    logger.info(`Approval ${approvalId} rejected by user ${approverId}`);
    
    return updatedApproval;
  } catch (error) {
    logger.error('Error in rejectRequest service:', error);
    throw error;
  }
};

/**
 * Cancel approval request
 */
const cancelRequest = async (approvalId, userId, reason) => {
  try {
    const approval = await approvalModel.findById(approvalId);
    if (!approval) {
      return null;
    }
    
    // Check if user is the requester or admin
    if (approval.requester_id !== userId) {
      throw new Error('UNAUTHORIZED_CANCEL');
    }
    
    // Check if already processed
    if (approval.status !== 'pending') {
      throw new Error('CANNOT_CANCEL');
    }
    
    const updateData = {
      status: 'cancelled',
      decision_date: new Date(),
      approver_comments: `Cancelled by requester. Reason: ${reason || 'No reason provided'}`,
      processed_by: userId
    };
    
    await approvalModel.update(approvalId, updateData);
    const updatedApproval = await approvalModel.findById(approvalId);
    
    logger.info(`Approval ${approvalId} cancelled by user ${userId}`);
    
    return updatedApproval;
  } catch (error) {
    logger.error('Error in cancelRequest service:', error);
    throw error;
  }
};

/**
 * Get pending approvals for a user
 */
const getPendingApprovals = async (userId, page, limit) => {
  try {
    const offset = (page - 1) * limit;
    
    const approvals = await approvalModel.findPendingByApprover(userId, limit, offset);
    const total = await approvalModel.countPendingByApprover(userId);
    
    return {
      approvals,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    };
  } catch (error) {
    logger.error('Error in getPendingApprovals service:', error);
    throw error;
  }
};

/**
 * Get approval statistics
 */
const getApprovalStats = async (userId, startDate, endDate) => {
  try {
    const stats = await approvalModel.getStatistics(userId, startDate, endDate);
    
    return {
      total: parseInt(stats.total) || 0,
      pending: parseInt(stats.pending) || 0,
      approved: parseInt(stats.approved) || 0,
      rejected: parseInt(stats.rejected) || 0,
      cancelled: parseInt(stats.cancelled) || 0,
      approval_rate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
      average_processing_time: parseFloat(stats.avg_processing_hours) || 0
    };
  } catch (error) {
    logger.error('Error in getApprovalStats service:', error);
    throw error;
  }
};

/**
 * Determine approver based on approval type and amount
 */
const determineApprover = async (approvalData) => {
  // This is a simplified version. In a real system, this would query
  // approval hierarchy rules from the database
  
  const { type, entity_type, amount } = approvalData;
  
  // Budget approvals
  if (entity_type === 'budget') {
    if (amount <= 50000) {
      // Get finance controller
      return await getApproverByRole('FINANCE_CONTROLLER');
    } else if (amount <= 200000) {
      // Get supervisor
      return await getApproverByRole('SUPERVISOR');
    } else {
      // Get admin
      return await getApproverByRole('ADMIN');
    }
  }
  
  // Procurement approvals
  if (entity_type === 'procurement') {
    if (amount <= 100000) {
      return await getApproverByRole('FINANCE_CONTROLLER');
    } else {
      return await getApproverByRole('ADMIN');
    }
  }
  
  // Project approvals
  if (entity_type === 'project') {
    return await getApproverByRole('SUPERVISOR');
  }
  
  // Default to admin
  return await getApproverByRole('ADMIN');
};

/**
 * Get approver ID by role
 */
const getApproverByRole = async (role) => {
  // This would query the users table for an active user with the specified role
  // For now, returning a placeholder
  // In production: return await userModel.findFirstByRole(role);
  return 1; // Placeholder - would be actual user ID
};

/**
 * Execute approval action (update related entity)
 */
const executeApprovalAction = async (approval) => {
  try {
    // This would update the related entity based on entity_type
    // For example, if it's a budget approval, update budget status to approved
    
    const { entity_type, entity_id } = approval;
    
    logger.info(`Executing approval action for ${entity_type} ID ${entity_id}`);
    
    // In production, this would call appropriate model methods:
    // if (entity_type === 'budget') {
    //   await budgetModel.updateStatus(entity_id, 'approved');
    // } else if (entity_type === 'procurement') {
    //   await procurementModel.updateStatus(entity_id, 'approved');
    // }
    
  } catch (error) {
    logger.error('Error executing approval action:', error);
    // Don't throw - approval is already recorded
  }
};

/**
 * Validate approval data
 */
const validateApprovalData = (data) => {
  const errors = [];
  
  if (!data.entity_type) {
    errors.push('Entity type is required');
  }
  
  if (data.entity_type && !['budget', 'procurement', 'project', 'equipment', 'other'].includes(data.entity_type)) {
    errors.push('Invalid entity type');
  }
  
  if (!data.entity_id) {
    errors.push('Entity ID is required');
  }
  
  if (!data.type) {
    errors.push('Approval type is required');
  }
  
  if (data.type && !['create', 'update', 'delete', 'budget_change', 'status_change'].includes(data.type)) {
    errors.push('Invalid approval type');
  }
  
  if (!data.title) {
    errors.push('Title is required');
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.errors = errors;
    throw error;
  }
};

module.exports = {
  getAllApprovals,
  getApprovalById,
  createApproval,
  approveRequest,
  rejectRequest,
  cancelRequest,
  getPendingApprovals,
  getApprovalStats
};
