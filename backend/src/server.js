/**
 * PMIS Tétouan - Main Server
 * Express.js application entry point
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config/environment');
const logger = require('./utils/logger');
const { createPool, closePool } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { HTTP_STATUS } = require('./config/constants');

// Import routes (to be created)
// const authRoutes = require('./routes/authRoutes');
// const projectRoutes = require('./routes/projectRoutes');
// const equipmentRoutes = require('./routes/equipmentRoutes');
// const budgetRoutes = require('./routes/budgetRoutes');
// const userRoutes = require('./routes/userRoutes');

// Create Express app
const app = express();

/**
 * Initialize application
 */
const initializeApp = async () => {
  try {
    // Initialize database connection pool
    await createPool();

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: config.isProduction,
      crossOriginEmbedderPolicy: config.isProduction,
    }));

    // CORS configuration
    app.use(cors(config.cors));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    app.use(compression());

    // HTTP request logging
    if (config.isDevelopment) {
      app.use(morgan('dev'));
    } else {
      app.use(morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      }));
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use('/api', limiter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.NODE_ENV,
          version: '1.0.0',
        },
      });
    });

    // API version info
    app.get(`${config.API_PREFIX}/${config.API_VERSION}`, (req, res) => {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          name: 'PMIS Tétouan API',
          version: config.API_VERSION,
          description: 'Project Management Information System - Backend API',
          endpoints: {
            health: '/health',
            auth: `${config.API_PREFIX}/${config.API_VERSION}/auth`,
            projects: `${config.API_PREFIX}/${config.API_VERSION}/projects`,
            equipment: `${config.API_PREFIX}/${config.API_VERSION}/equipment`,
            budgets: `${config.API_PREFIX}/${config.API_VERSION}/budgets`,
          },
        },
      });
    });

    // API Routes (uncomment when routes are created)
    // app.use(`${config.API_PREFIX}/${config.API_VERSION}/auth`, authRoutes);
    // app.use(`${config.API_PREFIX}/${config.API_VERSION}/projects`, projectRoutes);
    // app.use(`${config.API_PREFIX}/${config.API_VERSION}/equipment`, equipmentRoutes);
    // app.use(`${config.API_PREFIX}/${config.API_VERSION}/budgets`, budgetRoutes);
    // app.use(`${config.API_PREFIX}/${config.API_VERSION}/users`, userRoutes);

    // 404 handler
    app.use((req, res) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.url} not found`,
        },
      });
    });

    // Global error handler (must be last)
    app.use(errorHandler);

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 PMIS Tétouan Server started`);
      logger.info(`🌐 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 Listening on port ${config.PORT}`);
      logger.info(`📍 Base URL: http://localhost:${config.PORT}${config.API_PREFIX}/${config.API_VERSION}`);
      logger.info(`❤️  Health check: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} signal received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closePool();
          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Initialize and start the application
initializeApp();

module.exports = app;
