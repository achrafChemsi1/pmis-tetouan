/**
 * Environment Configuration
 * 
 * Loads and validates environment variables
 * Provides typed configuration object
 */

require('dotenv').config();

const environment = {
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'pmis_tetouan',
    poolMin: parseInt(process.env.DB_POOL_MIN) || 5,
    poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiry: parseInt(process.env.JWT_EXPIRY) || 3600, // 1 hour
    refreshExpiry: parseInt(process.env.JWT_REFRESH_EXPIRY) || 2592000, // 30 days
  },
  
  // Security
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 min
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 5,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    errorFilePath: process.env.LOG_ERROR_FILE_PATH || './logs/error.log',
  },
  
  // Swagger
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path: process.env.SWAGGER_PATH || '/api/docs',
  },
  
  // Production check
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};

// Validate required environment variables
const validateEnvironment = () => {
  const required = [
    'DB_PASSWORD',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secrets length
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
};

if (environment.nodeEnv !== 'test') {
  validateEnvironment();
}

module.exports = environment;
