/**
 * Database Configuration
 * MySQL Connection Pool Setup
 */

const mysql = require('mysql2/promise');
const logger = require('../middleware/logger');
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_POOL_SIZE, DB_CONNECTION_TIMEOUT } = require('./environment');

// Create connection pool
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: DB_POOL_SIZE,
  queueLimit: 0,
  connectTimeout: DB_CONNECTION_TIMEOUT,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00', // UTC
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  multipleStatements: false, // Security: Prevent multiple statements
  namedPlaceholders: true
});

// Test connection on initialization
pool.getConnection()
  .then(connection => {
    logger.info('Database connection pool created successfully');
    logger.info(`Connected to MySQL database: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
    connection.release();
  })
  .catch(error => {
    logger.error('Failed to create database connection pool:', error);
    throw error;
  });

// Handle pool errors
pool.on('error', (error) => {
  logger.error('Database pool error:', error);
});

/**
 * Execute a database query
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
const query = async (sql, params = []) => {
  const start = Date.now();
  
  try {
    const [rows] = await pool.execute(sql, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow query detected (${duration}ms):`, {
        sql: sql.substring(0, 100),
        duration
      });
    }
    
    return rows;
  } catch (error) {
    logger.error('Database query error:', {
      error: error.message,
      sql: sql.substring(0, 100),
      params
    });
    throw error;
  }
};

/**
 * Execute a query with a transaction
 * @param {Function} callback - Transaction callback
 * @returns {Promise<any>} Transaction result
 */
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction failed:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get connection pool status
 * @returns {Object} Pool status
 */
const getPoolStatus = () => {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedConnections: pool.pool._connectionQueue.length
  };
};

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
const end = async () => {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  transaction,
  getPoolStatus,
  end
};
