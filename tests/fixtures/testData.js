/**
 * Test data fixtures for consistent testing
 */

const testUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword123',
    role: 'user',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'hashedPassword456',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    password: 'hashedPassword789',
    role: 'user',
    isActive: false,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

const testPosts = [
  {
    id: '1',
    title: 'First Test Post',
    content: 'This is the content of the first test post.',
    userId: '1',
    published: true,
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Second Test Post',
    content: 'This is the content of the second test post.',
    userId: '2',
    published: false,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z',
  },
];

const invalidUserData = [
  {
    // Missing name
    email: 'invalid@example.com',
    password: 'password123',
  },
  {
    // Invalid email
    name: 'Invalid User',
    email: 'not-an-email',
    password: 'password123',
  },
  {
    // Weak password
    name: 'Weak Password User',
    email: 'weak@example.com',
    password: '123',
  },
  {
    // SQL injection attempt
    name: "'; DROP TABLE users; --",
    email: 'hacker@example.com',
    password: 'password123',
  },
];

const apiResponses = {
  success: {
    users: {
      getAll: {
        success: true,
        data: testUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: testUsers.length,
          pages: 1,
        },
      },
      getById: {
        success: true,
        data: testUsers[0],
      },
      create: {
        success: true,
        data: { ...testUsers[0], id: 'new-id' },
        message: 'User created successfully',
      },
      update: {
        success: true,
        data: { ...testUsers[0], name: 'Updated Name' },
        message: 'User updated successfully',
      },
      delete: {
        success: true,
        message: 'User deleted successfully',
      },
    },
  },
  error: {
    notFound: {
      success: false,
      error: 'Not Found',
      message: 'The requested resource was not found',
      statusCode: 404,
    },
    validation: {
      success: false,
      error: 'Validation Error',
      message: 'The provided data is invalid',
      details: [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too weak' },
      ],
      statusCode: 400,
    },
    unauthorized: {
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required',
      statusCode: 401,
    },
    forbidden: {
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions',
      statusCode: 403,
    },
    serverError: {
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
  },
};

const performanceThresholds = {
  api: {
    getAll: 500, // milliseconds
    getById: 200,
    create: 1000,
    update: 1000,
    delete: 500,
  },
  database: {
    query: 100,
    insert: 200,
    update: 200,
    delete: 100,
  },
  memory: {
    maxHeapUsed: 50, // MB
    maxRss: 100, // MB
  },
};

const securityTestData = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; INSERT INTO users (name) VALUES ('hacked'); --",
    "' UNION SELECT * FROM users --",
  ],
  xss: [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    "javascript:alert('XSS')",
    '<img src="x" onerror="alert(\'XSS\')">',
  ],
  commandInjection: [
    '; ls -la',
    '| cat /etc/passwd',
    '&& rm -rf /',
    '`whoami`',
  ],
};

module.exports = {
  testUsers,
  testPosts,
  invalidUserData,
  apiResponses,
  performanceThresholds,
  securityTestData,
};