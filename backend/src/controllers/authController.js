/**
 * Authentication Controller
 * 
 * Handles authentication-related HTTP requests
 */

const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../config/logger');

/**
 * @route POST /api/v1/auth/login
 * @desc Login user with email and password
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
});

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user and revoke refresh token
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  await authService.logout(refreshToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @route POST /api/v1/auth/refresh
 * @desc Get new access token using refresh token
 * @access Public
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Refresh token is required',
      },
    });
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result,
  });
});

/**
 * @route POST /api/v1/auth/password-reset-request
 * @desc Request password reset email
 * @access Public
 */
const passwordResetRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const resetToken = await authService.requestPasswordReset(email);

  // TODO: Send email with reset token
  // For now, just log it (in production, use email service)
  if (resetToken) {
    logger.info('Password reset token (send via email):', { 
      email, 
      resetToken,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
    });
  }

  // Always return success (don't reveal if email exists)
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'If the email exists, a password reset link has been sent.',
  });
});

/**
 * @route POST /api/v1/auth/password-reset
 * @desc Reset password using reset token
 * @access Public
 */
const passwordReset = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  await authService.resetPassword(token, newPassword);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.',
  });
});

/**
 * @route POST /api/v1/auth/change-password
 * @desc Change password for authenticated user
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  await authService.changePassword(userId, currentPassword, newPassword);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  login,
  logout,
  refresh,
  passwordResetRequest,
  passwordReset,
  changePassword,
};
