/**
 * Equipment Service
 * Business logic for equipment management
 * @module services/equipmentService
 */

const equipmentModel = require('../models/equipmentModel');
const logger = require('../middleware/logger');

/**
 * Get all equipment with pagination and filtering
 */
const getAllEquipment = async (page, limit, filters) => {
  try {
    const offset = (page - 1) * limit;
    
    const equipment = await equipmentModel.findAll(limit, offset, filters);
    const total = await equipmentModel.count(filters);

    return {
      equipment,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    };
  } catch (error) {
    logger.error('Error in getAllEquipment service:', error);
    throw error;
  }
};

/**
 * Get equipment by ID with full details
 */
const getEquipmentById = async (id) => {
  try {
    const equipment = await equipmentModel.findById(id);
    
    if (equipment) {
      // Calculate depreciation
      equipment.depreciation = calculateDepreciation(
        equipment.purchase_price,
        equipment.purchase_date,
        equipment.useful_life_years
      );
      
      // Get current allocation if any
      equipment.currentAllocation = await equipmentModel.getCurrentAllocation(id);
    }
    
    return equipment;
  } catch (error) {
    logger.error('Error in getEquipmentById service:', error);
    throw error;
  }
};

/**
 * Create new equipment
 */
const createEquipment = async (equipmentData) => {
  try {
    // Validate equipment data
    validateEquipmentData(equipmentData);
    
    const equipmentId = await equipmentModel.create(equipmentData);
    const equipment = await equipmentModel.findById(equipmentId);
    
    return equipment;
  } catch (error) {
    logger.error('Error in createEquipment service:', error);
    throw error;
  }
};

/**
 * Update equipment
 */
const updateEquipment = async (id, updateData) => {
  try {
    // Check if equipment exists
    const existing = await equipmentModel.findById(id);
    if (!existing) {
      return null;
    }
    
    // Validate update data
    if (updateData.name || updateData.type || updateData.status) {
      validateEquipmentData(updateData, true);
    }
    
    await equipmentModel.update(id, updateData);
    const equipment = await equipmentModel.findById(id);
    
    return equipment;
  } catch (error) {
    logger.error('Error in updateEquipment service:', error);
    throw error;
  }
};

/**
 * Delete equipment (soft delete)
 */
const deleteEquipment = async (id, userId) => {
  try {
    const existing = await equipmentModel.findById(id);
    if (!existing) {
      return null;
    }
    
    // Check if equipment is currently allocated
    const allocation = await equipmentModel.getCurrentAllocation(id);
    if (allocation) {
      throw new Error('Cannot delete equipment that is currently allocated to a project');
    }
    
    await equipmentModel.softDelete(id, userId);
    return true;
  } catch (error) {
    logger.error('Error in deleteEquipment service:', error);
    throw error;
  }
};

/**
 * Allocate equipment to a project
 */
const allocateEquipment = async (equipmentId, projectId, startDate, endDate, userId, notes) => {
  try {
    // Check if equipment exists and is available
    const equipment = await equipmentModel.findById(equipmentId);
    if (!equipment) {
      throw new Error('Equipment not found');
    }
    
    if (equipment.status !== 'available') {
      throw new Error('Equipment is not available for allocation');
    }
    
    // Check for overlapping allocations
    const overlapping = await equipmentModel.checkOverlappingAllocation(
      equipmentId,
      startDate,
      endDate
    );
    
    if (overlapping) {
      throw new Error('Equipment is already allocated for the specified period');
    }
    
    // Create allocation
    const allocationId = await equipmentModel.createAllocation({
      equipment_id: equipmentId,
      project_id: projectId,
      allocation_date: startDate,
      expected_return_date: endDate,
      allocated_by: userId,
      notes
    });
    
    // Update equipment status
    await equipmentModel.update(equipmentId, { 
      status: 'in_use',
      current_project_id: projectId,
      updated_by: userId
    });
    
    const allocation = await equipmentModel.getAllocationById(allocationId);
    return allocation;
  } catch (error) {
    logger.error('Error in allocateEquipment service:', error);
    throw error;
  }
};

/**
 * Return equipment from project
 */
