/**
 * Project Service
 * Business logic for project operations
 */

const projectModel = require('../models/projectModel');
const logger = require('../middleware/logger');
const { createError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES, PROJECT_STATUS } = require('../config/constants');
const { parsePagination, buildPaginationMeta, generateCode, calculatePercentage } = require('../utils/helpers');

/**
 * List all projects with filtering and pagination
 */
const listProjects = async (filters, pagination, sort, user) => {
  const { page, limit, offset } = parsePagination(pagination);
  
  // Apply row-level security: non-admins only see their projects
  const isAdmin = user.roles.includes('ADMIN');
  const userId = isAdmin ? null : user.id;
  
  const { projects, total } = await projectModel.findAll(filters, { limit, offset }, sort, userId);
  
  return {
    projects,
    pagination: buildPaginationMeta(page, limit, total)
  };
};

/**
 * Create new project
 */
const createProject = async (projectData, createdBy) => {
  // Validate dates
  if (new Date(projectData.plannedEndDate) < new Date(projectData.startDate)) {
    throw createError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      'Planned end date must be after start date'
    );
  }
  
  // Validate budget
  if (projectData.estimatedBudget <= 0) {
    throw createError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      'Estimated budget must be greater than zero'
    );
  }
  
  // Create project
  const projectId = await projectModel.create({
    ...projectData,
    createdBy,
    updatedBy: createdBy
  });
  
  // Get created project
  const project = await projectModel.findById(projectId);
  
  return project;
};

/**
 * Get project by ID
 */
const getProjectById = async (projectId, user) => {
  const project = await projectModel.findById(projectId);
  
  if (!project) {
    throw createError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      `Project with ID ${projectId} not found`
    );
  }
  
  // Check access permission (non-admins can only access their projects)
  if (!user.roles.includes('ADMIN') && project.projectManagerId !== user.id) {
    throw createError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      'You do not have permission to access this project'
    );
  }
  
  return project;
};

/**
 * Update entire project
 */
const updateProject = async (projectId, projectData, updatedBy, user) => {
  // Check if project exists and user has access
  await getProjectById(projectId, user);
  
  // Validate dates
  if (new Date(projectData.plannedEndDate) < new Date(projectData.startDate)) {
    throw createError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      'Planned end date must be after start date'
    );
  }
  
  // Update project
  await projectModel.update(projectId, {
    ...projectData,
    updatedBy
  });
  
  // Return updated project
  return await projectModel.findById(projectId);
};

/**
 * Partially update project
 */
const patchProject = async (projectId, updates, updatedBy, user) => {
  // Check if project exists and user has access
  await getProjectById(projectId, user);
  
  // Validate dates if both provided
  if (updates.plannedEndDate && updates.startDate) {
    if (new Date(updates.plannedEndDate) < new Date(updates.startDate)) {
      throw createError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ERROR,
        'Planned end date must be after start date'
      );
    }
  }
  
  // Update project
  await projectModel.patch(projectId, {
    ...updates,
    updatedBy
  });
  
  // Return updated project
  return await projectModel.findById(projectId);
};

/**
 * Soft delete project
 */
const deleteProject = async (projectId, deletedBy, user) => {
  // Check if project exists and user has access
  const project = await getProjectById(projectId, user);
  
  // Check if project can be deleted (only PLANNING or CANCELLED projects)
  if (project.status !== PROJECT_STATUS.PLANNING && project.status !== PROJECT_STATUS.CANCELLED) {
    throw createError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      'Only projects in PLANNING or CANCELLED status can be deleted'
    );
  }
  
  await projectModel.softDelete(projectId, deletedBy);
};

/**
 * Update project status
 */
const updateProjectStatus = async (projectId, status, actualEndDate, completionNotes, updatedBy, user) => {
  // Check if project exists and user has access
  await getProjectById(projectId, user);
  
  // Validate status
  const validStatuses = Object.values(PROJECT_STATUS);
  if (!validStatuses.includes(status)) {
    throw createError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    );
  }
  
  // If status is COMPLETED, require actual end date
  if (status === PROJECT_STATUS.COMPLETED && !actualEndDate) {
    throw createError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.VALIDATION_ERROR,
      'Actual end date is required when completing a project'
    );
  }
  
  // Update status
  await projectModel.updateStatus(projectId, status, actualEndDate, completionNotes, updatedBy);
  
  return await projectModel.findById(projectId);
};

