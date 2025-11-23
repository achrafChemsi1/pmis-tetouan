/**
 * Project Routes
 * Define project endpoints with authentication and validation
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validation');
const { generalLimiter } = require('../middleware/rateLimiter');
const { 
  validateCreateProject,
  validateUpdateProject,
  validateProjectId,
  validatePagination
} = require('../utils/validators');
const { PERMISSIONS } = require('../config/constants');

// Apply rate limiting to all routes
router.use(generalLimiter);

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.PROJECT_READ),
  validatePagination,
  validate,
  projectController.listProjects
);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - projectType
 *               - startDate
 *               - plannedEndDate
 *               - projectManagerId
 *               - estimatedBudget
 *     responses:
 *       201:
 *         description: Project created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       422:
 *         description: Validation error
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.PROJECT_CREATE),
  validateCreateProject,
  validate,
  projectController.createProject
);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project details
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.PROJECT_READ),
  validateProjectId,
  validate,
  projectController.getProject
);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update entire project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 *       422:
 *         description: Validation error
 */
router.put(
  '/:id',
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validateUpdateProject,
  validate,
  projectController.updateProject
);

/**
 * @swagger
 * /projects/{id}:
 *   patch:
 *     summary: Partially update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 */
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validateProjectId,
  validate,
  projectController.patchProject
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PROJECT_DELETE),
  validateProjectId,
  validate,
  projectController.deleteProject
);

/**
 * @swagger
 * /projects/{id}/status:
 *   put:
 *     summary: Update project status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put(
  '/:id/status',
  requirePermission(PERMISSIONS.PROJECT_UPDATE),
  validateProjectId,
  validate,
  projectController.updateStatus
);

/**
 * @swagger
 * /projects/{id}/budget:
 *   get:
 *     summary: Get project budget breakdown
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Budget breakdown
 */
router.get(
  '/:id/budget',
  requirePermission(PERMISSIONS.BUDGET_READ),
  validateProjectId,
  validate,
  projectController.getProjectBudget
);

/**
 * @swagger
 * /projects/{id}/milestones:
 *   get:
 *     summary: Get project milestones
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project milestones
 */
router.get(
  '/:id/milestones',
  requirePermission(PERMISSIONS.PROJECT_READ),
  validateProjectId,
  validate,
  projectController.getProjectMilestones
);

/**
 * @swagger
 * /projects/{id}/progress:
 *   get:
 *     summary: Get project progress metrics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Progress metrics
 */
router.get(
  '/:id/progress',
  requirePermission(PERMISSIONS.PROJECT_READ),
  validateProjectId,
  validate,
  projectController.getProjectProgress
);

module.exports = router;
