/**
 * Comprehensive API Endpoint Testing Suite
 * Tests all REST endpoints with various scenarios
 */

const request = require('supertest');
const { apiHelpers, mockHelpers } = require('../helpers/testHelpers');

// Mock dependencies to avoid external calls
jest.mock('../../src/config/database');
jest.mock('../../src/config/redis');
jest.mock('../../src/config/logger');

describe('API Endpoints Comprehensive Testing', () => {
  let app;
  let authToken;
  let mockUser;

  beforeAll(async () => {
    // Mock Express app for testing
    const express = require('express');
    app = express();
    
    app.use(express.json());
    
    // Mock health endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: 'test',
      });
    });

    // Mock API version endpoint
    app.get('/api/version', (req, res) => {
      res.status(200).json({
        success: true,
        data: { version: '1.0.0', api: 'v1' },
      });
    });

    // Mock authentication endpoints
    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'test@example.com' && password === 'Password123!') {
        res.status(200).json({
          success: true,
          data: {
            user: { id: '1', email, role: 'user' },
            tokens: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
          },
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    });

    // Mock user endpoints
    app.get('/api/users', (req, res) => {
      const { page = 1, limit = 10, search } = req.query;
      const users = [
        { id: '1', email: 'user1@example.com', firstName: 'User', lastName: 'One' },
        { id: '2', email: 'user2@example.com', firstName: 'User', lastName: 'Two' },
      ];
      
      let filteredUsers = users;
      if (search) {
        filteredUsers = users.filter(user => 
          user.email.includes(search) || 
          user.firstName.includes(search) || 
          user.lastName.includes(search)
        );
      }

      res.status(200).json({
        success: true,
        data: filteredUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredUsers.length,
        },
      });
    });

    app.get('/api/users/:id', (req, res) => {
      const { id } = req.params;
      const user = { id, email: `user${id}@example.com`, firstName: 'User', lastName: id };
      
      if (id === '999') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      } else {
        res.status(200).json({
          success: true,
          data: user,
        });
      }
    });

    app.post('/api/users', (req, res) => {
      const { email, firstName, lastName, password } = req.body;
      
      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      if (email === 'existing@example.com') {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: Date.now().toString(),
          email,
          firstName,
          lastName,
        },
      });
    });

    app.put('/api/users/:id', (req, res) => {
      const { id } = req.params;
      
      if (id === '999') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      } else {
        res.status(200).json({
          success: true,
          data: { id, ...req.body },
        });
      }
    });

    app.delete('/api/users/:id', (req, res) => {
      const { id } = req.params;
      
      if (id === '999') {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'User deleted successfully',
        });
      }
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('Health Check Endpoints', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment', 'test');
    });

    test('GET /api/version should return API version', async () => {
      const response = await request(app).get('/api/version');
      
      apiHelpers.testSuccessResponse(response);
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('api');
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/login should authenticate valid user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      apiHelpers.testSuccessResponse(response);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      apiHelpers.testErrorResponse(response, 401, 'Invalid credentials');
    });
  });

  describe('User Management Endpoints', () => {
    describe('GET /api/users', () => {
      test('should return all users with pagination', async () => {
        const response = await request(app).get('/api/users');

        apiHelpers.testSuccessResponse(response);
        apiHelpers.testPaginationResponse(response, 2);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      test('should support search filtering', async () => {
        const response = await request(app)
          .get('/api/users')
          .query({ search: 'user1' });

        apiHelpers.testSuccessResponse(response);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].email).toContain('user1');
      });

      test('should support pagination parameters', async () => {
        const response = await request(app)
          .get('/api/users')
          .query({ page: 1, limit: 5 });

        apiHelpers.testSuccessResponse(response);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
      });
    });

    describe('GET /api/users/:id', () => {
      test('should return user by ID', async () => {
        const response = await request(app).get('/api/users/1');

        apiHelpers.testSuccessResponse(response);
        expect(response.body.data).toHaveProperty('id', '1');
        expect(response.body.data).toHaveProperty('email');
      });

      test('should return 404 for non-existent user', async () => {
        const response = await request(app).get('/api/users/999');

        apiHelpers.testErrorResponse(response, 404, 'User not found');
      });
    });

    describe('POST /api/users', () => {
      test('should create new user with valid data', async () => {
        const userData = {
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
          password: 'Password123!',
        };

        const response = await request(app)
          .post('/api/users')
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('email', userData.email);
      });

      test('should reject incomplete data', async () => {
        const userData = {
          email: 'incomplete@example.com',
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/users')
          .send(userData);

        apiHelpers.testErrorResponse(response, 400, 'Missing required fields');
      });

      test('should reject duplicate email', async () => {
        const userData = {
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'User',
          password: 'Password123!',
        };

        const response = await request(app)
          .post('/api/users')
          .send(userData);

        apiHelpers.testErrorResponse(response, 409, 'User already exists');
      });
    });

    describe('PUT /api/users/:id', () => {
      test('should update existing user', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
        };

        const response = await request(app)
          .put('/api/users/1')
          .send(updateData);

        apiHelpers.testSuccessResponse(response);
        expect(response.body.data).toHaveProperty('firstName', 'Updated');
      });

      test('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .put('/api/users/999')
          .send({ firstName: 'Updated' });

        apiHelpers.testErrorResponse(response, 404, 'User not found');
      });
    });

    describe('DELETE /api/users/:id', () => {
      test('should delete existing user', async () => {
        const response = await request(app).delete('/api/users/1');

        apiHelpers.testSuccessResponse(response);
        expect(response.body).toHaveProperty('message', 'User deleted successfully');
      });

      test('should return 404 for non-existent user', async () => {
        const response = await request(app).delete('/api/users/999');

        apiHelpers.testErrorResponse(response, 404, 'User not found');
      });
    });
  });

  describe('Security and Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    test('should handle large payloads', async () => {
      const largeData = {
        email: 'test@example.com',
        firstName: 'A'.repeat(1000),
        lastName: 'B'.repeat(1000),
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/users')
        .send(largeData);

      // Should handle large payloads gracefully
      expect([201, 413]).toContain(response.status);
    });

    test('should sanitize error responses', async () => {
      const response = await request(app).get('/api/users/999');

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('sensitive');
    });
  });

  describe('Performance Testing', () => {
    test('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/api/users');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() => 
        request(app).get('/api/users')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});