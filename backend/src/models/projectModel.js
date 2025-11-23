/**
 * Project Model
 * Database queries for project operations
 */

const db = require('../config/database');
const logger = require('../middleware/logger');
const { generateCode, calculatePercentage } = require('../utils/helpers');

/**
 * Find all projects with filters, pagination, and sorting
 */
const findAll = async (filters = {}, pagination = {}, sort = {}, userId = null) => {
  const { limit = 20, offset = 0 } = pagination;
  const { sortBy = 'created_at', sortOrder = 'DESC' } = sort;
  
  // Build WHERE clause
  const conditions = ['p.deleted_at IS NULL'];
  const params = [];
  
  // Row-level security: filter by user if not admin
  if (userId) {
    conditions.push('p.project_manager_id = ?');
    params.push(userId);
  }
  
  // Status filter
  if (filters.status) {
    const statuses = filters.status.split(',');
    conditions.push(`p.status IN (${statuses.map(() => '?').join(',')})`);
    params.push(...statuses);
  }
  
  // Priority filter
  if (filters.priority) {
    const priorities = filters.priority.split(',');
    conditions.push(`p.priority IN (${priorities.map(() => '?').join(',')})`);
    params.push(...priorities);
  }
  
  // Project type filter
  if (filters.projectType) {
    conditions.push('p.project_type = ?');
    params.push(filters.projectType);
  }
  
  // Date range filters
  if (filters.createdAfter) {
    conditions.push('p.created_at >= ?');
    params.push(filters.createdAfter);
  }
  if (filters.createdBefore) {
    conditions.push('p.created_at <= ?');
    params.push(filters.createdBefore);
  }
  
  // Budget range filters
  if (filters.budgetMin) {
    conditions.push('p.estimated_budget >= ?');
    params.push(parseFloat(filters.budgetMin));
  }
  if (filters.budgetMax) {
    conditions.push('p.estimated_budget <= ?');
    params.push(parseFloat(filters.budgetMax));
  }
  
  // Full-text search
  if (filters.search) {
    conditions.push('(MATCH(p.project_name, p.description) AGAINST (? IN NATURAL LANGUAGE MODE) OR p.project_code LIKE ?)');
    params.push(filters.search, `%${filters.search}%`);
  }
  
  const whereClause = conditions.join(' AND ');
  
  // Get total count
  const countSql = `
    SELECT COUNT(*) as total
    FROM projects p
    WHERE ${whereClause}
  `;
  
  const [countResult] = await db.query(countSql, params);
  const total = countResult.total;
  
  // Get projects
  const sql = `
    SELECT 
      p.id, p.project_code as projectCode, p.project_name as projectName,
      p.description, p.project_type as projectType, p.status, p.priority,
      p.start_date as startDate, p.planned_end_date as plannedEndDate,
      p.actual_end_date as actualEndDate, p.location, p.description_location as descriptionLocation,
      p.estimated_budget as estimatedBudget, p.actual_budget as actualBudget,
      p.currency, p.budget_status as budgetStatus,
      p.completion_percentage as completionPercentage,
      p.objectives, p.key_deliverables as keyDeliverables, p.risks, p.notes,
      pm.id as projectManagerId, pm.first_name as projectManagerFirstName, pm.last_name as projectManagerLastName,
      pm.email as projectManagerEmail,
      p.created_at as createdAt, p.updated_at as updatedAt
    FROM projects p
    LEFT JOIN users pm ON p.project_manager_id = pm.id
    WHERE ${whereClause}
    ORDER BY p.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  params.push(limit, offset);
  
  const projects = await db.query(sql, params);
  
  // Format project manager
  const formattedProjects = projects.map(p => ({
    ...p,
    projectManager: p.projectManagerId ? {
      id: p.projectManagerId,
      firstName: p.projectManagerFirstName,
      lastName: p.projectManagerLastName,
      email: p.projectManagerEmail
    } : null
  }));
  
  // Remove redundant fields
  formattedProjects.forEach(p => {
    delete p.projectManagerId;
    delete p.projectManagerFirstName;
    delete p.projectManagerLastName;
    delete p.projectManagerEmail;
  });
  
  return { projects: formattedProjects, total };
};

/**
 * Find project by ID with full details
 */
const findById = async (projectId) => {
  const sql = `
    SELECT 
      p.*,
      pm.id as pm_id, pm.first_name as pm_first_name, pm.last_name as pm_last_name, pm.email as pm_email,
      am.id as am_id, am.first_name as am_first_name, am.last_name as am_last_name,
      ab.id as ab_id, ab.first_name as ab_first_name, ab.last_name as ab_last_name,
      cb.id as cb_id, cb.first_name as cb_first_name, cb.last_name as cb_last_name,
      ub.id as ub_id, ub.first_name as ub_first_name, ub.last_name as ub_last_name
    FROM projects p
    LEFT JOIN users pm ON p.project_manager_id = pm.id
    LEFT JOIN users am ON p.alternate_manager_id = am.id
    LEFT JOIN users ab ON p.approved_by = ab.id
    LEFT JOIN users cb ON p.created_by = cb.id
    LEFT JOIN users ub ON p.updated_by = ub.id
    WHERE p.id = ? AND p.deleted_at IS NULL
    LIMIT 1
  `;
  
  const rows = await db.query(sql, [projectId]);
  
  if (rows.length === 0) {
    return null;
  }
  
  const project = rows[0];
  
  // Format response
  return {
    id: project.id,
    projectCode: project.project_code,
    projectName: project.project_name,
    description: project.description,
    projectType: project.project_type,
    status: project.status,
    priority: project.priority,
    startDate: project.start_date,
    plannedEndDate: project.planned_end_date,
    actualEndDate: project.actual_end_date,
    location: project.location,
    descriptionLocation: project.description_location,
    estimatedBudget: parseFloat(project.estimated_budget),
    actualBudget: parseFloat(project.actual_budget),
    currency: project.currency,
    budgetStatus: project.budget_status,
    completionPercentage: parseFloat(project.completion_percentage),
    objectives: project.objectives,
    keyDeliverables: project.key_deliverables,
    risks: project.risks,
    notes: project.notes,
    projectManager: project.pm_id ? {
      id: project.pm_id,
      firstName: project.pm_first_name,
      lastName: project.pm_last_name,
      email: project.pm_email
    } : null,
    alternateManager: project.am_id ? {
      id: project.am_id,
      firstName: project.am_first_name,
      lastName: project.am_last_name
    } : null,
    approvedBy: project.ab_id ? {
      id: project.ab_id,
      firstName: project.ab_first_name,
      lastName: project.ab_last_name
    } : null,
    approvalDate: project.approval_date,
    createdBy: project.cb_id ? {
      id: project.cb_id,
      firstName: project.cb_first_name,
      lastName: project.cb_last_name
    } : null,
    updatedBy: project.ub_id ? {
      id: project.ub_id,
      firstName: project.ub_first_name,
      lastName: project.ub_last_name
    } : null,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  };
};

/**
 * Create new project
 */
const create = async (projectData) => {
  const sql = `
    INSERT INTO projects (
      project_name, description, project_type, priority, status,
      start_date, planned_end_date, location, description_location,
      project_manager_id, alternate_manager_id, estimated_budget, currency,
      objectives, key_deliverables, risks, notes,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?,   ?, ?, ?, ?,   ?, ?, ?, ?,   ?, ?, ?, ?,   ?, ?)
  `;
  
  const params = [
    projectData.projectName,
    projectData.description || null,
    projectData.projectType,
    projectData.priority || 'MEDIUM',
    'PLANNING',
    projectData.startDate,
    projectData.plannedEndDate,
    projectData.location || null,
    projectData.descriptionLocation || null,
    projectData.projectManagerId,
    projectData.alternateManagerId || null,
    projectData.estimatedBudget,
    projectData.currency || 'MAD',
    projectData.objectives || null,
    projectData.keyDeliverables || null,
    projectData.risks || null,
    projectData.notes || null,
    projectData.createdBy,
    projectData.updatedBy
  ];
  
  const result = await db.query(sql, params);
  const projectId = result.insertId;
  
  // Generate and update project code
  const projectCode = generateCode('PROJ', projectId);
  await db.query('UPDATE projects SET project_code = ? WHERE id = ?', [projectCode, projectId]);
  
  return projectId;
};

/**
 * Update project
 */
const update = async (projectId, projectData) => {
  const sql = `
    UPDATE projects SET
      project_name = ?, description = ?, project_type = ?, priority = ?, status = ?,
      start_date = ?, planned_end_date = ?, actual_end_date = ?, location = ?, description_location = ?,
      project_manager_id = ?, alternate_manager_id = ?, estimated_budget = ?, actual_budget = ?,
      objectives = ?, key_deliverables = ?, risks = ?, notes = ?,
      updated_by = ?, updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  const params = [
    projectData.projectName,
    projectData.description,
    projectData.projectType,
    projectData.priority,
    projectData.status,
    projectData.startDate,
    projectData.plannedEndDate,
    projectData.actualEndDate || null,
    projectData.location,
    projectData.descriptionLocation,
    projectData.projectManagerId,
    projectData.alternateManagerId || null,
    projectData.estimatedBudget,
    projectData.actualBudget || 0,
    projectData.objectives,
    projectData.keyDeliverables,
    projectData.risks,
    projectData.notes,
    projectData.updatedBy,
    projectId
  ];
  
  await db.query(sql, params);
};

