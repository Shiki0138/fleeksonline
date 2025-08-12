/**
 * Test Data Generation Utilities
 * Provides utilities for generating test data, fixtures, and mock objects
 */

// Simple UUID generation for testing
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class TestDataGenerator {
  constructor() {
    this.seededData = new Map();
  }

  /**
   * Generate a random user object
   * @param {Object} overrides - Override specific fields
   * @returns {Object} User object
   */
  generateUser(overrides = {}) {
    const id = overrides.id || uuidv4();
    const firstName = overrides.firstName || this.generateFirstName();
    const lastName = overrides.lastName || this.generateLastName();
    const email = overrides.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    
    return {
      id,
      firstName,
      lastName,
      email,
      password: overrides.password || 'TestPassword123!',
      role: overrides.role || 'user',
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      emailVerified: overrides.emailVerified !== undefined ? overrides.emailVerified : false,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      lastLogin: overrides.lastLogin || null,
      loginAttempts: overrides.loginAttempts || 0,
      accountLocked: overrides.accountLocked || false,
      ...overrides,
    };
  }

  /**
   * Generate multiple users
   * @param {number} count - Number of users to generate
   * @param {Object} baseOverrides - Base overrides for all users
   * @returns {Array} Array of user objects
   */
  generateUsers(count, baseOverrides = {}) {
    return Array(count).fill(0).map((_, index) => 
      this.generateUser({
        ...baseOverrides,
        id: baseOverrides.id ? `${baseOverrides.id}-${index}` : undefined,
      })
    );
  }

  /**
   * Generate an organization object
   * @param {Object} overrides - Override specific fields
   * @returns {Object} Organization object
   */
  generateOrganization(overrides = {}) {
    const name = overrides.name || this.generateCompanyName();
    
    return {
      id: overrides.id || uuidv4(),
      name,
      slug: overrides.slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: overrides.description || `${name} organization`,
      website: overrides.website || `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
      industry: overrides.industry || this.generateIndustry(),
      size: overrides.size || this.generateCompanySize(),
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate a project object
   * @param {Object} overrides - Override specific fields
   * @returns {Object} Project object
   */
  generateProject(overrides = {}) {
    const name = overrides.name || this.generateProjectName();
    
    return {
      id: overrides.id || uuidv4(),
      name,
      slug: overrides.slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: overrides.description || `${name} project description`,
      status: overrides.status || this.generateProjectStatus(),
      priority: overrides.priority || this.generatePriority(),
      startDate: overrides.startDate || this.generatePastDate(),
      endDate: overrides.endDate || this.generateFutureDate(),
      budget: overrides.budget || this.generateBudget(),
      organizationId: overrides.organizationId || uuidv4(),
      ownerId: overrides.ownerId || uuidv4(),
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate a task object
   * @param {Object} overrides - Override specific fields
   * @returns {Object} Task object
   */
  generateTask(overrides = {}) {
    const title = overrides.title || this.generateTaskTitle();
    
    return {
      id: overrides.id || uuidv4(),
      title,
      description: overrides.description || `${title} description`,
      status: overrides.status || this.generateTaskStatus(),
      priority: overrides.priority || this.generatePriority(),
      assigneeId: overrides.assigneeId || null,
      projectId: overrides.projectId || uuidv4(),
      createdById: overrides.createdById || uuidv4(),
      dueDate: overrides.dueDate || this.generateFutureDate(),
      estimatedHours: overrides.estimatedHours || Math.floor(Math.random() * 40) + 1,
      actualHours: overrides.actualHours || null,
      tags: overrides.tags || this.generateTags(),
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      createdAt: overrides.createdAt || new Date().toISOString(),
      updatedAt: overrides.updatedAt || new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate JWT token data
   * @param {Object} overrides - Override specific fields
   * @returns {Object} Token data
   */
  generateTokenData(overrides = {}) {
    return {
      userId: overrides.userId || uuidv4(),
      email: overrides.email || 'test@example.com',
      role: overrides.role || 'user',
      organizationId: overrides.organizationId || null,
      iat: overrides.iat || Math.floor(Date.now() / 1000),
      exp: overrides.exp || Math.floor(Date.now() / 1000) + 3600, // 1 hour
      ...overrides,
    };
  }

  /**
   * Generate API response structure
   * @param {*} data - Response data
   * @param {boolean} success - Success status
   * @param {string} message - Response message
   * @returns {Object} API response
   */
  generateApiResponse(data = null, success = true, message = null) {
    return {
      success,
      message: message || (success ? 'Operation successful' : 'Operation failed'),
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate paginated response
   * @param {Array} data - Data array
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @returns {Object} Paginated response
   */
  generatePaginatedResponse(data, page = 1, limit = 10, total = null) {
    const totalItems = total || data.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      success: true,
      data: data.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: totalItems,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate error response
   * @param {string} message - Error message
   * @param {number} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Object} Error response
   */
  generateErrorResponse(message, code = 500, details = null) {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate validation error response
   * @param {Array} errors - Validation errors
   * @returns {Object} Validation error response
   */
  generateValidationErrorResponse(errors) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        code: 400,
        validationErrors: errors.map(error => ({
          field: error.field,
          message: error.message,
          value: error.value,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Helper methods for generating specific data types

  generateFirstName() {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emily', 'James', 'Ashley'];
    return names[Math.floor(Math.random() * names.length)];
  }

  generateLastName() {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return names[Math.floor(Math.random() * names.length)];
  }

  generateCompanyName() {
    const prefixes = ['Tech', 'Digital', 'Smart', 'Global', 'Advanced', 'Modern', 'Future', 'Innovative'];
    const suffixes = ['Solutions', 'Systems', 'Corp', 'Inc', 'Ltd', 'Group', 'Partners', 'Consulting'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }

  generateIndustry() {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Consulting', 'Marketing'];
    return industries[Math.floor(Math.random() * industries.length)];
  }

  generateCompanySize() {
    const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  generateProjectName() {
    const adjectives = ['Awesome', 'Amazing', 'Incredible', 'Fantastic', 'Revolutionary', 'Innovative', 'Creative', 'Dynamic'];
    const nouns = ['Platform', 'Application', 'System', 'Portal', 'Dashboard', 'Tool', 'Solution', 'Framework'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective} ${noun}`;
  }

  generateProjectStatus() {
    const statuses = ['planning', 'in-progress', 'review', 'completed', 'on-hold', 'cancelled'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  generateTaskTitle() {
    const actions = ['Implement', 'Design', 'Fix', 'Update', 'Create', 'Optimize', 'Test', 'Deploy'];
    const objects = ['user authentication', 'database schema', 'API endpoints', 'user interface', 'security features', 'performance issues'];
    
    const action = actions[Math.floor(Math.random() * actions.length)];
    const object = objects[Math.floor(Math.random() * objects.length)];
    
    return `${action} ${object}`;
  }

  generateTaskStatus() {
    const statuses = ['todo', 'in-progress', 'review', 'testing', 'done', 'blocked'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  generatePriority() {
    const priorities = ['low', 'medium', 'high', 'critical'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  generateTags() {
    const allTags = ['frontend', 'backend', 'database', 'api', 'security', 'performance', 'bug', 'feature', 'enhancement', 'documentation'];
    const count = Math.floor(Math.random() * 4) + 1; // 1-4 tags
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  generateBudget() {
    return Math.floor(Math.random() * 100000) + 10000; // $10k - $110k
  }

  generatePastDate(daysAgo = 30) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    return date.toISOString();
  }

  generateFutureDate(daysAhead = 60) {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
    return date.toISOString();
  }

  /**
   * Generate a complete test scenario with related data
   * @param {Object} options - Generation options
   * @returns {Object} Complete test scenario
   */
  generateTestScenario(options = {}) {
    const {
      userCount = 5,
      organizationCount = 2,
      projectCount = 3,
      taskCount = 10,
    } = options;

    const organizations = this.generateOrganizations(organizationCount);
    const users = this.generateUsers(userCount);
    const projects = this.generateProjects(projectCount, organizations, users);
    const tasks = this.generateTasks(taskCount, projects, users);

    return {
      organizations,
      users,
      projects,
      tasks,
      relationships: this.generateRelationships(organizations, users, projects, tasks),
    };
  }

  generateOrganizations(count) {
    return Array(count).fill(0).map(() => this.generateOrganization());
  }

  generateProjects(count, organizations, users) {
    return Array(count).fill(0).map(() => {
      const org = organizations[Math.floor(Math.random() * organizations.length)];
      const owner = users[Math.floor(Math.random() * users.length)];
      
      return this.generateProject({
        organizationId: org.id,
        ownerId: owner.id,
      });
    });
  }

  generateTasks(count, projects, users) {
    return Array(count).fill(0).map(() => {
      const project = projects[Math.floor(Math.random() * projects.length)];
      const creator = users[Math.floor(Math.random() * users.length)];
      const assignee = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : null;
      
      return this.generateTask({
        projectId: project.id,
        createdById: creator.id,
        assigneeId: assignee ? assignee.id : null,
      });
    });
  }

  generateRelationships(organizations, users, projects, tasks) {
    return {
      userOrganizations: users.map(user => ({
        userId: user.id,
        organizationId: organizations[Math.floor(Math.random() * organizations.length)].id,
        role: Math.random() > 0.8 ? 'admin' : 'member',
        joinedAt: this.generatePastDate(90),
      })),
      projectMembers: projects.reduce((acc, project) => {
        const memberCount = Math.floor(Math.random() * users.length / 2) + 1;
        const shuffledUsers = users.sort(() => 0.5 - Math.random());
        const members = shuffledUsers.slice(0, memberCount);
        
        members.forEach(user => {
          acc.push({
            userId: user.id,
            projectId: project.id,
            role: user.id === project.ownerId ? 'owner' : 'member',
            addedAt: this.generatePastDate(30),
          });
        });
        
        return acc;
      }, []),
    };
  }

  /**
   * Seed data for consistent testing
   * @param {string} key - Seed key
   * @param {*} data - Data to seed
   */
  seedData(key, data) {
    this.seededData.set(key, data);
  }

  /**
   * Get seeded data
   * @param {string} key - Seed key
   * @returns {*} Seeded data
   */
  getSeedData(key) {
    return this.seededData.get(key);
  }

  /**
   * Clear all seeded data
   */
  clearSeedData() {
    this.seededData.clear();
  }
}

module.exports = TestDataGenerator;