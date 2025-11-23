/**
 * Equipment Model
 * Database queries for equipment management
 * @module models/equipmentModel
 */

const db = require('../config/database');

/**
 * Get all equipment with optional filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<Array>} Equipment list
 */
const getAllEquipment = async (filters = {}, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        e.*,
        et.type_name,
        ec.category_name,
        COUNT(ea.allocation_id) as allocation_count
      FROM equipment e
      LEFT JOIN equipment_types et ON e.type_id = et.type_id
      LEFT JOIN equipment_categories ec ON e.category_id = ec.category_id
      LEFT JOIN equipment_allocations ea ON e.equipment_id = ea.equipment_id AND ea.status = 'active'
      WHERE 1=1
    `;
    
    const params = [];
    
    // Apply filters
    if (filters.status) {
      query += ' AND e.status = ?';
      params.push(filters.status);
    }
    
    if (filters.category_id) {
      query += ' AND e.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.type_id) {
      query += ' AND e.type_id = ?';
      params.push(filters.type_id);
    }
    
    if (filters.search) {
      query += ' AND (e.equipment_name LIKE ? OR e.serial_number LIKE ? OR e.model LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' GROUP BY e.equipment_id';
    query += ' ORDER BY e.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(DISTINCT e.equipment_id) as total FROM equipment e WHERE 1=1';
    const countParams = [];
    
    if (filters.status) {
      countQuery += ' AND e.status = ?';
      countParams.push(filters.status);
    }
    
    if (filters.category_id) {
      countQuery += ' AND e.category_id = ?';
      countParams.push(filters.category_id);
    }
    
    if (filters.type_id) {
      countQuery += ' AND e.type_id = ?';
      countParams.push(filters.type_id);
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
 * Get equipment by ID with detailed information
 * @param {number} equipmentId - Equipment ID
 * @returns {Promise<Object>} Equipment details
 */
const getEquipmentById = async (equipmentId) => {
  try {
    const query = `
      SELECT 
        e.*,
        et.type_name,
        ec.category_name,
        u.full_name as acquired_by_name
      FROM equipment e
      LEFT JOIN equipment_types et ON e.type_id = et.type_id
      LEFT JOIN equipment_categories ec ON e.category_id = ec.category_id
      LEFT JOIN users u ON e.acquired_by = u.user_id
      WHERE e.equipment_id = ?
    `;
    
    const [rows] = await db.query(query, [equipmentId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Create new equipment
 * @param {Object} equipmentData - Equipment data
 * @returns {Promise<Object>} Created equipment
 */
const createEquipment = async (equipmentData) => {
  try {
    const query = `
      INSERT INTO equipment (
        equipment_name, serial_number, model, manufacturer,
        type_id, category_id, acquisition_date, acquisition_cost,
        current_value, depreciation_rate, status, condition_status,
        warranty_expiry, location, notes, acquired_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      equipmentData.equipment_name,
      equipmentData.serial_number,
      equipmentData.model,
      equipmentData.manufacturer,
      equipmentData.type_id,
      equipmentData.category_id,
      equipmentData.acquisition_date,
      equipmentData.acquisition_cost,
      equipmentData.current_value || equipmentData.acquisition_cost,
      equipmentData.depreciation_rate || 0,
      equipmentData.status || 'available',
      equipmentData.condition_status || 'excellent',
      equipmentData.warranty_expiry || null,
      equipmentData.location || null,
      equipmentData.notes || null,
      equipmentData.acquired_by
    ];
    
    const [result] = await db.query(query, params);
    
    return await getEquipmentById(result.insertId);
  } catch (error) {
    throw error;
  }
};

/**
 * Update equipment
 * @param {number} equipmentId - Equipment ID
 * @param {Object} equipmentData - Updated equipment data
 * @returns {Promise<Object>} Updated equipment
 */
