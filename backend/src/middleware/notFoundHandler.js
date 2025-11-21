/**
 * 404 Not Found Handler
 * 
 * Handles requests to undefined routes
 */

const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../config/logger');

/**
 * Handle 404 Not Found errors
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
const notFoundHandler = (req, res) => {
  logger.warn('404 Not Found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

module.exports = notFoundHandler;
