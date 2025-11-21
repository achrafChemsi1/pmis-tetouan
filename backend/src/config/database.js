/**
 * Database Configuration
 * MySQL connection pool using mysql2/promise
 */

const mysql = require('mysql2/promise');
const config = require('./environment');
const logger = require('../utils/logger');

let pool;

/**
 * Create MySQL connection pool
 * @returns {Promise<mysql.Pool>} Database connection pool
 */
const createPool = async () => {
  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      connectionLimit: config.database.connectionLimit,
      waitForConnections: config.database.waitForConnections,
      queueLimit: config.database.queueLimit,
      enableKeepAlive: config.database.enableKeepAlive,
      keepAliveInitialDelay: config.database.keepAliveInitialDelay,
      // Additional optimizations
      multipleStatements: false, // Security: prevent SQL injection via multiple statements
      namedPlaceholders: true, // Allow named placeholders in queries
    });

    // Test connection
    const connection = await pool.getConnection();
    logger.info(`✅ Database connected successfully to ${config.database.database}`);
    connection.release();

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Unexpected database error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.warn('Database connection lost. Reconnecting...');
        createPool();
      }
    });

    return pool;
  } catch (error) {
    logger.error('Failed to create database pool:', error);
    throw error;
  }
};

/**
 * Get database connection pool
 * @returns {mysql.Pool} Database pool instance
 */
const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createPool() first.');
  }
  return pool;
};

/**
 * Execute a query with automatic connection handling
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error:', { sql, error: error.message });
    throw error;
  }
};

/**
 * Begin a transaction
 * @returns {Promise<mysql.PoolConnection>} Database connection with active transaction
 */
const beginTransaction = async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
};

/**
 * Close database pool gracefully
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
};

module.exports = {
  createPool,
  getPool,
  query,
  beginTransaction,
  closePool,
};