/**
 * Get project budget breakdown
 */
const getProjectBudget = async (projectId, user) => {
  // Check if project exists and user has access
  await getProjectById(projectId, user);
  
  const budget = await projectModel.getBudgetBreakdown(projectId);
  
  return budget;
};

/**
 * Get project milestones
 */
const getProjectMilestones = async (projectId, user) => {
  // Check if project exists and user has access
  await getProjectById(projectId, user);
  
  const milestones = await projectModel.getMilestones(projectId);
  
  return {
    projectId,
    milestones
  };
};

/**
 * Get project progress metrics
 */
const getProjectProgress = async (projectId, user) => {
  // Check if project exists and user has access
  const project = await getProjectById(projectId, user);
  
  // Calculate timeline metrics
  const now = new Date();
  const startDate = new Date(project.startDate);
  const plannedEndDate = new Date(project.plannedEndDate);
  const totalDays = Math.ceil((plannedEndDate - startDate) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((plannedEndDate - now) / (1000 * 60 * 60 * 24));
  
  // Determine timeline status
  let timelineStatus = 'ON_TRACK';
  if (daysRemaining < 0) {
    timelineStatus = 'DELAYED';
  } else if (daysRemaining < totalDays * 0.2) {
    timelineStatus = 'AT_RISK';
  }
  
  // Get budget info
  const budget = await projectModel.getBudgetBreakdown(projectId);
  
  // Get milestone info
  const milestones = await projectModel.getMilestones(projectId);
  const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
  const totalMilestones = milestones.length;
  
  // Calculate overall health
  let overallHealth = 'GREEN';
  if (timelineStatus === 'DELAYED' || budget.budgetStatus === 'EXCEEDED') {
    overallHealth = 'RED';
  } else if (timelineStatus === 'AT_RISK' || budget.budgetStatus === 'AT_RISK') {
    overallHealth = 'YELLOW';
  }
  
  // Identify critical issues
  const criticalIssues = [];
  if (timelineStatus === 'DELAYED') {
    criticalIssues.push({
      type: 'TIMELINE_DELAY',
      severity: 'HIGH',
      message: `Project is ${Math.abs(daysRemaining)} days behind schedule`
    });
  }
  if (budget.budgetStatus === 'EXCEEDED') {
    criticalIssues.push({
      type: 'BUDGET_EXCEEDED',
      severity: 'CRITICAL',
      message: `Budget exceeded by ${budget.overageAmount.toFixed(2)} MAD`
    });
  }
  
  // Check for budget alerts per category
  if (budget.allocations) {
    budget.allocations.forEach(allocation => {
      if (allocation.isOverThreshold) {
        criticalIssues.push({
          type: 'BUDGET_ALERT',
          severity: 'HIGH',
          message: `${allocation.category} budget at ${allocation.utilizationPercent}% utilization`,
          category: allocation.category
        });
      }
    });
  }
  
  return {
    projectId,
    projectCode: project.projectCode,
    completionPercentage: project.completionPercentage,
    timelineStatus,
    budgetStatus: budget.status,
    overallHealth,
    daysElapsed,
    daysRemainingPlanned: Math.max(0, daysRemaining),
    daysRemainingActual: Math.max(0, daysRemaining),
    completedMilestones,
    totalMilestones,
    milestoneCompletionRate: totalMilestones > 0 ? calculatePercentage(completedMilestones, totalMilestones) : 0,
    budgetUtilization: budget.utilizationPercent,
    criticalIssues,
    risks: project.risks ? [{ description: project.risks, likelihood: 'UNKNOWN', impact: 'UNKNOWN' }] : []
  };
};

module.exports = {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  patchProject,
  deleteProject,
  updateProjectStatus,
  getProjectBudget,
  getProjectMilestones,
  getProjectProgress
};
