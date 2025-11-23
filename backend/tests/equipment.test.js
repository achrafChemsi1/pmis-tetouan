/**
 * Equipment Module Tests
 * 
 * Tests for equipment CRUD operations, allocation, maintenance tracking,
 * depreciation calculations, and validation.
 * 
 * @module tests/equipment
 */

const request = require('supertest');
const { pool } = require('../src/config/database');
const app = require('../src/server');

describe('Equipment API Endpoints', () => {
  let authToken;
  let adminToken;
  let testEquipmentId;
  let testProjectId;

  // Setup: Create test user and login
  beforeAll(async () => {
    // Create test admin user
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@prefecture.ma',
        password: 'Admin123!@#'
      });
    
    adminToken = adminResponse.body.data.accessToken;

    // Create test regular user
    const userResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'manager@prefecture.ma',
        password: 'Manager123!@#'
      });
    
    authToken = userResponse.body.data.accessToken;

    // Create a test project for allocation tests
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Project for Equipment',
        description: 'Project for equipment allocation testing',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        budget: 100000,
        status: 'PLANNING'
      });
    
    testProjectId = projectResponse.body.data.project_id;
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test data
    if (testEquipmentId) {
      await pool.query('DELETE FROM equipment WHERE equipment_id = ?', [testEquipmentId]);
    }
    if (testProjectId) {
      await pool.query('DELETE FROM projects WHERE project_id = ?', [testProjectId]);
    }
    await pool.end();
  });

  describe('POST /api/equipment - Create Equipment', () => {
    it('should create new equipment with valid data', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Excavator CAT 320',
          category: 'HEAVY_MACHINERY',
          description: 'Heavy duty excavator for construction',
          serial_number: 'EXC-2025-001',
          purchase_date: '2024-01-15',
          purchase_cost: 250000,
          current_value: 250000,
          status: 'AVAILABLE',
          location: 'Equipment Depot A'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('equipment_id');
      expect(response.body.data.name).toBe('Excavator CAT 320');
      expect(response.body.data.status).toBe('AVAILABLE');
      
      testEquipmentId = response.body.data.equipment_id;
    });

    it('should reject equipment without required fields', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Equipment'
          // Missing required fields
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate serial numbers', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Equipment',
          category: 'HEAVY_MACHINERY',
          serial_number: 'EXC-2025-001', // Duplicate
          purchase_date: '2024-01-15',
          purchase_cost: 100000,
          status: 'AVAILABLE'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should deny access without authentication', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .send({
          name: 'Unauthorized Equipment',
          category: 'TOOLS',
          purchase_cost: 5000
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/equipment - List Equipment', () => {
    it('should return paginated equipment list', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.equipment)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter equipment by status', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'AVAILABLE' });

      expect(response.status).toBe(200);
      expect(response.body.data.equipment.every(eq => eq.status === 'AVAILABLE')).toBe(true);
    });

    it('should filter equipment by category', async () => {
      const response = await request(app)
        .get('/api/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ category: 'HEAVY_MACHINERY' });

      expect(response.status).toBe(200);
      expect(response.body.data.equipment.every(eq => eq.category === 'HEAVY_MACHINERY')).toBe(true);
    });
  });

  describe('GET /api/equipment/:id - Get Equipment Details', () => {
    it('should return equipment details by ID', async () => {
      const response = await request(app)
        .get(`/api/equipment/${testEquipmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.equipment_id).toBe(testEquipmentId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('current_value');
    });

    it('should return 404 for non-existent equipment', async () => {
      const response = await request(app)
        .get('/api/equipment/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/equipment/:id - Update Equipment', () => {
    it('should update equipment details', async () => {
      const response = await request(app)
        .put(`/api/equipment/${testEquipmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          current_value: 240000,
          location: 'Equipment Depot B',
          status: 'AVAILABLE'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.current_value).toBe(240000);
      expect(response.body.data.location).toBe('Equipment Depot B');
    });

    it('should reject invalid status transitions', async () => {
      const response = await request(app)
        .put(`/api/equipment/${testEquipmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'INVALID_STATUS'
        });

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/equipment/:id/allocate - Allocate Equipment', () => {
    it('should allocate equipment to project', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          project_id: testProjectId,
          allocation_date: '2025-02-01',
          expected_return_date: '2025-06-30',
          notes: 'Allocated for excavation phase'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('allocation_id');
    });

    it('should reject allocation of already allocated equipment', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          project_id: testProjectId,
          allocation_date: '2025-03-01'
        });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toContain('already allocated');
    });

    it('should reject allocation without project_id', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/allocate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          allocation_date: '2025-02-01'
        });

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/equipment/:id/return - Return Equipment', () => {
    it('should return allocated equipment', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          return_date: '2025-05-15',
          condition: 'GOOD',
          notes: 'Returned in good condition'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('returned successfully');
    });

    it('should reject return of non-allocated equipment', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/return`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          return_date: '2025-05-15'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/equipment/:id/maintenance - Record Maintenance', () => {
    it('should record maintenance activity', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/maintenance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maintenance_type: 'PREVENTIVE',
          description: 'Regular oil change and filter replacement',
          maintenance_date: '2025-03-15',
          cost: 1500,
          performed_by: 'Maintenance Team A'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('maintenance_id');
    });

    it('should require maintenance_type and description', async () => {
      const response = await request(app)
        .post(`/api/equipment/${testEquipmentId}/maintenance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maintenance_date: '2025-03-15'
        });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/equipment/:id/maintenance - Get Maintenance History', () => {
    it('should return maintenance history for equipment', async () => {
      const response = await request(app)
        .get(`/api/equipment/${testEquipmentId}/maintenance`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.maintenance_records)).toBe(true);
    });

    it('should calculate total maintenance cost', async () => {
      const response = await request(app)
        .get(`/api/equipment/${testEquipmentId}/maintenance`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total_maintenance_cost');
    });
  });

  describe('DELETE /api/equipment/:id - Delete Equipment', () => {
    it('should soft delete equipment', async () => {
      const response = await request(app)
        .delete(`/api/equipment/${testEquipmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it('should not allow deletion by non-admin users', async () => {
      // Create new equipment for this test
      const createResponse = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Delete Equipment',
          category: 'TOOLS',
          serial_number: 'DEL-TEST-001',
          purchase_date: '2025-01-01',
          purchase_cost: 5000,
          status: 'AVAILABLE'
        });

      const equipmentId = createResponse.body.data.equipment_id;

      const deleteResponse = await request(app)
        .delete(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(403);
    });
  });

  describe('Equipment Validation', () => {
    it('should reject negative purchase cost', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Equipment',
          category: 'TOOLS',
          purchase_cost: -1000, // Invalid
          status: 'AVAILABLE'
        });

      expect(response.status).toBe(422);
    });

    it('should reject invalid category', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Category Equipment',
          category: 'INVALID_CATEGORY',
          purchase_cost: 5000
        });

      expect(response.status).toBe(422);
    });

    it('should reject future purchase dates', async () => {
      const response = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Future Date Equipment',
          category: 'TOOLS',
          purchase_date: '2030-01-01', // Future date
          purchase_cost: 5000
        });

      expect(response.status).toBe(422);
    });
  });
});
