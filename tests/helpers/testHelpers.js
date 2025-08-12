/**
 * Test helper utilities for common testing patterns
 */

const request = require('supertest');

/**
 * Database test helpers
 */
const dbHelpers = {
  // Mock database operations
  mockDatabase: () => {
    const mockDb = new Map();
    return {
      get: jest.fn((key) => mockDb.get(key)),
      set: jest.fn((key, value) => mockDb.set(key, value)),
      delete: jest.fn((key) => mockDb.delete(key)),
      clear: jest.fn(() => mockDb.clear()),
      has: jest.fn((key) => mockDb.has(key)),
      size: () => mockDb.size,
    };
  },
  
  // Setup test data
  setupTestData: async (db) => {
    const testData = {
      users: [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ],
      posts: [
        { id: '1', title: 'Test Post', content: 'Test content', userId: '1' },
      ],
    };
    
    // Simulate database seeding
    Object.entries(testData).forEach(([table, records]) => {
      records.forEach(record => {
        db.set(`${table}:${record.id}`, record);
      });
    });
    
    return testData;
  },
};

/**
 * API test helpers
 */
const apiHelpers = {
  // Test authenticated requests
  authenticatedRequest: (app, token) => {
    return request(app).set('Authorization', `Bearer ${token}`);
  },
  
  // Common API test patterns
  testSuccessResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
  },
  
  testErrorResponse: (response, expectedStatus, expectedMessage) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(false);
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  },
  
  // Test pagination
  testPaginationResponse: (response, expectedTotal) => {
    expect(response.body.data).toBeDefined();
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBe(expectedTotal);
    expect(response.body.pagination.page).toBeDefined();
    expect(response.body.pagination.limit).toBeDefined();
  },
};

/**
 * Mock helpers
 */
const mockHelpers = {
  // Create mock middleware
  createMockMiddleware: (shouldPass = true) => {
    return jest.fn((req, res, next) => {
      if (shouldPass) {
        next();
      } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    });
  },
  
  // Create mock service
  createMockService: (methods = {}) => {
    const defaultMethods = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue(true),
    };
    
    return { ...defaultMethods, ...methods };
  },
  
  // Reset all mocks
  resetAllMocks: () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  },
};

/**
 * Performance test helpers
 */
const performanceHelpers = {
  // Measure execution time
  measureTime: async (fn) => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    return { result, duration };
  },
  
  // Test performance thresholds
  expectPerformance: (duration, maxMs) => {
    expect(duration).toBeLessThan(maxMs);
  },
  
  // Memory usage testing
  measureMemory: () => {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(used.external / 1024 / 1024 * 100) / 100,
    };
  },
};

module.exports = {
  dbHelpers,
  apiHelpers,
  mockHelpers,
  performanceHelpers,
};