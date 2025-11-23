/**
 * Approval Routes
 * Route definitions for approval workflow endpoints
 * @module routes/approvalRoutes
 */

const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateApproval, validateApprovalAction } = require('../utils/validators');

/**
 * @route   GET /api/approvals
 * @desc    Get all approvals with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  auth,
  approvalController.getAllApprovals
);

/**
 * @route   GET /api/approvals/:id
 * @desc    Get approval by ID
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  approvalController.getApprovalById
);

/**
 * @route   POST /api/approvals
 * @desc    Create new approval request
 * @access  Private
 */
router.post(
  '/',
  auth,
  validateApproval,
  approvalController.createApproval
);

/**
 * @route   POST /api/approvals/:id/approve
 * @desc    Approve an approval request
 * @access  Private
 */
router.post(
  '/:id/approve',
  auth,
  validateApprovalAction,
  approvalController.approveRequest
);

/**
 * @route   POST /api/approvals/:id/reject
 * @desc    Reject an approval request
 * @access  Private
 */
router.post(
  '/:id/reject',
  auth,
  validateApprovalAction,
  approvalController.rejectRequest
);

/**
 * @route   POST /api/approvals/:id/cancel
 * @desc    Cancel an approval request
 * @access  Private (Request creator only)
 */
router.post(
  '/:id/cancel',
  auth,
  approvalController.cancelApproval
);

/**
 * @route   GET /api/approvals/:id/history
 * @desc    Get approval history
 * @access  Private
 */
router.get(
  '/:id/history',
  auth,
  approvalController.getApprovalHistory
);

/**
 * @route   GET /api/approvals/pending/me
 * @desc    Get pending approvals for current user
 * @access  Private
 */
router.get(
  '/pending/me',
  auth,
  approvalController.getPendingApprovals
);

/**
 * @route   GET /api/approvals/workflows/:entityType
 * @desc    Get approval workflow for entity type
 * @access  Private
 */
router.get(
  '/workflows/:entityType',
  auth,
  approvalController.getWorkflowByEntityType
);

module.exports = router;
