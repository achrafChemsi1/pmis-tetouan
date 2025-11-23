/**
 * Equipment Controller
 * Handles HTTP requests for equipment management
 * @module controllers/equipmentController
 */

const equipmentService = require('../services/equipmentService');
const { validationResult } = require('express-validator');
const logger = require('../middleware/logger');

/**
 * Get all equipment with pagination and filtering
 * @route GET /api/equipment
 * @access Private
 */
const getAllEquipment = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, available, projectId } = req.query;
    
    const filters = {
      status,
      type,
      available: available === 'true' ? true : available === 'false' ? false : undefined,
      projectId
    };

    const result = await equipmentService.getAllEquipment(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.status(200).json({
      success: true,
      data: result.equipment,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
        itemsPerPage: result.itemsPerPage
      }
    });
  } catch (error) {
    logger.error('Error in getAllEquipment:', error);
    next(error);
  }
};

/**
 * Get equipment by ID with full details
 * @route GET /api/equipment/:id
 * @access Private
 */
const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await equipmentService.getEquipmentById(parseInt(id));

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'Equipment not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: equipment
    });
  } catch (error) {
    logger.error('Error in getEquipmentById:', error);
    next(error);
  }
};

/**
 * Create new equipment
 * @route POST /api/equipment
 * @access Private (ADMIN, EQUIPMENT_OFFICER)
 */
const createEquipment = async (req, res, next) => {
  try {
    // Validation errors check
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

    const equipmentData = {
      ...req.body,
      created_by: req.user.id
    };

    const equipment = await equipmentService.createEquipment(equipmentData);

    logger.info(`Equipment created: ${equipment.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: equipment,
      message: 'Equipment created successfully'
    });
  } catch (error) {
    logger.error('Error in createEquipment:', error);
    next(error);
  }
};

/**
 * Update equipment
 * @route PUT /api/equipment/:id
 * @access Private (ADMIN, EQUIPMENT_OFFICER)
 */
const updateEquipment = async (req, res, next) => {
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

    const equipment = await equipmentService.updateEquipment(parseInt(id), updateData);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'Equipment not found'
        }
      });
    }

    logger.info(`Equipment updated: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: equipment,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateEquipment:', error);
    next(error);
  }
};

/**
 * Delete equipment (soft delete)
 * @route DELETE /api/equipment/:id
 * @access Private (ADMIN, EQUIPMENT_OFFICER)
 */
const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await equipmentService.deleteEquipment(parseInt(id), req.user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'Equipment not found'
        }
      });
    }

    logger.info(`Equipment deleted: ${id} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteEquipment:', error);
    next(error);
  }
};

/**
 * Allocate equipment to a project
 * @route POST /api/equipment/:id/allocate
 * @access Private (ADMIN, EQUIPMENT_OFFICER, PROJECT_MANAGER)
 */
const allocateEquipment = async (req, res, next) => {
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
    const { projectId, startDate, endDate, notes } = req.body;

    const allocation = await equipmentService.allocateEquipment(
      parseInt(id),
      parseInt(projectId),
      startDate,
      endDate,
      req.user.id,
      notes
    );

    logger.info(`Equipment ${id} allocated to project ${projectId} by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: allocation,
      message: 'Equipment allocated successfully'
    });
  } catch (error) {
    logger.error('Error in allocateEquipment:', error);
    next(error);
  }
};

/**
 * Return equipment from project
 * @route POST /api/equipment/:id/return
 * @access Private (ADMIN, EQUIPMENT_OFFICER, PROJECT_MANAGER)
 */
const returnEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { returnDate, condition, notes } = req.body;

    const result = await equipmentService.returnEquipment(
      parseInt(id),
      returnDate,
      condition,
      req.user.id,
      notes
    );

    logger.info(`Equipment ${id} returned by user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Equipment returned successfully'
    });
  } catch (error) {
    logger.error('Error in returnEquipment:', error);
    next(error);
  }
};

/**
 * Record equipment maintenance
 * @route POST /api/equipment/:id/maintenance
 * @access Private (ADMIN, EQUIPMENT_OFFICER)
 */
const recordMaintenance = async (req, res, next) => {
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
    const maintenanceData = {
      ...req.body,
      performed_by: req.user.id
    };

    const maintenance = await equipmentService.recordMaintenance(
      parseInt(id),
      maintenanceData
    );

    logger.info(`Maintenance recorded for equipment ${id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: maintenance,
      message: 'Maintenance recorded successfully'
    });
  } catch (error) {
    logger.error('Error in recordMaintenance:', error);
    next(error);
  }
};

/**
 * Get equipment maintenance history
 * @route GET /api/equipment/:id/maintenance
 * @access Private
 */
const getMaintenanceHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await equipmentService.getMaintenanceHistory(
      parseInt(id),
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: result.maintenance,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalItems
      }
    });
  } catch (error) {
    logger.error('Error in getMaintenanceHistory:', error);
    next(error);
  }
};

/**
 * Get equipment allocation history
 * @route GET /api/equipment/:id/allocations
 * @access Private
 */
const getAllocationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocations = await equipmentService.getAllocationHistory(parseInt(id));

    res.status(200).json({
      success: true,
      data: allocations
    });
  } catch (error) {
    logger.error('Error in getAllocationHistory:', error);
    next(error);
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  allocateEquipment,
  returnEquipment,
  recordMaintenance,
  getMaintenanceHistory,
  getAllocationHistory
};