/**
 * Partially update project
 */
const patch = async (projectId, updates) => {
  const allowedFields = [
    'project_name', 'description', 'project_type', 'priority', 'status',
    'start_date', 'planned_end_date', 'actual_end_date', 'location', 'description_location',
    'project_manager_id', 'alternate_manager_id', 'estimated_budget', 'actual_budget',
    'completion_percentage', 'objectives', 'key_deliverables', 'risks', 'notes'
  ];
  
  const setClauses = [];
  const params = [];
  
  Object.keys(updates).forEach(key => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (allowedFields.includes(snakeKey)) {
      setClauses.push(`${snakeKey} = ?`);
      params.push(updates[key]);
    }
  });
  
  if (setClauses.length === 0) {
    return;
  }
  
  setClauses.push('updated_by = ?', 'updated_at = NOW()');
  params.push(updates.updatedBy, projectId);
  
  const sql = `UPDATE projects SET ${setClauses.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  
  await db.query(sql, params);
};

/**
 * Soft delete project
 */
const softDelete = async (projectId, deletedBy) => {
  const sql = `
    UPDATE projects
    SET deleted_at = NOW(), updated_by = ?
    WHERE id = ?
  `;
  
  await db.query(sql, [deletedBy, projectId]);
};

/**
 * Update project status
 */
const updateStatus = async (projectId, status, actualEndDate, notes, updatedBy) => {
  const sql = `
    UPDATE projects
    SET status = ?, actual_end_date = ?, notes = ?, updated_by = ?, updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;
  
  await db.query(sql, [status, actualEndDate, notes, updatedBy, projectId]);
};

