/**
 * User Model
 * 
 * Database queries for user-related operations
 */

const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
const findByEmail = async (email) => {
  const sql = `
    SELECT 
      u.id, u.email, u.username, u.password_hash,
      u.first_name, u.last_name, u.phone, u.department,
      u.is_active, u.login_attempts, u.locked_until,
      u.preferred_language, u.last_login
    FROM users u
    WHERE u.email = ? AND u.deleted_at IS NULL
    LIMIT 1
  `;
  
  const results = await query(sql, [email]);
  return results.length > 0 ? results[0] : null;
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const findById = async (id) => {
  const sql = `
    SELECT 
      u.id, u.email, u.username,
      u.first_name, u.last_name, u.phone, u.department,
      u.employee_id, u.is_active, u.preferred_language,
      u.last_login, u.created_at, u.updated_at
    FROM users u
    WHERE u.id = ? AND u.deleted_at IS NULL
    LIMIT 1
  `;
  
  const results = await query(sql, [id]);
  return results.length > 0 ? results[0] : null;
};

/**
 * Get user roles
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of role names
 */
const getUserRoles = async (userId) => {
  const sql = `
    SELECT r.role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `;
  
  const results = await query(sql, [userId]);
  return results.map(row => row.role_name);
};

/**
 * Get user permissions
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of permission codes
 */
const getUserPermissions = async (userId) => {
  const sql = `
    SELECT DISTINCT p.permission_code
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ?
  `;
  
  const results = await query(sql, [userId]);
  return results.map(row => row.permission_code);
};

/**
 * Update last login timestamp
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const updateLastLogin = async (userId) => {
  const sql = `
    UPDATE users
    SET last_login = NOW(), login_attempts = 0
    WHERE id = ?
  `;
  
  await query(sql, [userId]);
};

/**
 * Increment failed login attempts
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const incrementLoginAttempts = async (userId) => {
  const sql = `
    UPDATE users
    SET login_attempts = login_attempts + 1
    WHERE id = ?
  `;
  
  await query(sql, [userId]);
};

/**
 * Lock user account
 * @param {number} userId - User ID
 * @param {number} durationMs - Lock duration in milliseconds
 * @returns {Promise<void>}
 */
const lockAccount = async (userId, durationMs) => {
  const sql = `
    UPDATE users
    SET locked_until = DATE_ADD(NOW(), INTERVAL ? SECOND)
    WHERE id = ?
  `;
  
  const durationSeconds = Math.floor(durationMs / 1000);
  await query(sql, [durationSeconds, userId]);
  
  logger.warn('User account locked due to failed login attempts', { userId });
};

/**
 * Reset login attempts
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
const resetLoginAttempts = async (userId) => {
  const sql = `
    UPDATE users
    SET login_attempts = 0, locked_until = NULL
    WHERE id = ?
  `;
  
  await query(sql, [userId]);
};

/**
 * Set password reset token
 * @param {number} userId - User ID
 * @param {string} token - Reset token
 * @param {Date} expiresAt - Token expiration
 * @returns {Promise<void>}
 */
const setPasswordResetToken = async (userId, token, expiresAt) => {
  const sql = `
    UPDATE users
    SET password_reset_token = ?, password_reset_expires = ?
    WHERE id = ?
  `;
  
  await query(sql, [token, expiresAt, userId]);
};

/**
 * Find user by reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} User object or null
 */
const findByResetToken = async (token) => {
  const sql = `
    SELECT id, email, password_reset_expires
    FROM users
    WHERE password_reset_token = ? 
      AND password_reset_expires > NOW()
      AND deleted_at IS NULL
    LIMIT 1
  `;
  
  const results = await query(sql, [token]);
  return results.length > 0 ? results[0] : null;
};

/**
 * Update user password
 * @param {number} userId - User ID
 * @param {string} passwordHash - New password hash
 * @returns {Promise<void>}
 */
const updatePassword = async (userId, passwordHash) => {
  const sql = `
    UPDATE users
    SET password_hash = ?,
        password_reset_token = NULL,
        password_reset_expires = NULL,
        updated_at = NOW()
    WHERE id = ?
  `;
  
  await query(sql, [passwordHash, userId]);
};

/**
 * Check if user is admin
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if user is admin
 */
const isAdmin = async (userId) => {
  const roles = await getUserRoles(userId);
  return roles.includes('ADMIN');
};

module.exports = {
  findByEmail,
  findById,
  getUserRoles,
  getUserPermissions,
  updateLastLogin,
  incrementLoginAttempts,
  lockAccount,
  resetLoginAttempts,
  setPasswordResetToken,
  findByResetToken,
  updatePassword,
  isAdmin,
};
