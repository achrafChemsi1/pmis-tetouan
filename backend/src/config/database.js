/**
 * Database Configuration - MySQL Connection Pool
 * 
 * Creates and manages MySQL connection pool using mysql2/promise
 * Implements connection retry logic and error handling
 */

const mysql = require('mysql2/promise');
const logger = require('./logger');

let pool = null;

/**
 * Create MySQL connection pool
 * @returns {Promise<Pool>} MySQL connection pool
 */
const createPool = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'pmis_tetouan',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_MAX) || 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4',
      timezone: '+00:00', // UTC
      decimalNumbers: true,
    });

    // Test connection
    const connection = await pool.getConnection();
    logger.info('✅ MySQL database connected successfully');
    logger.info(`📊 Database: ${process.env.DB_NAME}`);
    logger.info(`🔗 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    connection.release();

    return pool;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

/**
 * Get existing pool or create new one
 * @returns {Promise<Pool>} MySQL connection pool
 */
const getPool = async () => {
  if (!pool) {
    await createPool();
  }
  return pool;
};

/**
 * Execute a query with automatic connection management
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
const query = async (sql, params = []) => {
  try {
    const connection = await getPool();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    logger.error('Database query error:', { sql, error: error.message });
    throw error;
  }
};

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback function
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
 * Close database connection pool
 * @returns {Promise<void>}
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    logger.info('🔌 Database connection pool closed');
    pool = null;
  }
};

module.exports = {
  createPool,
  getPool,
  query,
  transaction,
  closePool,
};
