/**
 * Task Complexity Estimator - Usage Examples
 * Demonstrates various complexity scenarios and analysis results
 */

import { estimateTaskComplexity, generateComplexityReport, TaskComplexityEstimator } from '../src/utils/taskComplexityEstimator';

// Example task descriptions for different complexity levels
const exampleTasks = {
  trivial: [
    'Add a logout button to the header',
    'Update the page title',
    'Change button color to blue',
    'Fix typo in error message'
  ],
  
  simple: [
    'Create a contact form with name, email, and message fields',
    'Add pagination to the product list',
    'Implement basic search functionality',
    'Create a simple dashboard layout'
  ],
  
  moderate: [
    'Build user authentication with login, registration, and password reset',
    'Integrate payment processing with Stripe API',
    'Create a REST API for blog posts with CRUD operations',
    'Implement file upload with validation and storage'
  ],
  
  complex: [
    'Design microservices architecture with API gateway and service discovery',
    'Build real-time chat system with WebSocket, message history, and notifications',
    'Implement advanced search with Elasticsearch, filtering, and sorting',
    'Create automated CI/CD pipeline with testing, deployment, and rollback'
  ],
  
  veryComplex: [
    `Build complete e-commerce platform with:
    - Multi-vendor marketplace functionality
    - Advanced inventory management
    - Real-time order tracking
    - Payment gateway integration
    - Mobile app and web dashboard
    - Analytics and reporting
    - Multi-language support
    - Performance optimization
    - Security implementation
    - Automated testing suite`,
    
    `Enterprise application migration:
    - Legacy system analysis and documentation
    - Database migration from Oracle to PostgreSQL
    - API modernization from SOAP to GraphQL
    - Frontend rewrite from jQuery to React
    - Microservices decomposition
    - Docker containerization
    - Kubernetes orchestration
    - Performance testing and optimization
    - Security audit and implementation
    - Staff training and documentation`
  ]
};

// Function to run example analysis
function runExampleAnalysis() {
  console.log('='.repeat(80));
  console.log('TASK COMPLEXITY ESTIMATOR - EXAMPLE ANALYSIS');
  console.log('='.repeat(80));

  for (const [level, tasks] of Object.entries(exampleTasks)) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`${level.toUpperCase()} TASKS`);
    console.log('='.repeat(40));

    tasks.forEach((task, index) => {
      console.log(`\n--- Example ${index + 1} ---`);
      console.log(`Task: "${task.length > 100 ? task.substring(0, 100) + '...' : task}"`);
      
      const result = estimateTaskComplexity(task);
      
      console.log(`Category: ${result.category}`);
      console.log(`Score: ${result.totalScore}/20`);
      console.log(`Confidence: ${Math.round(result.confidence * 100)}%`);
      console.log(`Estimated Effort: ${result.analysis.estimatedEffort}`);
      console.log(`Work Type: ${result.analysis.workType}`);
      
      if (result.breakdown.technicalDomains.length > 0) {
        console.log(`Domains: ${result.breakdown.technicalDomains.map(d => d.domain).join(', ')}`);
      }
      
      if (result.recommendations.length > 0) {
        console.log(`Top Recommendation: ${result.recommendations[0]}`);
      }
    });
  }
}

// Function to demonstrate detailed analysis
function demonstrateDetailedAnalysis() {
  console.log('\n' + '='.repeat(80));
  console.log('DETAILED COMPLEXITY ANALYSIS EXAMPLE');
  console.log('='.repeat(80));

  const complexTask = `
    Build a comprehensive project management system with the following requirements:
    
    Backend Architecture:
    - REST API with GraphQL endpoints
    - Microservices for users, projects, tasks, and notifications
    - PostgreSQL database with optimized indexing
    - Redis caching layer for session management
    - JWT authentication with role-based permissions
    - Real-time updates using WebSocket connections
    
    Frontend Development:
    - React application with TypeScript
    - Responsive design for mobile and desktop
    - Component library with Storybook documentation
    - State management using Redux Toolkit
    - Real-time notifications and chat
    - File upload and document management
    
    Integration & Services:
    - Email service integration for notifications
    - Calendar API integration (Google, Outlook)
    - Third-party authentication (OAuth2)
    - Payment processing for premium features
    - Analytics and reporting dashboard
    - Export functionality (PDF, Excel, CSV)
    
    DevOps & Deployment:
    - Docker containerization
    - Kubernetes orchestration
    - CI/CD pipeline with automated testing
    - Database migration scripts
    - Performance monitoring and logging
    - Security scanning and compliance
    
    Testing & Quality:
    - Unit tests with 90% coverage
    - Integration tests for API endpoints
    - E2E tests with Cypress
    - Load testing and performance benchmarks
    - Code quality gates and linting
    - Security penetration testing
    
    Documentation & Training:
    - API documentation with OpenAPI
    - User guides and tutorials
    - Developer onboarding documentation
    - Video tutorials for end users
    - Technical architecture diagrams
  `;

  const result = estimateTaskComplexity(complexTask);
  const report = generateComplexityReport(complexTask);
  
  console.log('\n--- FULL COMPLEXITY REPORT ---\n');
  console.log(report);
  
  console.log('\n--- DETAILED BREAKDOWN ---\n');
  console.log('Technical Domains:');
  result.breakdown.technicalDomains.forEach(domain => {
    console.log(`  - ${domain.domain}: ${domain.score.toFixed(1)} (keywords: ${domain.keywords.join(', ')})`);
  });
  
  console.log('\nIdentified Features:');
  result.analysis.identifiedFeatures.slice(0, 10).forEach(feature => {
    console.log(`  - ${feature}`);
  });
  
  console.log('\nIntegration Points:');
  result.analysis.integrationPoints.forEach(point => {
    console.log(`  - ${point}`);
  });
  
  console.log('\nAll Recommendations:');
  result.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
}

