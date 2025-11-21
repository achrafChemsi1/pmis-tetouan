/**
 * Authentication Service
 * 
 * Business logic for user authentication and authorization
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const refreshTokenModel = require('../models/refreshTokenModel');
const environment = require('../config/environment');
const { createError } = require('../middleware/errorHandler');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');
const logger = require('../config/logger');

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with tokens
 */
const login = async (email, password) => {
  try {
    // Find user by email
    const user = await userModel.findByEmail(email);
    
    if (!user) {
      logger.warn('Login failed: User not found', { email });
      throw createError(
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingTime = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      logger.warn('Login failed: Account locked', { userId: user.id, email });
      throw createError(
        `Account is locked. Please try again in ${remainingTime} minutes.`,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Check if account is active
    if (!user.is_active) {
      logger.warn('Login failed: Account inactive', { userId: user.id, email });
      throw createError(
        'Account is inactive. Please contact administrator.',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await userModel.incrementLoginAttempts(user.id);
      
      const newAttempts = (user.login_attempts || 0) + 1;
      
      // Lock account after max attempts
      if (newAttempts >= environment.security.maxLoginAttempts) {
        await userModel.lockAccount(user.id, environment.security.lockoutDuration);
        logger.warn('Account locked due to failed login attempts', { userId: user.id });
        throw createError(
          'Account locked due to too many failed login attempts. Please try again in 15 minutes.',
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED
        );
      }
      
      logger.warn('Login failed: Invalid password', { userId: user.id, attempts: newAttempts });
      throw createError(
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Reset login attempts on successful login
    await userModel.resetLoginAttempts(user.id);
    await userModel.updateLastLogin(user.id);

    // Get user roles and permissions
    const roles = await userModel.getUserRoles(user.id);
    const permissions = await userModel.getUserPermissions(user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user, roles, permissions);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date(Date.now() + environment.jwt.refreshExpiry * 1000);
    await refreshTokenModel.storeRefreshToken(user.id, refreshToken, expiresAt);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Return user data and tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: environment.jwt.expiry,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Login error:', error);
    throw createError(
      'Login failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }
};

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @param {Array} roles - User roles
 * @param {Array} permissions - User permissions
 * @returns {string} JWT token
 */
const generateAccessToken = (user, roles, permissions) => {
  const payload = {
    sub: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    roles,
    permissions,
  };

  return jwt.sign(payload, environment.jwt.secret, {
    expiresIn: environment.jwt.expiry,
  });
};

/**
 * Generate JWT refresh token
 * @param {number} userId - User ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    sub: userId,
    tokenType: 'refresh',
  };

  return jwt.sign(payload, environment.jwt.refreshSecret, {
    expiresIn: environment.jwt.refreshExpiry,
  });
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New access token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, environment.jwt.refreshSecret);
    
    if (decoded.tokenType !== 'refresh') {
      throw createError(
        'Invalid token type',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Validate token exists in database
    const isValid = await refreshTokenModel.validateRefreshToken(refreshToken);
    if (!isValid) {
      throw createError(
        'Invalid or revoked refresh token',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Get user data
    const user = await userModel.findById(decoded.sub);
    if (!user || !user.is_active) {
      throw createError(
        'User not found or inactive',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Get user roles and permissions
    const roles = await userModel.getUserRoles(user.id);
    const permissions = await userModel.getUserPermissions(user.id);

    // Generate new access token
    const accessToken = generateAccessToken(user, roles, permissions);

    logger.info('Access token refreshed', { userId: user.id });

    return {
      accessToken,
      expiresIn: environment.jwt.expiry,
    };
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Token refresh error:', error);
    throw createError(
      'Failed to refresh token',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED
    );
  }
};

/**
 * Logout user and revoke tokens
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {Promise<void>}
 */
const logout = async (refreshToken) => {
  try {
    if (refreshToken) {
      await refreshTokenModel.revokeRefreshToken(refreshToken);
    }
    logger.info('User logged out');
  } catch (error) {
    logger.error('Logout error:', error);
    // Don't throw error on logout failure
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<string>} Reset token (for email)
 */
const requestPasswordReset = async (email) => {
  try {
    const user = await userModel.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists
      logger.info('Password reset requested for non-existent email', { email });
      return null;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token in database
    await userModel.setPasswordResetToken(user.id, resetToken, expiresAt);

    logger.info('Password reset token generated', { userId: user.id, email });

    // Return token for email sending
    return resetToken;
  } catch (error) {
    logger.error('Password reset request error:', error);
    throw createError(
      'Failed to process password reset request',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }
};

/**
 * Reset password using reset token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
const resetPassword = async (token, newPassword) => {
  try {
    // Find user by token
    const user = await userModel.findByResetToken(token);
    
    if (!user) {
      logger.warn('Password reset failed: Invalid or expired token');
      throw createError(
        'Invalid or expired reset token',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, environment.security.bcryptSaltRounds);

    // Update password
    await userModel.updatePassword(user.id, passwordHash);

    // Revoke all refresh tokens for security
    await refreshTokenModel.revokeAllUserTokens(user.id);

    logger.info('Password reset successfully', { userId: user.id });
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Password reset error:', error);
    throw createError(
      'Failed to reset password',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }
};

/**
 * Change password for authenticated user
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Get user
    const user = await userModel.findByEmail(
      (await userModel.findById(userId)).email
    );
    
    if (!user) {
      throw createError(
        'User not found',
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isPasswordValid) {
      logger.warn('Password change failed: Invalid current password', { userId });
      throw createError(
        'Current password is incorrect',
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, environment.security.bcryptSaltRounds);

    // Update password
    await userModel.updatePassword(userId, passwordHash);

    logger.info('Password changed successfully', { userId });
  } catch (error) {
    if (error.statusCode) throw error;
    logger.error('Password change error:', error);
    throw createError(
      'Failed to change password',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }
};

module.exports = {
  login,
  logout,
  refreshAccessToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
};
