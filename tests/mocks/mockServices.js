/**
 * Mock services for testing
 * These provide controlled responses for testing various scenarios
 */

const { testUsers, testPosts, apiResponses } = require('../fixtures/testData');

class MockUserService {
  constructor() {
    this.users = [...testUsers];
    this.nextId = 4;
  }
  
  async findAll(options = {}) {
    const { page = 1, limit = 10, filter = {} } = options;
    let filteredUsers = [...this.users];
    
    // Apply filters
    if (filter.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === filter.isActive);
    }
    if (filter.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filter.role);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return {
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit),
      },
    };
  }
  
  async findById(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
  
  async create(userData) {
    // Simulate validation
    if (!userData.name || !userData.email) {
      throw new Error('Name and email are required');
    }
    
    // Check for duplicate email
    if (this.users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }
    
    const newUser = {
      id: String(this.nextId++),
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.users.push(newUser);
    return newUser;
  }
  
  async update(id, updateData) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    return this.users[userIndex];
  }
  
  async delete(id) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    this.users.splice(userIndex, 1);
    return true;
  }
  
  // Reset to initial state for testing
  reset() {
    this.users = [...testUsers];
    this.nextId = 4;
  }
}

class MockPostService {
  constructor() {
    this.posts = [...testPosts];
    this.nextId = 3;
  }
  
  async findAll(options = {}) {
    const { userId, published } = options;
    let filteredPosts = [...this.posts];
    
    if (userId) {
      filteredPosts = filteredPosts.filter(post => post.userId === userId);
    }
    
    if (published !== undefined) {
      filteredPosts = filteredPosts.filter(post => post.published === published);
    }
    
    return filteredPosts;
  }
  
  async findById(id) {
    const post = this.posts.find(p => p.id === id);
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  }
  
  async create(postData) {
    if (!postData.title || !postData.content) {
      throw new Error('Title and content are required');
    }
    
    const newPost = {
      id: String(this.nextId++),
      ...postData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.posts.push(newPost);
    return newPost;
  }
  
  async update(id, updateData) {
    const postIndex = this.posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      throw new Error('Post not found');
    }
    
    this.posts[postIndex] = {
      ...this.posts[postIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    return this.posts[postIndex];
  }
  
  async delete(id) {
    const postIndex = this.posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      throw new Error('Post not found');
    }
    
    this.posts.splice(postIndex, 1);
    return true;
  }
  
  reset() {
    this.posts = [...testPosts];
    this.nextId = 3;
  }
}

// Mock database connection
class MockDatabase {
  constructor() {
    this.connected = false;
    this.data = new Map();
  }
  
  async connect() {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    return true;
  }
  
  async disconnect() {
    this.connected = false;
    this.data.clear();
    return true;
  }
  
  async query(sql, params = []) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    
    // Simulate query delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Mock query responses based on SQL patterns
    if (sql.includes('SELECT')) {
      return { rows: [], rowCount: 0 };
    } else if (sql.includes('INSERT')) {
      return { rows: [{ id: 'mock-id' }], rowCount: 1 };
    } else if (sql.includes('UPDATE')) {
      return { rows: [], rowCount: 1 };
    } else if (sql.includes('DELETE')) {
      return { rows: [], rowCount: 1 };
    }
    
    return { rows: [], rowCount: 0 };
  }
  
  isConnected() {
    return this.connected;
  }
}

// Mock authentication service
class MockAuthService {
  constructor() {
    this.tokens = new Map();
    this.users = [...testUsers];
  }
  
  async login(email, password) {
    const user = this.users.find(u => u.email === email);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }
    
    // Simulate password verification
    if (password !== 'validPassword') {
      throw new Error('Invalid credentials');
    }
    
    const token = 'mock-jwt-token-' + Date.now();
    this.tokens.set(token, { userId: user.id, expires: Date.now() + 3600000 });
    
    return {
      token,
      user: { ...user, password: undefined },
    };
  }
  
  async verifyToken(token) {
    const tokenData = this.tokens.get(token);
    if (!tokenData || tokenData.expires < Date.now()) {
      throw new Error('Invalid or expired token');
    }
    
    const user = this.users.find(u => u.id === tokenData.userId);
    return { ...user, password: undefined };
  }
  
  async logout(token) {
    this.tokens.delete(token);
    return true;
  }
  
  reset() {
    this.tokens.clear();
    this.users = [...testUsers];
  }
}

module.exports = {
  MockUserService,
  MockPostService,
  MockDatabase,
  MockAuthService,
};