// Function to compare different task variations
function compareTaskVariations() {
  console.log('\n' + '='.repeat(80));
  console.log('TASK VARIATION COMPARISON');
  console.log('='.repeat(80));

  const baseTask = 'Create a user registration form';
  const variations = [
    'Create a user registration form',
    'Create a user registration form with email validation',
    'Create a user registration form with email validation and database storage',
    'Create a user registration form with email validation, database storage, and JWT authentication',
    'Create a user registration form with email validation, database storage, JWT authentication, and OAuth2 integration',
    'Create a user registration form with email validation, database storage, JWT authentication, OAuth2 integration, and real-time verification'
  ];

  variations.forEach((task, index) => {
    const result = estimateTaskComplexity(task);
    console.log(`\nVariation ${index + 1}:`);
    console.log(`Task: "${task}"`);
    console.log(`Category: ${result.category} | Score: ${result.totalScore} | Effort: ${result.analysis.estimatedEffort}`);
    console.log(`Domains: ${result.breakdown.technicalDomains.map(d => d.domain).join(', ') || 'None identified'}`);
  });
}

// Function to demonstrate batch analysis
function demonstrateBatchAnalysis() {
  console.log('\n' + '='.repeat(80));
  console.log('BATCH TASK ANALYSIS');
  console.log('='.repeat(80));

  const projectTasks = [
    'Set up project repository and basic structure',
    'Design database schema and relationships',
    'Implement user authentication system',
    'Create REST API endpoints for core functionality',
    'Build responsive frontend interface',
    'Integrate third-party payment system',
    'Implement real-time notifications',
    'Add comprehensive test coverage',
    'Set up CI/CD pipeline and deployment',
    'Performance optimization and monitoring'
  ];

  console.log('\nProject Task Analysis Summary:');
  console.log('-'.repeat(40));

  let totalScore = 0;
  const categories: { [key: string]: number } = {};
  
  projectTasks.forEach((task, index) => {
    const result = estimateTaskComplexity(task);
    totalScore += result.totalScore;
    categories[result.category] = (categories[result.category] || 0) + 1;
    
    console.log(`${index + 1}. ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`);
    console.log(`   ${result.category} (${result.totalScore.toFixed(1)}) - ${result.analysis.estimatedEffort}`);
  });

  console.log('\nProject Summary:');
  console.log(`Total Complexity Score: ${totalScore.toFixed(1)}`);
  console.log(`Average Task Score: ${(totalScore / projectTasks.length).toFixed(1)}`);
  console.log('Task Distribution:');
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} tasks`);
  });
  
  const estimatedTotalEffort = projectTasks.reduce((total, task) => {
    const result = estimateTaskComplexity(task);
    const effort = result.analysis.estimatedEffort;
    
    // Simple effort to hours conversion for demo
    if (effort.includes('hours')) {
      const hours = parseInt(effort.split('-')[1] || effort.split('-')[0]);
      return total + hours;
    } else if (effort.includes('days')) {
      const days = parseInt(effort.split('-')[1] || effort.split('-')[0]);
      return total + (days * 8); // 8 hours per day
    } else if (effort.includes('weeks')) {
      const weeks = parseInt(effort.split('-')[1] || effort.split('-')[0]);
      return total + (weeks * 40); // 40 hours per week
    }
    return total;
  }, 0);
  
  console.log(`Estimated Total Effort: ~${Math.round(estimatedTotalEffort)} hours (${Math.round(estimatedTotalEffort / 40)} weeks)`);
}

// Main execution function
export function runComplexityAnalysisExamples() {
  try {
    runExampleAnalysis();
    demonstrateDetailedAnalysis();
    compareTaskVariations();
    demonstrateBatchAnalysis();
    
    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    console.log('The Task Complexity Estimator provides systematic analysis of:');
    console.log('- Technical domain identification');
    console.log('- Feature complexity scoring');
    console.log('- Integration point analysis');
    console.log('- Dependency mapping');
    console.log('- Work type determination');
    console.log('- Effort estimation');
    console.log('- Team recommendations');
    console.log('\nUse this tool to better plan and scope your development tasks!');
    
  } catch (error) {
    console.error('Error running complexity analysis examples:', error);
  }
}

// Export individual example functions for selective use
export {
  runExampleAnalysis,
  demonstrateDetailedAnalysis,
  compareTaskVariations,
  demonstrateBatchAnalysis,
  exampleTasks
};

// Run examples if this file is executed directly
if (require.main === module) {
  runComplexityAnalysisExamples();
}