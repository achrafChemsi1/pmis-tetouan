/**
 * Routes Index
 * Main route aggregator - registers all route modules
 * @module routes/index
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const equipmentRoutes = require('./equipmentRoutes');
const budgetRoutes = require('./budgetRoutes');
const userRoutes = require('./userRoutes');
const approvalRoutes = require('./approvalRoutes');

/**
 * Health check endpoint
 * @route GET /health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PMIS API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API version endpoint
 * @route GET /api/version
 */
router.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    apiVersion: 'v1',
    name: 'PMIS Tétouan API',
    description: 'Project Management Information System for Prefecture of Tétouan'
  });
});

// Register route modules
router.use('/auth', authRoutes);
router.use('/api/projects', projectRoutes);
router.use('/api/equipment', equipmentRoutes);
router.use('/api/budgets', budgetRoutes);
router.use('/api/users', userRoutes);
router.use('/api/approvals', approvalRoutes);

/**
 * 404 handler for undefined routes
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
      path: req.originalUrl,
      method: req.method
    }
  });
});

module.exports = router;
