/**
 * Logger Configuration - Winston
 * 
 * Configures Winston logger for application logging
 * Logs to console and files with appropriate formatting
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const environment = require('./environment');

// Ensure logs directory exists
const logsDir = path.dirname(environment.logging.filePath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: environment.logging.level,
  format: logFormat,
  defaultMeta: { service: 'pmis-backend' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: environment.logging.errorFilePath,
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: environment.logging.filePath,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Console logging in development
if (environment.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Console logging in production (structured JSON)
if (environment.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

module.exports = logger;
