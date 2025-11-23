/**
 * Approval Controller
 * Handles HTTP requests for approval workflows
 * @module controllers/approvalController
 */

const approvalService = require('../services/approvalService');
const { validationResult } = require('express-validator');
const logger = require('../middleware/logger');

/**
 * Get all approvals with pagination and filtering
 * @route GET /api/approvals
 * @access Private
 */
const getAllApprovals = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      type, 
      entityType,
      approverId,
      requesterId 
    } = req.query;
    
    const filters = {
      status,
      type,
      entityType,
      approverId: approverId ? parseInt(approverId) : undefined,
      requesterId: requesterId ? parseInt(requesterId) : undefined
    };

    // Non-admins can only see their own approvals or those they need to approve
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      filters.userId = req.user.id;
    }

    const result = await approvalService.getAllApprovals(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.status(200).json({
      success: true,
      data: result.approvals,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        itemsPerPage: result.itemsPerPage
      }
    });
  } catch (error) {
    logger.error('Error in getAllApprovals:', error);
    next(error);
  }
};

/**
 * Get approval by ID
 * @route GET /api/approvals/:id
 * @access Private
 */
const getApprovalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const approval = await approvalService.getApprovalById(parseInt(id));

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPROVAL_NOT_FOUND',
          message: 'Approval not found'
        }
      });
    }

    // Check authorization
    if (
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'SUPERVISOR' &&
      approval.requester_id !== req.user.id &&
      approval.approver_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this approval'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: approval
    });
  } catch (error) {
    logger.error('Error in getApprovalById:', error);
    next(error);
  }
};

/**
 * Create new approval request
 * @route POST /api/approvals
 * @access Private
 */
const createApproval = async (req, res, next) => {
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

    const approvalData = {
      ...req.body,
      requester_id: req.user.id
    };

    const approval = await approvalService.createApproval(approvalData);

    logger.info(`Approval request created: ${approval.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: approval,
      message: 'Approval request created successfully'
    });
  } catch (error) {
    logger.error('Error in createApproval:', error);
    next(error);
  }
};

/**
 * Approve a request
 * @route POST /api/approvals/:id/approve
 * @access Private
 */
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const approval = await approvalService.approveRequest(
      parseInt(id),
      req.user.id,
      comments
    );

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPROVAL_NOT_FOUND',
          message: 'Approval not found'
        }
      });
    }

    logger.info(`Approval approved: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: approval,
      message: 'Request approved successfully'
    });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED_APPROVER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to approve this request'
        }
      });
    }
    if (error.message === 'ALREADY_PROCESSED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_PROCESSED',
          message: 'This approval has already been processed'
        }
      });
    }
    logger.error('Error in approveRequest:', error);
    next(error);
  }
};

/**
 * Reject a request
 * @route POST /api/approvals/:id/reject
 * @access Private
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COMMENTS_REQUIRED',
          message: 'Comments are required when rejecting a request'
        }
      });
    }

    const approval = await approvalService.rejectRequest(
      parseInt(id),
      req.user.id,
      comments
    );

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPROVAL_NOT_FOUND',
          message: 'Approval not found'
        }
      });
    }

    logger.info(`Approval rejected: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: approval,
      message: 'Request rejected successfully'
    });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED_APPROVER') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to reject this request'
        }
      });
    }
    if (error.message === 'ALREADY_PROCESSED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_PROCESSED',
          message: 'This approval has already been processed'
        }
      });
    }
    logger.error('Error in rejectRequest:', error);
    next(error);
  }
};

/**
 * Cancel approval request
 * @route POST /api/approvals/:id/cancel
 * @access Private
 */
const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const approval = await approvalService.cancelRequest(
      parseInt(id),
      req.user.id,
      reason
    );

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPROVAL_NOT_FOUND',
          message: 'Approval not found'
        }
      });
    }

    logger.info(`Approval cancelled: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: approval,
      message: 'Request cancelled successfully'
    });
  } catch (error) {
    if (error.message === 'UNAUTHORIZED_CANCEL') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to cancel this request'
        }
      });
    }
    if (error.message === 'CANNOT_CANCEL') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Cannot cancel an already processed request'
        }
      });
    }
    logger.error('Error in cancelRequest:', error);
    next(error);
  }
};

/**
 * Get pending approvals for current user
 * @route GET /api/approvals/pending
 * @access Private
 */
const getPendingApprovals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await approvalService.getPendingApprovals(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result.approvals,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }
    });
  } catch (error) {
    logger.error('Error in getPendingApprovals:', error);
    next(error);
  }
};

/**
 * Get approval statistics
 * @route GET /api/approvals/stats
 * @access Private (ADMIN, SUPERVISOR)
 */
const getApprovalStats = async (req, res, next) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const stats = await approvalService.getApprovalStats(
      userId ? parseInt(userId) : undefined,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error in getApprovalStats:', error);
    next(error);
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
