/**
 * Authentication Service
 * Business logic for authentication operations
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const logger = require('../middleware/logger');
const { createError } = require('../middleware/errorHandler');
const { 
  JWT_SECRET, 
  JWT_REFRESH_SECRET, 
  JWT_EXPIRY, 
  JWT_REFRESH_EXPIRY,
  BCRYPT_SALT_ROUNDS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  ACCOUNT_LOCK_DURATION
} = require('../config/environment');
const { HTTP_STATUS, ERROR_CODES } = require('../config/constants');

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateAccessToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    permissions: user.permissions
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'pmis-tetouan',
    audience: 'pmis-api'
  });
};

/**
 * Generate JWT refresh token
 * @param {Number} userId - User ID
 * @returns {String} Refresh token
 */
const generateRefreshToken = (userId) => {
  const payload = {
    sub: userId,
    tokenType: 'refresh'
  };
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    issuer: 'pmis-tetouan',
    audience: 'pmis-api'
  });
};

/**
 * Login user with email and password
 * @param {String} email - User email
 * @param {String} password - User password
 * @param {String} ip - IP address
 * @param {String} userAgent - User agent
 * @returns {Object} User and tokens
 */
const login = async (email, password, ip, userAgent) => {
  // Find user by email
  const user = await userModel.findByEmail(email);
  
  if (!user) {
    logger.warn('Login failed - user not found:', { email, ip });
    throw createError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED,
      'Invalid email or password'
    );
  }
  
  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingTime = Math.ceil((new Date(user.lockedUntil) - new Date()) / 1000 / 60);
    logger.warn('Login failed - account locked:', { userId: user.id, email });
    throw createError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      `Account is temporarily locked. Please try again in ${remainingTime} minutes.`
    );
  }
  
  // Check if account is active
  if (!user.isActive) {
    logger.warn('Login failed - account inactive:', { userId: user.id, email });
    throw createError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      'Account is disabled. Please contact administrator.'
    );
  }
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isPasswordValid) {
    // Increment failed login attempts
    await userModel.incrementLoginAttempts(user.id);
    
    const attempts = user.loginAttempts + 1;
    
    // Lock account if max attempts reached
    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION);
      await userModel.lockAccount(user.id, lockedUntil);
      
      logger.warn('Account locked due to failed login attempts:', { userId: user.id, email });
      throw createError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        `Account locked due to too many failed login attempts. Please try again in ${Math.ceil(ACCOUNT_LOCK_DURATION / 1000 / 60)} minutes.`
      );
    }
    
    logger.warn('Login failed - invalid password:', { email, ip, attempts });
    throw createError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED,
      `Invalid email or password. ${MAX_FAILED_LOGIN_ATTEMPTS - attempts} attempts remaining.`
    );
  }
  
  // Get user roles and permissions
  const roles = await userModel.getUserRoles(user.id);
  const permissions = await userModel.getUserPermissions(user.id);
  
  // Generate tokens
  const userWithRoles = { ...user, roles, permissions };
  const accessToken = generateAccessToken(userWithRoles);
  const refreshToken = generateRefreshToken(user.id);
  
  // Reset login attempts and update last login
  await userModel.resetLoginAttempts(user.id);
  await userModel.updateLastLogin(user.id);
  
  // Store refresh token (for future revocation support)
  // await userModel.storeRefreshToken(user.id, refreshToken);
  
  // Return user info and tokens (exclude password hash)
  const { passwordHash, ...userWithoutPassword } = user;
  
  return {
    user: {
      ...userWithoutPassword,
      roles,
      permissions
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRY
    }
  };
};

/**
 * Logout user and invalidate refresh token
 * @param {Number} userId - User ID
 * @param {String} refreshToken - Refresh token to invalidate
 */
const logout = async (userId, refreshToken) => {
  // Future: Invalidate refresh token in database or Redis
  // await userModel.revokeRefreshToken(userId, refreshToken);
  
  logger.info('User logged out:', { userId });
};

/**
 * Refresh access token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} New access token
 */
const refreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw createError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT,
      'Refresh token is required'
    );
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    if (decoded.tokenType !== 'refresh') {
      throw createError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'Invalid token type'
      );
    }
    
    // Get user with roles and permissions
    const user = await userModel.findById(decoded.sub);
    
    if (!user) {
      throw createError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'User not found'
      );
    }
    
    if (!user.isActive) {
      throw createError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        'Account is disabled'
      );
    }
    
    // Get roles and permissions
    const roles = await userModel.getUserRoles(user.id);
    const permissions = await userModel.getUserPermissions(user.id);
    
    // Generate new access token
    const userWithRoles = { ...user, roles, permissions };
    const newAccessToken = generateAccessToken(userWithRoles);
    
    return {
      accessToken: newAccessToken,
      expiresIn: JWT_EXPIRY
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw createError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'Refresh token expired. Please login again.'
      );
    }
    
    if (error.name === 'JsonWebTokenError') {
      throw createError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'Invalid refresh token'
      );
    }
    
    throw error;
  }
};

/**
 * Request password reset
 * @param {String} email - User email
 */
const requestPasswordReset = async (email) => {
  const user = await userModel.findByEmail(email);
  
  // Don't reveal if email exists (security)
  if (!user) {
    logger.info('Password reset requested for non-existent email:', { email });
    return;
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  // Store hashed token in database
  await userModel.setPasswordResetToken(user.id, hashedToken, expiresAt);
  
  // TODO: Send email with reset link
  // const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  // await emailService.sendPasswordResetEmail(user.email, resetUrl);
  
  logger.info('Password reset token generated:', { userId: user.id, email });
};

/**
 * Reset password with token
 * @param {String} token - Reset token
 * @param {String} newPassword - New password
 */
const resetPassword = async (token, newPassword) => {
  // Hash the token to match database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find user with valid reset token
  const user = await userModel.findByPasswordResetToken(hashedToken);
  
  if (!user) {
    throw createError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT,
      'Invalid or expired reset token'
    );
  }
  
  // Check if token expired
  if (new Date(user.passwordResetExpires) < new Date()) {
    throw createError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT,
      'Reset token has expired'
    );
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  
  // Update password and clear reset token
  await userModel.updatePassword(user.id, passwordHash);
  await userModel.clearPasswordResetToken(user.id);
  
  logger.info('Password reset successful:', { userId: user.id });
};

/**
 * Change password (authenticated user)
 * @param {Number} userId - User ID
 * @param {String} currentPassword - Current password
 * @param {String} newPassword - New password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Get user
  const user = await userModel.findById(userId);
  
  if (!user) {
    throw createError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      'User not found'
    );
  }
  
  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  
  if (!isPasswordValid) {
    logger.warn('Password change failed - invalid current password:', { userId });
    throw createError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED,
      'Current password is incorrect'
    );
  }
  
  // Check if new password is same as current
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  
  if (isSamePassword) {
    throw createError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_INPUT,
      'New password must be different from current password'
    );
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  
  // Update password
  await userModel.updatePassword(userId, passwordHash);
  
  logger.info('Password changed successfully:', { userId });
};

module.exports = {
  login,
  logout,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  changePassword
};
