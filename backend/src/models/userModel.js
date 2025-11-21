/**
 * User Model
 * Database queries for user operations
 */

const db = require('../config/database');
const logger = require('../middleware/logger');

/**
 * Find user by email
 * @param {String} email - User email
 * @returns {Object|null} User object or null
 */
const findByEmail = async (email) => {
  const sql = `
    SELECT 
      id, email, username, password_hash as passwordHash,
      first_name as firstName, last_name as lastName,
      phone, department, employee_id as employeeId,
      is_active as isActive, last_login as lastLogin,
      login_attempts as loginAttempts, locked_until as lockedUntil,
      preferred_language as preferredLanguage,
      created_at as createdAt, updated_at as updatedAt
    FROM users
    WHERE email = ? AND deleted_at IS NULL
    LIMIT 1
  `;
  
  const rows = await db.query(sql, [email]);
  return rows[0] || null;
};

/**
 * Find user by ID
 * @param {Number} userId - User ID
 * @returns {Object|null} User object or null
 */
const findById = async (userId) => {
  const sql = `
    SELECT 
      id, email, username, password_hash as passwordHash,
      first_name as firstName, last_name as lastName,
      phone, department, employee_id as employeeId,
      is_active as isActive, last_login as lastLogin,
      login_attempts as loginAttempts, locked_until as lockedUntil,
      preferred_language as preferredLanguage,
      created_at as createdAt, updated_at as updatedAt
    FROM users
    WHERE id = ? AND deleted_at IS NULL
    LIMIT 1
  `;
  
  const rows = await db.query(sql, [userId]);
  return rows[0] || null;
};

/**
 * Get user roles
 * @param {Number} userId - User ID
 * @returns {Array<String>} Array of role names
 */
const getUserRoles = async (userId) => {
  const sql = `
    SELECT r.role_name as roleName
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = ?
  `;
  
  const rows = await db.query(sql, [userId]);
  return rows.map(row => row.roleName);
};

/**
 * Get user permissions
 * @param {Number} userId - User ID
 * @returns {Array<String>} Array of permission codes
 */
const getUserPermissions = async (userId) => {
  const sql = `
    SELECT DISTINCT p.permission_code as permissionCode
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ?
  `;
  
  const rows = await db.query(sql, [userId]);
  return rows.map(row => row.permissionCode);
};

/**
 * Increment failed login attempts
 * @param {Number} userId - User ID
 */
const incrementLoginAttempts = async (userId) => {
  const sql = `
    UPDATE users
    SET login_attempts = login_attempts + 1
    WHERE id = ?
  `;
  
  await db.query(sql, [userId]);
};

/**
 * Lock user account
 * @param {Number} userId - User ID
 * @param {Date} lockedUntil - Lock expiration date
 */
const lockAccount = async (userId, lockedUntil) => {
  const sql = `
    UPDATE users
    SET locked_until = ?
    WHERE id = ?
  `;
  
  await db.query(sql, [lockedUntil, userId]);
};

/**
 * Reset login attempts
 * @param {Number} userId - User ID
 */
const resetLoginAttempts = async (userId) => {
  const sql = `
    UPDATE users
    SET login_attempts = 0, locked_until = NULL
    WHERE id = ?
  `;
  
  await db.query(sql, [userId]);
};

/**
 * Update last login timestamp
 * @param {Number} userId - User ID
 */
const updateLastLogin = async (userId) => {
  const sql = `
    UPDATE users
    SET last_login = NOW()
    WHERE id = ?
  `;
  
  await db.query(sql, [userId]);
};

/**
 * Set password reset token
 * @param {Number} userId - User ID
 * @param {String} token - Hashed reset token
 * @param {Date} expiresAt - Token expiration
 */
const setPasswordResetToken = async (userId, token, expiresAt) => {
  const sql = `
    UPDATE users
    SET password_reset_token = ?,
        password_reset_expires = ?
    WHERE id = ?
  `;
  
  await db.query(sql, [token, expiresAt, userId]);
};

/**
 * Find user by password reset token
 * @param {String} token - Hashed reset token
 * @returns {Object|null} User object or null
 */
const findByPasswordResetToken = async (token) => {
  const sql = `
    SELECT 
      id, email, password_reset_expires as passwordResetExpires
    FROM users
    WHERE password_reset_token = ? 
      AND deleted_at IS NULL
    LIMIT 1
  `;
  
  const rows = await db.query(sql, [token]);
  return rows[0] || null;
};

/**
 * Update user password
 * @param {Number} userId - User ID
 * @param {String} passwordHash - New password hash
 */
const updatePassword = async (userId, passwordHash) => {
  const sql = `
    UPDATE users
    SET password_hash = ?,
        updated_at = NOW()
    WHERE id = ?
  `;
  
  await db.query(sql, [passwordHash, userId]);
};

/**
 * Clear password reset token
 * @param {Number} userId - User ID
 */
const clearPasswordResetToken = async (userId) => {
  const sql = `
    UPDATE users
    SET password_reset_token = NULL,
        password_reset_expires = NULL
    WHERE id = ?
  `;
  
  await db.query(sql, [userId]);
};

module.exports = {
  findByEmail,
  findById,
  getUserRoles,
  getUserPermissions,
  incrementLoginAttempts,
  lockAccount,
  resetLoginAttempts,
  updateLastLogin,
  setPasswordResetToken,
  findByPasswordResetToken,
  updatePassword,
  clearPasswordResetToken
};
