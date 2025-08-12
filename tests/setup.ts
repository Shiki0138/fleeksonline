import { connectDatabase, closeDatabase } from '../src/config/database';
import { connectRedis, closeRedis } from '../src/config/redis';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.DB_NAME = 'fleeks_test_db';

// Global test setup
beforeAll(async () => {
  try {
    await connectDatabase();
    await connectRedis();
  } catch (error) {
    console.error('Test setup failed:', error);
    process.exit(1);
  }
});

// Global test cleanup
afterAll(async () => {
  try {
    await closeDatabase();
    await closeRedis();
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});

// Test timeout
jest.setTimeout(30000);