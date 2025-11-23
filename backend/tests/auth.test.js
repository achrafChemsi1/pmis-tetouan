/**
 * Authentication Tests
 * Test suite for authentication endpoints
 */

const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/database');

describe('Authentication API Tests', () => {
  let authToken;
  let testUser = {
    email: 'test@pmis-tetouan.ma',
    password: 'Test@12345'
  };

  beforeAll(async () => {
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    
    // Close database connection
    await db.end();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@pmis-tetouan.ma',
          password: 'Admin@2025'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'admin@pmis-tetouan.ma');
      
      authToken = response.body.token;
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@pmis-tetouan.ma',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'Admin@2025'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@pmis-tetouan.ma'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@pmis-tetouan.ma',
          password: 'SomePassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@pmis-tetouan.ma',
          password: 'Admin@2025'
        });
      
      refreshToken = response.body.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/change-password', () => {
    beforeAll(async () => {
      // Get fresh token
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@pmis-tetouan.ma',
          password: 'Admin@2025'
        });
      
      authToken = response.body.token;
    });

    it('should change password with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Admin@2025',
          newPassword: 'NewAdmin@2025'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Change back to original password
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@pmis-tetouan.ma',
          password: 'NewAdmin@2025'
        });
      
      const newToken = loginResponse.body.token;
      
      await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          currentPassword: 'NewAdmin@2025',
          newPassword: 'Admin@2025'
        });
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Admin@2025',
          newPassword: 'weak'
        });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject wrong current password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewAdmin@2025'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Authentication Middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).not.toBe(401);
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/users/profile/me');

      expect(response.status).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject access with expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6MTYwMDAwMDAwMH0.invalid';
      
      const response = await request(app)
        .get('/api/users/profile/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const requests = [];
      
      // Make 10 rapid login attempts
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/auth/login')
            .send({
              email: 'test@example.com',
              password: 'WrongPassword'
            })
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    }, 10000);
  });
});
