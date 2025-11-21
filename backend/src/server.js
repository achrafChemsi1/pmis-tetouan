/**
 * PMIS Tétouan - Main Server Entry Point
 * Prefecture of Tétouan - Division d'Équipement
 * Ministry of Interior, Morocco
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load environment variables
require('dotenv').config();

// Import configuration
const { PORT, NODE_ENV, API_VERSION, CORS_ORIGIN } = require('./config/environment');
const db = require('./config/database');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const userRoutes = require('./routes/userRoutes');
const approvalRoutes = require('./routes/approvalRoutes');

// Initialize Express app
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
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// ============================================================================
// SWAGGER API DOCUMENTATION
// ============================================================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PMIS Tétouan API',
      version: '1.0.0',
      description: 'Project Management Information System API for Prefecture of Tétouan',
      contact: {
        name: 'Division d\'Équipement',
        email: 'contact@prefecture-tetouan.ma'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/${API_VERSION}`,
        description: 'Development server'
      },
      {
        url: `https://api.pmis.tetouan.gov.ma/api/${API_VERSION}`,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(`/api/${API_VERSION}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const [rows] = await db.query('SELECT 1 as health');
    
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        database: rows[0].health === 1 ? 'connected' : 'disconnected',
        version: '1.0.0'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service is temporarily unavailable'
      }
    });
  }
});

// API version info endpoint
app.get(`/api/${API_VERSION}/version`, (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      apiVersion: API_VERSION,
      environment: NODE_ENV
    }
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

const API_PREFIX = `/api/${API_VERSION}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/equipment`, equipmentRoutes);
app.use(`${API_PREFIX}/budgets`, budgetRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/approvals`, approvalRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'PMIS Tétouan API',
      version: '1.0.0',
      documentation: `${req.protocol}://${req.get('host')}${API_PREFIX}/docs`
    }
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`
    }
  });
});

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

let server;

const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    await db.query('SELECT 1');
    logger.info('Database connection successful');
    
    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`============================================`);
      logger.info(`PMIS Tétouan Backend Server`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Base URL: http://localhost:${PORT}${API_PREFIX}`);
      logger.info(`API Documentation: http://localhost:${PORT}${API_PREFIX}/docs`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info(`============================================`);
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
      logger.info('HTTP server closed');
      
      try {
        // Close database connections
        await db.end();
        logger.info('Database connections closed');
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

module.exports = app;