/**
 * Get budget breakdown for project
 */
const getBudgetBreakdown = async (projectId) => {
  const sql = `
    SELECT 
      id, budget_category as category,
      allocated_amount as allocated, spent_amount as spent, committed_amount as committed,
      alert_threshold_percent as alertThresholdPercent
    FROM budget_allocations
    WHERE project_id = ?
  `;
  
  const allocations = await db.query(sql, [projectId]);
  
  // Calculate totals
  const totalBudget = allocations.reduce((sum, a) => sum + parseFloat(a.allocated), 0);
  const totalSpent = allocations.reduce((sum, a) => sum + parseFloat(a.spent), 0);
  const totalCommitted = allocations.reduce((sum, a) => sum + parseFloat(a.committed), 0);
  const remaining = totalBudget - totalSpent - totalCommitted;
  const utilizationPercent = calculatePercentage(totalSpent + totalCommitted, totalBudget);
  
  // Determine status
  let status = 'ON_TRACK';
  if (utilizationPercent > 100) {
    status = 'EXCEEDED';
  } else if (utilizationPercent > 90) {
    status = 'AT_RISK';
  }
  
  // Format allocations
  const formattedAllocations = allocations.map(a => ({
    ...a,
    allocated: parseFloat(a.allocated),
    spent: parseFloat(a.spent),
    committed: parseFloat(a.committed),
    remaining: parseFloat(a.allocated) - parseFloat(a.spent) - parseFloat(a.committed),
    utilizationPercent: calculatePercentage(parseFloat(a.spent) + parseFloat(a.committed), parseFloat(a.allocated)),
    isOverThreshold: calculatePercentage(parseFloat(a.spent) + parseFloat(a.committed), parseFloat(a.allocated)) >= a.alertThresholdPercent
  }));
  
  return {
    projectId,
    totalBudget,
    totalSpent,
    totalCommitted,
    remaining,
    utilizationPercent,
    status,
    overageAmount: Math.max(0, totalSpent + totalCommitted - totalBudget),
    allocations: formattedAllocations
  };
};

/**
 * Get milestones for project
 */
const getMilestones = async (projectId) => {
  const sql = `
    SELECT 
      m.id, m.milestone_code as milestoneCode, m.title, m.description,
      m.planned_date as plannedDate, m.actual_completion_date as actualCompletionDate,
      m.status, m.completion_percentage as completionPercentage,
      m.budget_allocated as budgetAllocated, m.actual_cost as actualCost,
      m.sequence_order as sequenceOrder,
      u.id as responsibleUserId, u.first_name as responsibleUserFirstName, u.last_name as responsibleUserLastName,
      dm.id as dependsOnId, dm.title as dependsOnTitle
    FROM milestones m
    LEFT JOIN users u ON m.responsible_user_id = u.id
    LEFT JOIN milestones dm ON m.depends_on_milestone_id = dm.id
    WHERE m.project_id = ?
    ORDER BY m.sequence_order ASC
  `;
  
  const milestones = await db.query(sql, [projectId]);
  
  return milestones.map(m => ({
    id: m.id,
    milestoneCode: m.milestoneCode,
    title: m.title,
    description: m.description,
    plannedDate: m.plannedDate,
    actualCompletionDate: m.actualCompletionDate,
    status: m.status,
    completionPercentage: parseFloat(m.completionPercentage),
    budgetAllocated: parseFloat(m.budgetAllocated),
    actualCost: parseFloat(m.actualCost),
    sequenceOrder: m.sequenceOrder,
    responsibleUser: m.responsibleUserId ? {
      id: m.responsibleUserId,
      firstName: m.responsibleUserFirstName,
      lastName: m.responsibleUserLastName
    } : null,
    dependsOnMilestone: m.dependsOnId ? {
      id: m.dependsOnId,
      title: m.dependsOnTitle
    } : null
  }));
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  patch,
  softDelete,
  updateStatus,
  getBudgetBreakdown,
  getMilestones
};