const updateEquipment = async (equipmentId, equipmentData) => {
  try {
    const fields = [];
    const params = [];
    
    // Build dynamic update query
    Object.keys(equipmentData).forEach(key => {
      if (equipmentData[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(equipmentData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    fields.push('updated_at = NOW()');
    params.push(equipmentId);
    
    const query = `UPDATE equipment SET ${fields.join(', ')} WHERE equipment_id = ?`;
    
    await db.query(query, params);
    
    return await getEquipmentById(equipmentId);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete equipment (soft delete)
 * @param {number} equipmentId - Equipment ID
 * @returns {Promise<boolean>} Success status
 */
const deleteEquipment = async (equipmentId) => {
  try {
    const query = `
      UPDATE equipment 
      SET status = 'retired', updated_at = NOW() 
      WHERE equipment_id = ?
    `;
    
    const [result] = await db.query(query, [equipmentId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Get equipment allocation history
 * @param {number} equipmentId - Equipment ID
 * @returns {Promise<Array>} Allocation history
 */
const getAllocationHistory = async (equipmentId) => {
  try {
    const query = `
      SELECT 
        ea.*,
        p.project_name,
        u.full_name as allocated_by_name
      FROM equipment_allocations ea
      LEFT JOIN projects p ON ea.project_id = p.project_id
      LEFT JOIN users u ON ea.allocated_by = u.user_id
      WHERE ea.equipment_id = ?
      ORDER BY ea.allocation_date DESC
    `;
    
    const [rows] = await db.query(query, [equipmentId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Get equipment maintenance history
 * @param {number} equipmentId - Equipment ID
 * @returns {Promise<Array>} Maintenance history
 */
const getMaintenanceHistory = async (equipmentId) => {
  try {
    const query = `
      SELECT 
        em.*,
        u.full_name as performed_by_name
      FROM equipment_maintenance em
      LEFT JOIN users u ON em.performed_by = u.user_id
      WHERE em.equipment_id = ?
      ORDER BY em.maintenance_date DESC
    `;
    
    const [rows] = await db.query(query, [equipmentId]);
    
    return rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Create equipment allocation
 * @param {Object} allocationData - Allocation data
 * @returns {Promise<Object>} Created allocation
 */
const createAllocation = async (allocationData) => {
  try {
    const query = `
      INSERT INTO equipment_allocations (
        equipment_id, project_id, allocation_date,
        allocated_by, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      allocationData.equipment_id,
      allocationData.project_id,
      allocationData.allocation_date || new Date(),
      allocationData.allocated_by,
      'active',
      allocationData.notes || null
    ];
    
    const [result] = await db.query(query, params);
    
    // Update equipment status
    await updateEquipment(allocationData.equipment_id, { status: 'in_use' });
    
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

/**
 * Return equipment from allocation
 * @param {number} allocationId - Allocation ID
 * @param {Object} returnData - Return data
 * @returns {Promise<boolean>} Success status
 */
const returnEquipment = async (allocationId, returnData) => {
  try {
    const query = `
      UPDATE equipment_allocations 
      SET status = 'returned', 
          return_date = ?,
          return_condition = ?,
          return_notes = ?
      WHERE allocation_id = ?
    `;
    
    const params = [
      returnData.return_date || new Date(),
      returnData.return_condition || 'good',
      returnData.return_notes || null,
      allocationId
    ];
    
    await db.query(query, params);
    
    // Get equipment_id from allocation
    const [allocation] = await db.query(
      'SELECT equipment_id FROM equipment_allocations WHERE allocation_id = ?',
      [allocationId]
    );
    
    if (allocation.length > 0) {
      // Update equipment status to available
      await updateEquipment(allocation[0].equipment_id, { 
        status: 'available',
        condition_status: returnData.return_condition || 'good'
      });
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Record equipment maintenance
 * @param {Object} maintenanceData - Maintenance data
 * @returns {Promise<number>} Maintenance ID
 */
const recordMaintenance = async (maintenanceData) => {
  try {
    const query = `
      INSERT INTO equipment_maintenance (
        equipment_id, maintenance_type, maintenance_date,
        description, cost, performed_by, next_maintenance_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      maintenanceData.equipment_id,
      maintenanceData.maintenance_type,
      maintenanceData.maintenance_date || new Date(),
      maintenanceData.description,
      maintenanceData.cost || 0,
      maintenanceData.performed_by,
      maintenanceData.next_maintenance_date || null,
      maintenanceData.notes || null
    ];
    
    const [result] = await db.query(query, params);
    
    return result.insertId;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate equipment depreciation
 * @param {number} equipmentId - Equipment ID
 * @returns {Promise<Object>} Depreciation details
 */
const calculateDepreciation = async (equipmentId) => {
  try {
    const equipment = await getEquipmentById(equipmentId);
    
    if (!equipment) {
      throw new Error('Equipment not found');
    }
    
    const acquisitionDate = new Date(equipment.acquisition_date);
    const currentDate = new Date();
    const yearsOwned = (currentDate - acquisitionDate) / (1000 * 60 * 60 * 24 * 365);
    
    const depreciationRate = equipment.depreciation_rate || 0;
    const acquisitionCost = parseFloat(equipment.acquisition_cost);
    
    // Straight-line depreciation
    const annualDepreciation = acquisitionCost * (depreciationRate / 100);
    const totalDepreciation = annualDepreciation * yearsOwned;
    const currentValue = Math.max(0, acquisitionCost - totalDepreciation);
    
    return {
      acquisition_cost: acquisitionCost,
      years_owned: yearsOwned.toFixed(2),
      depreciation_rate: depreciationRate,
      annual_depreciation: annualDepreciation.toFixed(2),
      total_depreciation: totalDepreciation.toFixed(2),
      current_value: currentValue.toFixed(2)
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getAllocationHistory,
  getMaintenanceHistory,
  createAllocation,
  returnEquipment,
  recordMaintenance,
  calculateDepreciation
};