const returnEquipment = async (equipmentId, returnDate, condition, userId, notes) => {
  try {
    // Get current allocation
    const allocation = await equipmentModel.getCurrentAllocation(equipmentId);
    if (!allocation) {
      throw new Error('Equipment is not currently allocated');
    }
    
    // Update allocation with return information
    await equipmentModel.updateAllocation(allocation.id, {
      actual_return_date: returnDate,
      return_condition: condition,
      return_notes: notes
    });
    
    // Update equipment status based on condition
    let newStatus = 'available';
    if (condition === 'damaged' || condition === 'needs_repair') {
      newStatus = 'maintenance';
    }
    
    await equipmentModel.update(equipmentId, {
      status: newStatus,
      current_project_id: null,
      updated_by: userId
    });
    
    return await equipmentModel.findById(equipmentId);
  } catch (error) {
    logger.error('Error in returnEquipment service:', error);
    throw error;
  }
};

/**
 * Record equipment maintenance
 */
const recordMaintenance = async (equipmentId, maintenanceData) => {
  try {
    const equipment = await equipmentModel.findById(equipmentId);
    if (!equipment) {
      throw new Error('Equipment not found');
    }
    
    const maintenanceId = await equipmentModel.createMaintenance({
      equipment_id: equipmentId,
      ...maintenanceData
    });
    
    // Update equipment status if maintenance is scheduled or in progress
    if (maintenanceData.status === 'scheduled' || maintenanceData.status === 'in_progress') {
      await equipmentModel.update(equipmentId, {
        status: 'maintenance',
        updated_by: maintenanceData.performed_by
      });
    } else if (maintenanceData.status === 'completed') {
      await equipmentModel.update(equipmentId, {
        status: 'available',
        last_maintenance_date: maintenanceData.maintenance_date,
        updated_by: maintenanceData.performed_by
      });
    }
    
    return await equipmentModel.getMaintenanceById(maintenanceId);
  } catch (error) {
    logger.error('Error in recordMaintenance service:', error);
    throw error;
  }
};

/**
 * Get equipment maintenance history
 */
const getMaintenanceHistory = async (equipmentId, page, limit) => {
  try {
    const offset = (page - 1) * limit;
    
    const maintenance = await equipmentModel.getMaintenanceHistory(equipmentId, limit, offset);
    const total = await equipmentModel.countMaintenance(equipmentId);
    
    return {
      maintenance,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    };
  } catch (error) {
    logger.error('Error in getMaintenanceHistory service:', error);
    throw error;
  }
};

/**
 * Get equipment allocation history
 */
const getAllocationHistory = async (equipmentId) => {
  try {
    return await equipmentModel.getAllocationHistory(equipmentId);
  } catch (error) {
    logger.error('Error in getAllocationHistory service:', error);
    throw error;
  }
};

/**
 * Calculate equipment depreciation
 */
const calculateDepreciation = (purchasePrice, purchaseDate, usefulLifeYears) => {
  if (!purchasePrice || !purchaseDate || !usefulLifeYears) {
    return null;
  }
  
  const yearsSincePurchase = (new Date() - new Date(purchaseDate)) / (365.25 * 24 * 60 * 60 * 1000);
  const annualDepreciation = purchasePrice / usefulLifeYears;
  const totalDepreciation = Math.min(annualDepreciation * yearsSincePurchase, purchasePrice);
  const currentValue = Math.max(purchasePrice - totalDepreciation, 0);
  
  return {
    purchase_price: purchasePrice,
    annual_depreciation: annualDepreciation,
    total_depreciation: totalDepreciation,
    current_value: currentValue,
    depreciation_percentage: (totalDepreciation / purchasePrice) * 100
  };
};

/**
 * Validate equipment data
 */
const validateEquipmentData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate && !data.name) {
    errors.push('Equipment name is required');
  }
  
  if (!isUpdate && !data.type) {
    errors.push('Equipment type is required');
  }
  
  if (data.type && !['vehicle', 'machinery', 'tool', 'electronics', 'furniture', 'other'].includes(data.type)) {
    errors.push('Invalid equipment type');
  }
  
  if (data.status && !['available', 'in_use', 'maintenance', 'retired', 'damaged'].includes(data.status)) {
    errors.push('Invalid equipment status');
  }
  
  if (data.purchase_price && data.purchase_price < 0) {
    errors.push('Purchase price cannot be negative');
  }
  
  if (data.useful_life_years && data.useful_life_years <= 0) {
    errors.push('Useful life must be greater than 0');
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.errors = errors;
    throw error;
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
  getAllocationHistory,
  calculateDepreciation
};
