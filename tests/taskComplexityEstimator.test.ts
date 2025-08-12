import { TaskComplexityEstimator, estimateTaskComplexity, generateComplexityReport } from '../src/utils/taskComplexityEstimator';

describe('TaskComplexityEstimator', () => {
  describe('Simple Tasks', () => {
    test('should classify trivial tasks correctly', () => {
      const result = estimateTaskComplexity('Add a simple button to the UI');
      
      expect(result.category).toBe('trivial');
      expect(result.totalScore).toBeLessThan(2);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.analysis.workType).toBe('sequential');
    });

    test('should identify frontend domain for UI tasks', () => {
      const result = estimateTaskComplexity('Create a responsive navbar component with React');
      
      expect(result.breakdown.technicalDomains.some(d => d.domain === 'frontend')).toBe(true);
      expect(result.analysis.technicalStack).toContain('react');
      expect(result.analysis.technicalStack).toContain('responsive');
    });
  });

  describe('Moderate Tasks', () => {
    test('should handle API integration tasks', () => {
      const result = estimateTaskComplexity('Integrate payment API with user authentication and database validation');
      
      expect(result.category).toBeOneOf(['moderate', 'complex']);
      expect(result.breakdown.technicalDomains.length).toBeGreaterThan(1);
      expect(result.breakdown.integrationComplexity).toBeGreaterThan(2);
    });

    test('should identify multiple domains', () => {
      const result = estimateTaskComplexity('Build a REST API with JWT authentication, database models, and unit tests');
      
      const domains = result.breakdown.technicalDomains.map(d => d.domain);
      expect(domains).toContain('backend');
      expect(domains).toContain('authentication');
      expect(domains).toContain('database');
      expect(domains).toContain('testing');
    });
  });

  describe('Complex Tasks', () => {
    test('should handle microservice architecture tasks', () => {
      const result = estimateTaskComplexity(`
        Design and implement a microservices architecture with:
        1. API Gateway with rate limiting
        2. User service with OAuth2 authentication
        3. Database migration scripts
        4. Redis caching layer
        5. Docker containerization
        6. CI/CD pipeline with automated testing
        7. Monitoring and logging
      `);
      
      expect(result.category).toBeOneOf(['complex', 'very-complex']);
      expect(result.totalScore).toBeGreaterThan(10);
      expect(result.breakdown.technicalDomains.length).toBeGreaterThan(3);
      expect(result.analysis.workType).toBe('sequential'); // Due to numbered steps
    });

    test('should identify high dependency complexity', () => {
      const result = estimateTaskComplexity(`
        Refactor the authentication system which requires:
        - Updating user service after database migration
        - Modifying API endpoints before frontend integration
        - Testing depends on completion of backend changes
      `);
      
      expect(result.breakdown.dependencyComplexity).toBeGreaterThan(3);
      expect(result.analysis.dependencies.length).toBeGreaterThan(0);
    });
  });

  describe('Very Complex Tasks', () => {
    test('should handle full-stack application development', () => {
      const result = estimateTaskComplexity(`
        Build a complete e-commerce platform including:
        - React frontend with responsive design
        - Node.js backend API with GraphQL
        - PostgreSQL database with complex relationships
        - Redis caching and session management
        - Stripe payment integration
        - Real-time notifications with WebSocket
        - OAuth2 authentication with multiple providers
        - Docker deployment with Kubernetes orchestration
        - Comprehensive test suite with 90% coverage
        - API documentation and user guides
      `);
      
      expect(result.category).toBe('very-complex');
      expect(result.totalScore).toBeGreaterThan(15);
      expect(result.breakdown.technicalDomains.length).toBeGreaterThan(5);
      expect(result.recommendations).toContain('High complexity - consider breaking into smaller tasks');
    });
  });

  describe('Feature Analysis', () => {
    test('should identify and count features correctly', () => {
      const result = estimateTaskComplexity(`
        Create user management system with:
        - User registration feature
        - Login functionality
        - Password reset capability
        - Profile update feature
      `);
      
      expect(result.analysis.identifiedFeatures.length).toBeGreaterThan(0);
      expect(result.breakdown.featureComplexity).toBeGreaterThan(1);
    });

    test('should differentiate feature complexity levels', () => {
      const simpleTask = estimateTaskComplexity('Add a simple display function');
      const complexTask = estimateTaskComplexity('Implement advanced optimization algorithm with machine learning');
      
      expect(complexTask.breakdown.featureComplexity).toBeGreaterThan(simpleTask.breakdown.featureComplexity);
    });
  });

  describe('Integration Analysis', () => {
    test('should identify integration points', () => {
      const result = estimateTaskComplexity(`
        Integrate with external services:
        - Connect to payment gateway
        - Interface with email service
        - Communicate with analytics platform
      `);
      
      expect(result.breakdown.integrationComplexity).toBeGreaterThan(2);
      expect(result.analysis.integrationPoints.length).toBeGreaterThan(0);
    });

    test('should handle distributed system complexity', () => {
      const result = estimateTaskComplexity(`
        Orchestrate microservices communication with:
        - Service discovery
        - Load balancing
        - Circuit breakers
        - Distributed tracing
      `);
      
      expect(result.breakdown.integrationComplexity).toBeGreaterThan(4);
    });
  });

  describe('Work Type Analysis', () => {
    test('should identify sequential work patterns', () => {
      const result = estimateTaskComplexity(`
        Deploy the application:
        1. First, run database migrations
        2. Then, deploy backend services
        3. Next, update frontend configuration
        4. Finally, run integration tests
      `);
      
      expect(result.analysis.workType).toBe('sequential');
    });

    test('should identify parallel work patterns', () => {
      const result = estimateTaskComplexity(`
        Develop features simultaneously:
        - Frontend team works on UI components
        - Backend team develops API endpoints concurrently
        - QA team prepares test cases in parallel
      `);
      
      expect(result.analysis.workType).toBe('parallel');
    });

    test('should identify mixed work patterns', () => {
      const result = estimateTaskComplexity(`
        Project development:
        1. First, set up infrastructure
        2. Then, teams work simultaneously on frontend and backend
        3. Finally, integrate and test
      `);
      
      expect(result.analysis.workType).toBe('mixed');
    });
  });

  describe('Confidence Calculation', () => {
    test('should have higher confidence for detailed descriptions', () => {
      const shortTask = estimateTaskComplexity('Fix bug');
      const detailedTask = estimateTaskComplexity(`
        Fix the authentication bug that occurs when users with special characters 
        in their passwords attempt to login through the OAuth2 flow, causing 
        session timeout errors in production environment with Redis cluster
      `);
      
      expect(detailedTask.confidence).toBeGreaterThan(shortTask.confidence);
    });

    test('should have reasonable confidence bounds', () => {
      const result = estimateTaskComplexity('Any random task description');
      
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  describe('Recommendations', () => {
    test('should recommend appropriate team size', () => {
      const simpleTask = estimateTaskComplexity('Add CSS styling to button');
      const complexTask = estimateTaskComplexity(`
        Rebuild entire authentication system with microservices, 
        OAuth2, database migrations, and comprehensive testing
      `);
      
      expect(simpleTask.recommendations.some(r => r.includes('Single developer'))).toBe(true);
      expect(complexTask.recommendations.some(r => r.includes('team of 2-3'))).toBe(true);
    });

    test('should recommend breaking down very complex tasks', () => {
      const veryComplexTask = estimateTaskComplexity(`
        Build complete enterprise application with:
        - Microservices architecture
        - Multiple databases
        - Real-time features
        - Advanced security
        - Mobile apps
        - Web dashboard
        - Admin panel
        - Reporting system
        - Analytics integration
        - Payment processing
        - Notification system
        - File storage
        - Search functionality
        - API gateway
        - Load balancing
      `);
      
      expect(veryComplexTask.recommendations.some(r => 
        r.includes('breaking into smaller tasks')
      )).toBe(true);
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive report', () => {
      const taskDescription = 'Build a REST API with authentication and database integration';
      const report = generateComplexityReport(taskDescription);
      
      expect(report).toContain('# Task Complexity Analysis Report');
      expect(report).toContain('Overall Assessment');
      expect(report).toContain('Technical Analysis');
      expect(report).toContain('Complexity Breakdown');
      expect(report).toContain('Recommendations');
    });

    test('should include all key metrics in report', () => {
      const report = generateComplexityReport('Complex task with multiple integrations');
      
      expect(report).toMatch(/Complexity Score.*\/20/);
      expect(report).toMatch(/Category.*:/);
      expect(report).toMatch(/Confidence.*%/);
      expect(report).toMatch(/Estimated Effort.*:/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty task description', () => {
      const result = estimateTaskComplexity('');
      
      expect(result.category).toBe('trivial');
      expect(result.totalScore).toBeLessThan(1);
    });

    test('should handle very long task descriptions', () => {
      const longDescription = 'Build application '.repeat(100) + 
        'with database, API, frontend, testing, deployment, monitoring';
      const result = estimateTaskComplexity(longDescription);
      
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.category).not.toBe('trivial');
    });

    test('should handle task with no recognizable keywords', () => {
      const result = estimateTaskComplexity('Xyzzy frobnicator blurble widget implementation');
      
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.category).toBeOneOf(['trivial', 'simple']);
    });
  });
});

// Custom matcher for Jest
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}