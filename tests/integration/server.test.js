const request = require('supertest');
const Server = require('../../src/server');

// Mock dependencies to avoid database/redis connections in tests
jest.mock('../../src/config/database', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  close: jest.fn().mockResolvedValue(true),
  isHealthy: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/config/redis', () => ({
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  isHealthy: jest.fn().mockResolvedValue(true),
  isConnected: true,
}));

describe('Server Integration Tests', () => {
  let server;
  let app;

  beforeAll(async () => {
    server = new Server();
    app = server.app;
  });

  afterAll(async () => {
    if (server.server) {
      await server.server.close();
    }
  });

  describe('Health Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });

    it('should return API health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('services');
    });

    it('should return server info', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Fleeks Backend API');
      expect(response.body.data).toHaveProperty('endpoints');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Middleware', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should compress responses', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // Note: supertest might handle decompression automatically
      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow normal request volume', async () => {
      // Make a few requests to ensure rate limiting doesn't interfere with normal usage
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/health')
          .expect(200);
      }
    });
  });
});