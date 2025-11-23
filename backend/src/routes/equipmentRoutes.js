/**
 * Equipment Routes
 * Route definitions for equipment management endpoints
 * @module routes/equipmentRoutes
 */

const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateEquipment, validateAllocation, validateMaintenance } = require('../utils/validators');

/**
 * @route   GET /api/equipment
 * @desc    Get all equipment with filters and pagination
 * @access  Private
 */
router.get(
  '/',
  auth,
  equipmentController.getAllEquipment
);

/**
 * @route   GET /api/equipment/:id
 * @desc    Get equipment by ID
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  equipmentController.getEquipmentById
);

/**
 * @route   POST /api/equipment
 * @desc    Create new equipment
 * @access  Private (Admin, Equipment Manager)
 */
router.post(
  '/',
  auth,
  checkRole(['admin', 'equipment_manager']),
  validateEquipment,
  equipmentController.createEquipment
);

/**
 * @route   PUT /api/equipment/:id
 * @desc    Update equipment
 * @access  Private (Admin, Equipment Manager)
 */
router.put(
  '/:id',
  auth,
  checkRole(['admin', 'equipment_manager']),
  validateEquipment,
  equipmentController.updateEquipment
);

/**
 * @route   DELETE /api/equipment/:id
 * @desc    Delete (retire) equipment
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  auth,
  checkRole(['admin']),
  equipmentController.deleteEquipment
);

/**
 * @route   POST /api/equipment/:id/allocate
 * @desc    Allocate equipment to project
 * @access  Private (Admin, Equipment Manager, Project Manager)
 */
router.post(
  '/:id/allocate',
  auth,
  checkRole(['admin', 'equipment_manager', 'project_manager']),
  validateAllocation,
  equipmentController.allocateEquipment
);

/**
 * @route   POST /api/equipment/:id/return
 * @desc    Return equipment from project
 * @access  Private (Admin, Equipment Manager, Project Manager)
 */
router.post(
  '/:id/return',
  auth,
  checkRole(['admin', 'equipment_manager', 'project_manager']),
  equipmentController.returnEquipment
);

/**
 * @route   POST /api/equipment/:id/maintenance
 * @desc    Record equipment maintenance
 * @access  Private (Admin, Equipment Manager)
 */
router.post(
  '/:id/maintenance',
  auth,
  checkRole(['admin', 'equipment_manager']),
  validateMaintenance,
  equipmentController.recordMaintenance
);

/**
 * @route   GET /api/equipment/:id/maintenance
 * @desc    Get equipment maintenance history
 * @access  Private
 */
router.get(
  '/:id/maintenance',
  auth,
  equipmentController.getMaintenanceHistory
);

/**
 * @route   GET /api/equipment/:id/allocations
 * @desc    Get equipment allocation history
 * @access  Private
 */
router.get(
  '/:id/allocations',
  auth,
  equipmentController.getAllocationHistory
);

/**
 * @route   GET /api/equipment/:id/depreciation
 * @desc    Calculate equipment depreciation
 * @access  Private
 */
router.get(
  '/:id/depreciation',
  auth,
  equipmentController.getDepreciation
);

module.exports = router;
