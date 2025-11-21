/**
 * Winston Logger Configuration
 * Structured logging with file rotation
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const { LOG_LEVEL, LOG_DIR, LOG_MAX_FILES, NODE_ENV } = require('../config/environment');

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

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), LOG_DIR);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Daily rotate file transport for all logs
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'pmis-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: LOG_MAX_FILES,
  format: logFormat,
  level: LOG_LEVEL
});

// Daily rotate file transport for errors only
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'pmis-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: LOG_MAX_FILES,
  format: logFormat,
  level: 'error'
});

// Create logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports: [
    fileRotateTransport,
    errorRotateTransport
  ],
  exitOnError: false
});

// Add console transport in development
if (NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Add console transport in production (for Docker logs)
if (NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: logFormat
  }));
}

module.exports = logger;
