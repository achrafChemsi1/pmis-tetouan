/**
 * Authentication Controller
 * Handle authentication endpoints: login, logout, password reset, etc.
 */

const authService = require('../services/authService');
const logger = require('../middleware/logger');
const { HTTP_STATUS } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT tokens
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get('user-agent');
  
  logger.info('Login attempt:', { email, ip });
  
  const result = await authService.login(email, password, ip, userAgent);
  
  logger.info('Login successful:', { userId: result.user.id, email });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Invalidate refresh token and logout user
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { refreshToken } = req.body;
  
  await authService.logout(userId, refreshToken);
  
  logger.info('Logout successful:', { userId });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Get new access token using refresh token
 * @access  Public
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  const result = await authService.refreshToken(refreshToken);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
});

/**
 * @route   POST /api/v1/auth/password-reset-request
 * @desc    Request password reset email
 * @access  Public
 */
const passwordResetRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  await authService.requestPasswordReset(email);
  
  logger.info('Password reset requested:', { email });
  
  // Always return success to prevent email enumeration
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'If the email exists, a password reset link has been sent'
  });
});

/**
 * @route   POST /api/v1/auth/password-reset
 * @desc    Reset password with token
 * @access  Public
 */
const passwordReset = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  await authService.resetPassword(token, newPassword);
  
  logger.info('Password reset successful');
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successfully'
  });
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated users)
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  await authService.changePassword(userId, currentPassword, newPassword);
  
  logger.info('Password changed successfully:', { userId });
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  login,
  logout,
  refresh,
  passwordResetRequest,
  passwordReset,
  changePassword
};
