/**
 * Jest Test Setup
 * Global test configuration and setup
 */

const { TextEncoder, TextDecoder } = require('util');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-12345';
process.env.JWT_EXPIRY = '3600';
process.env.JWT_REFRESH_EXPIRY = '2592000';

// Database configuration for testing
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'your_test_password';
process.env.DB_NAME = 'pmis_tetouan_test';
process.env.DB_POOL_SIZE = '5';

// Disable logging in tests
process.env.LOG_LEVEL = 'error';

// CORS configuration
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Add TextEncoder and TextDecoder to global scope for Node.js compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock external services if needed
jest.mock('../src/utils/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

// Database setup and teardown helpers
const db = require('../src/config/database');

beforeAll(async () => {
  // Wait for database connection
  let retries = 5;
  while (retries > 0) {
    try {
      await db.query('SELECT 1');
      console.log('✓ Database connected for testing');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

afterAll(async () => {
  try {
    await db.end();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
});

// Helper function to create test user
global.createTestUser = async (userData = {}) => {
  const bcrypt = require('bcryptjs');
  const defaultUser = {
    email: 'testuser@pmis-tetouan.ma',
    password: 'Test@12345',
    full_name: 'Test User',
    role: 'staff',
    department: 'Testing',
    status: 'active',
  };

  const user = { ...defaultUser, ...userData };
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const [result] = await db.query(
    `INSERT INTO users (email, password_hash, full_name, role, department, status) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.email, hashedPassword, user.full_name, user.role, user.department, user.status]
  );

  return {
    user_id: result.insertId,
    ...user,
  };
};

// Helper function to delete test user
global.deleteTestUser = async (email) => {
  await db.query('DELETE FROM users WHERE email = ?', [email]);
};

// Helper function to generate auth token
global.generateAuthToken = async (email = 'admin@pmis-tetouan.ma', password = 'Admin@2025') => {
  const request = require('supertest');
  const app = require('../src/server');

  const response = await request(app)
    .post('/auth/login')
    .send({ email, password });

  return response.body.token;
};

// Helper to clear test data
global.clearTestData = async (table, condition = {}) => {
  const conditions = Object.keys(condition)
    .map(key => `${key} = ?`)
    .join(' AND ');
  
  const values = Object.values(condition);
  
  const query = conditions
    ? `DELETE FROM ${table} WHERE ${conditions}`
    : `TRUNCATE TABLE ${table}`;
  
  await db.query(query, values);
};

// Custom matchers
expect.extend({
  toBeValidDate(received) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    
    return {
      pass,
      message: () => `expected ${received} to be a valid date`,
    };
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    return {
      pass,
      message: () => `expected ${received} to be a valid email address`,
    };
  },
  
  toBePositiveNumber(received) {
    const pass = typeof received === 'number' && received > 0;
    
    return {
      pass,
      message: () => `expected ${received} to be a positive number`,
    };
  },
});

// Error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection in tests:', error);
});

console.log('✓ Test environment configured');
