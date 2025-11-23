/**
 * User Service
 * Business logic for user management
 * @module services/userService
 */

const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const logger = require('../middleware/logger');

/**
 * Get all users with pagination and filtering
 */
const getAllUsers = async (page, limit, filters) => {
  try {
    const offset = (page - 1) * limit;
    
    const users = await userModel.findAll(limit, offset, filters);
    const total = await userModel.count(filters);

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      users: sanitizedUsers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    };
  } catch (error) {
    logger.error('Error in getAllUsers service:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  try {
    const user = await userModel.findById(id);
    
    if (user) {
      // Remove sensitive data
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    
    return null;
  } catch (error) {
    logger.error('Error in getUserById service:', error);
    throw error;
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  try {
    return await userModel.findByEmail(email);
  } catch (error) {
    logger.error('Error in getUserByEmail service:', error);
    throw error;
  }
};

/**
 * Get user by username
 */
const getUserByUsername = async (username) => {
  try {
    return await userModel.findByUsername(username);
  } catch (error) {
    logger.error('Error in getUserByUsername service:', error);
    throw error;
  }
};

/**
 * Create new user
 */
const createUser = async (userData) => {
  try {
    // Validate user data
    validateUserData(userData);
    
    // Check if email already exists
    const existingEmail = await userModel.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }
    
    // Check if username already exists
    const existingUsername = await userModel.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(userData.password, salt);
    
    const userToCreate = {
      ...userData,
      password_hash,
      status: userData.status || 'active'
    };
    
    delete userToCreate.password;
    
    const userId = await userModel.create(userToCreate);
    const user = await getUserById(userId);
    
    return user;
  } catch (error) {
    logger.error('Error in createUser service:', error);
    throw error;
  }
};

/**
 * Update user
 */
const updateUser = async (id, updateData) => {
  try {
    const existing = await userModel.findById(id);
    if (!existing) {
      return null;
    }
    
    // Validate update data
    if (updateData.email || updateData.username || updateData.role) {
      validateUserData(updateData, true);
    }
    
    // Check if email is being changed and if new email exists
    if (updateData.email && updateData.email !== existing.email) {
      const existingEmail = await userModel.findByEmail(updateData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }
    
    // Check if username is being changed and if new username exists
    if (updateData.username && updateData.username !== existing.username) {
      const existingUsername = await userModel.findByUsername(updateData.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }
    
    // Hash password if being updated
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }
    
    await userModel.update(id, updateData);
    const user = await getUserById(id);
    
    return user;
  } catch (error) {
    logger.error('Error in updateUser service:', error);
    throw error;
  }
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (id, deletedBy) => {
  try {
    const existing = await userModel.findById(id);
    if (!existing) {
      return null;
    }
    
    await userModel.softDelete(id, deletedBy);
    return true;
  } catch (error) {
    logger.error('Error in deleteUser service:', error);
    throw error;
  }
};

/**
 * Update user status
 */
const updateUserStatus = async (id, status, updatedBy) => {
  try {
    const existing = await userModel.findById(id);
    if (!existing) {
      return null;
    }
    
    await userModel.update(id, { status, updated_by: updatedBy });
    const user = await getUserById(id);
    
    return user;
  } catch (error) {
    logger.error('Error in updateUserStatus service:', error);
    throw error;
  }
};

/**
 * Get user activity logs
 */
const getUserActivity = async (userId, page, limit) => {
  try {
    const offset = (page - 1) * limit;
    
    const activities = await userModel.getActivityLogs(userId, limit, offset);
    const total = await userModel.countActivityLogs(userId);
    
    return {
      activities,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    };
  } catch (error) {
    logger.error('Error in getUserActivity service:', error);
    throw error;
  }
};

/**
 * Verify user password
 */
const verifyPassword = async (userId, password) => {
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return false;
    }
    
    return await bcrypt.compare(password, user.password_hash);
  } catch (error) {
    logger.error('Error in verifyPassword service:', error);
    throw error;
  }
};

/**
 * Update user password
 */
const updatePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Verify current password
    const isValid = await verifyPassword(userId, currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    validatePassword(newPassword);
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    
    await userModel.update(userId, { 
      password_hash,
      password_changed_at: new Date(),
      updated_by: userId
    });
    
    return true;
  } catch (error) {
    logger.error('Error in updatePassword service:', error);
    throw error;
  }
};

/**
 * Validate user data
 */
const validateUserData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate) {
    if (!data.username) errors.push('Username is required');
    if (!data.email) errors.push('Email is required');
    if (!data.password) errors.push('Password is required');
    if (!data.first_name) errors.push('First name is required');
    if (!data.last_name) errors.push('Last name is required');
    if (!data.role) errors.push('Role is required');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.password) {
    validatePassword(data.password, errors);
  }
  
  if (data.role && ![
    'ADMIN',
    'PROJECT_MANAGER',
    'EQUIPMENT_OFFICER',
    'FINANCE_CONTROLLER',
    'SUPERVISOR',
    'VIEWER'
  ].includes(data.role)) {
    errors.push('Invalid role');
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone format');
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.errors = errors;
    throw error;
  }
};

/**
 * Validate password strength
 */
const validatePassword = (password, errors = []) => {
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (errors.length > 0) {
    const error = new Error('Password validation failed');
    error.errors = errors;
    throw error;
  }
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (Moroccan format)
 */
const isValidPhone = (phone) => {
  // Moroccan phone: +212XXXXXXXXX or 0XXXXXXXXX
  const phoneRegex = /^(\+212|0)[5-7]\d{8}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserActivity,
  verifyPassword,
  updatePassword
};
