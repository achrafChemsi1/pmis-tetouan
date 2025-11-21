/**
 * PMIS Tétouan Backend Server
 * 
 * Main entry point for the Express.js application
 * Configures middleware, routes, and starts the server
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load environment variables
const environment = require('./config/environment');
const logger = require('./config/logger');
const { createPool, closePool } = require('./config/database');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const userRoutes = require('./routes/userRoutes');
const approvalRoutes = require('./routes/approvalRoutes');

// Create Express app
const app = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: environment.cors.origin,
  credentials: environment.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// HTTP request logging
if (environment.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// ============================================================================
// SWAGGER DOCUMENTATION
// ============================================================================

if (environment.swagger.enabled) {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'PMIS Tétouan API',
        version: '1.0.0',
        description: 'Project Management Information System API for Prefecture of Tétouan',
        contact: {
          name: 'Division d\'Équipement',
          email: 'contact@prefecture-tetouan.ma',
        },
      },
      servers: [
        {
          url: `http://localhost:${environment.port}/api/${environment.apiVersion}`,
          description: 'Development server',
        },
        {
          url: `https://api.pmis.tetouan.gov.ma/api/${environment.apiVersion}`,
          description: 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{
        bearerAuth: [],
      }],
    },
    apis: ['./src/routes/*.js'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use(environment.swagger.path, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info(`📚 Swagger documentation available at ${environment.swagger.path}`);
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: environment.nodeEnv,
      version: '1.0.0',
    },
  });
});

app.get('/api/version', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      apiVersion: environment.apiVersion,
    },
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

const API_PREFIX = `/api/${environment.apiVersion}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/equipment`, equipmentRoutes);
app.use(`${API_PREFIX}/budgets`, budgetRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/approvals`, approvalRoutes);

logger.info(`🚀 API routes registered at ${API_PREFIX}`);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

let server;

const startServer = async () => {
  try {
    // Initialize database connection
    await createPool();
    
    // Start Express server
    server = app.listen(environment.port, () => {
      logger.info('═══════════════════════════════════════════════════════');
      logger.info('🏛️  PMIS TÉTOUAN - Backend Server');
      logger.info('   Prefecture of Tétouan - Division d\'Équipement');
      logger.info('═══════════════════════════════════════════════════════');
      logger.info(`🌍 Environment: ${environment.nodeEnv}`);
      logger.info(`🚀 Server running on port ${environment.port}`);
      logger.info(`📡 API Base URL: http://localhost:${environment.port}${API_PREFIX}`);
      logger.info(`📚 Swagger Docs: http://localhost:${environment.port}${environment.swagger.path}`);
      logger.info('═══════════════════════════════════════════════════════');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close(async () => {
      logger.info('✅ HTTP server closed');
      
      try {
        await closePool();
        logger.info('✅ Database connections closed');
        logger.info('👋 Server shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
  }
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
