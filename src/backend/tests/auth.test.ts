import { FastifyInstance } from 'fastify';
import buildServer from '../src/server';
import { prisma } from './setup';

describe('Authentication', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(userData.email);
      expect(body.data.user.username).toBe(userData.username);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.user.password).toBeUndefined();
    });

    it('should fail with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser1',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      };

      // Create first user
      await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: userData,
      });

      // Try to create second user with same email
      const duplicateUserData = {
        ...userData,
        username: 'testuser2',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: duplicateUserData,
      });

      expect(response.statusCode).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
        },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe('test@example.com');
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
    });

    it('should fail with invalid password', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent email', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerResponse = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
        },
      });

      const body = JSON.parse(registerResponse.body);
      accessToken = body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/profile',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.email).toBe('test@example.com');
      expect(body.data.username).toBe('testuser');
    });

    it('should fail without token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/profile',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/profile',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});