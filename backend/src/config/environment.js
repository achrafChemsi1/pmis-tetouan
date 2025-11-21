/**
 * Environment Configuration
 * Load and validate environment variables
 */

require('dotenv').config();

const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  API_VERSION: process.env.API_VERSION || 'v1',
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'pmis_tetouan',
  DB_POOL_SIZE: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 10000,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
  JWT_EXPIRY: parseInt(process.env.JWT_EXPIRY, 10) || 3600,
  JWT_REFRESH_EXPIRY: parseInt(process.env.JWT_REFRESH_EXPIRY, 10) || 2592000,
  
  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  MAX_FAILED_LOGIN_ATTEMPTS: parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS, 10) || 5,
  ACCOUNT_LOCK_DURATION: parseInt(process.env.ACCOUNT_LOCK_DURATION, 10) || 900000,
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  RATE_LIMIT_AUTH_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10) || 5,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || 'logs',
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || '14d',
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000'
};

// Validate required environment variables in production
if (config.NODE_ENV === 'production') {
  const requiredVars = [
    'DB_PASSWORD',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Warn about insecure defaults
  if (config.JWT_SECRET.includes('development') || config.JWT_SECRET.includes('change')) {
    throw new Error('JWT_SECRET must be changed in production!');
  }
}

module.exports = config;
