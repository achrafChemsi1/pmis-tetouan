/**
 * Project Controller
 * Handle project-related endpoints
 */

const projectService = require('../services/projectService');
const logger = require('../middleware/logger');
const { HTTP_STATUS } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/v1/projects
 * @desc    List all projects with filtering and pagination
 * @access  Private (project_read permission)
 */
const listProjects = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    priority: req.query.priority,
    projectType: req.query.projectType,
    search: req.query.search,
    createdAfter: req.query.createdAfter,
    createdBefore: req.query.createdBefore,
    budgetMin: req.query.budgetMin,
    budgetMax: req.query.budgetMax
  };
  
  const pagination = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20
  };
  
  const sort = {
    sortBy: req.query.sortBy || 'created_at',
    sortOrder: req.query.sortOrder || 'desc'
  };
  
  const result = await projectService.listProjects(filters, pagination, sort, req.user);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

/**
 * @route   POST /api/v1/projects
 * @desc    Create new project
 * @access  Private (project_create permission)
 */
const createProject = asyncHandler(async (req, res) => {
  const projectData = req.body;
  const createdBy = req.user.id;
  
  const project = await projectService.createProject(projectData, createdBy);
  
  logger.info('Project created:', { projectId: project.id, createdBy });
  
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: project
  });
});

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get project details
 * @access  Private (project_read permission)
 */
const getProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  
  const project = await projectService.getProjectById(projectId, req.user);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: project
  });
});

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update entire project
 * @access  Private (project_update permission)
 */
const updateProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const projectData = req.body;
  const updatedBy = req.user.id;
  
  const project = await projectService.updateProject(projectId, projectData, updatedBy, req.user);
  
  logger.info('Project updated:', { projectId, updatedBy });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: project
  });
});

/**
 * @route   PATCH /api/v1/projects/:id
 * @desc    Partially update project
 * @access  Private (project_update permission)
 */
const patchProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const updates = req.body;
  const updatedBy = req.user.id;
  
  const project = await projectService.patchProject(projectId, updates, updatedBy, req.user);
  
  logger.info('Project patched:', { projectId, updatedBy });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: project
  });
});

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Soft delete project
 * @access  Private (project_delete permission)
 */
const deleteProject = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const deletedBy = req.user.id;
  
  await projectService.deleteProject(projectId, deletedBy, req.user);
  
  logger.info('Project deleted:', { projectId, deletedBy });
  
  res.status(HTTP_STATUS.NO_CONTENT).send();
});

/**
 * @route   PUT /api/v1/projects/:id/status
 * @desc    Update project status
 * @access  Private (project_update permission)
 */
const updateStatus = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const { status, actualEndDate, completionNotes } = req.body;
  const updatedBy = req.user.id;
  
  const project = await projectService.updateProjectStatus(
    projectId, 
    status, 
    actualEndDate, 
    completionNotes,
    updatedBy,
    req.user
  );
  
  logger.info('Project status updated:', { projectId, status, updatedBy });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: project
  });
});

/**
 * @route   GET /api/v1/projects/:id/budget
 * @desc    Get project budget breakdown
 * @access  Private (budget_read permission)
 */
const getProjectBudget = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  
  const budget = await projectService.getProjectBudget(projectId, req.user);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: budget
  });
});

/**
 * @route   GET /api/v1/projects/:id/milestones
 * @desc    Get project milestones
 * @access  Private (project_read permission)
 */
const getProjectMilestones = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  
  const milestones = await projectService.getProjectMilestones(projectId, req.user);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: milestones
  });
});

/**
 * @route   GET /api/v1/projects/:id/progress
 * @desc    Get project progress metrics
 * @access  Private (project_read permission)
 */
const getProjectProgress = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  
  const progress = await projectService.getProjectProgress(projectId, req.user);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: progress
  });
});

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  patchProject,
  deleteProject,
  updateStatus,
  getProjectBudget,
  getProjectMilestones,
  getProjectProgress
};
