/**
 * Winston Logger Configuration
 * Provides structured logging with daily rotation
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config/environment');

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
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    }
  )
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../', config.logging.dir);

// Daily rotate file transport
const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, '%DATE%-combined.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Error log transport
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, '%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
});

// Create Winston logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    dailyRotateFileTransport,
    errorFileTransport,
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, '%DATE%-exceptions.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, '%DATE%-rejections.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// Add console transport in development
if (config.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Add console transport in production (with JSON format)
if (config.isProduction) {
  logger.add(
    new winston.transports.Console({
      format: logFormat,
    })
  );
}

module.exports = logger;
