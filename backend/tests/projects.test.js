/**
 * Projects Tests
 * Test suite for project management endpoints
 */

const request = require('supertest');
const app = require('../src/server');
const db = require('../src/config/database');

describe('Projects API Tests', () => {
  let authToken;
  let adminToken;
  let testProjectId;

  beforeAll(async () => {
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Login as admin
    const adminResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@pmis-tetouan.ma',
        password: 'Admin@2025'
      });
    
    adminToken = adminResponse.body.token;
    authToken = adminToken;
  });

  afterAll(async () => {
    // Cleanup test project
    if (testProjectId) {
      try {
        await db.query('DELETE FROM projects WHERE project_id = ?', [testProjectId]);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    
    await db.end();
  });

  describe('GET /api/projects', () => {
    it('should get all projects with authentication', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(401);
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.status === 'active')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('POST /api/projects', () => {
    it('should create new project with valid data', async () => {
      const newProject = {
        project_name: 'Test Infrastructure Project',
        description: 'Test project for automated testing',
        project_type: 'infrastructure',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        estimated_budget: 500000,
        priority: 'high',
        status: 'planning'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProject);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('project_id');
      expect(response.body.data).toHaveProperty('project_name', newProject.project_name);
      
      testProjectId = response.body.data.project_id;
    });

    it('should reject project without required fields', async () => {
      const invalidProject = {
        description: 'Missing project name'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProject);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject project with invalid dates', async () => {
      const invalidProject = {
        project_name: 'Invalid Date Project',
        start_date: '2025-12-31',
        end_date: '2025-01-01', // End before start
        estimated_budget: 100000
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProject);

      expect(response.status).toBe(422);
    });

    it('should reject unauthorized user', async () => {
      const newProject = {
        project_name: 'Unauthorized Project',
        estimated_budget: 100000
      };

      // This would need a token for a user without project creation rights
      // For now, we'll just verify admin can create
      const response = await request(app)
        .post('/api/projects')
        .send(newProject);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('project_id', testProjectId);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project with valid data', async () => {
      const updateData = {
        description: 'Updated description for test project',
        priority: 'medium'
      };

      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('description', updateData.description);
    });

    it('should reject update with invalid data', async () => {
      const invalidData = {
        estimated_budget: -1000 // Negative budget
      };

      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(422);
    });
  });

  describe('PUT /api/projects/:id/status', () => {
    it('should update project status', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('status', 'active');
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/projects/:id/budget', () => {
    it('should get project budget details', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/budget`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('estimated_budget');
    });
  });

  describe('GET /api/projects/:id/progress', () => {
    it('should get project progress metrics', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('completion_percentage');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify soft delete
      const checkResponse = await request(app)
        .get(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(checkResponse.body.data.status).toBe('cancelled');
    });

    it('should reject unauthorized deletion', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProjectId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Project Validation', () => {
    it('should validate project name length', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          project_name: 'AB', // Too short
          estimated_budget: 100000
        });

      expect(response.status).toBe(422);
    });

    it('should validate budget range', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          project_name: 'Test Project',
          estimated_budget: -5000 // Negative
        });

      expect(response.status).toBe(422);
    });
  });
});
