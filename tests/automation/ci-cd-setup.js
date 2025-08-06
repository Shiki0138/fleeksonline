/**
 * CI/CD Testing Automation Setup
 * Configures automated testing pipelines and quality gates
 */

const fs = require('fs');
const path = require('path');

class CICDTestingSetup {
  constructor() {
    this.config = {
      testEnvironments: ['test', 'staging', 'production'],
      qualityGates: {
        coverage: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80,
        },
        performance: {
          maxResponseTime: 1000,
          maxMemoryUsage: 512, // MB
          maxCpuUsage: 80, // %
        },
        security: {
          vulnerabilities: 0,
          securityScore: 85,
        },
      },
      testSuites: {
        unit: { timeout: 30000, parallel: true },
        integration: { timeout: 60000, parallel: false },
        e2e: { timeout: 120000, parallel: false },
        security: { timeout: 90000, parallel: true },
        performance: { timeout: 180000, parallel: false },
      },
    };
  }

  /**
   * Generate GitHub Actions workflow
   * @returns {string} YAML workflow content
   */
  generateGithubActionsWorkflow() {
    return `name: Comprehensive Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18.x'
  DATABASE_URL: \${{ secrets.DATABASE_URL }}
  REDIS_URL: \${{ secrets.REDIS_URL }}
  JWT_SECRET: \${{ secrets.JWT_SECRET }}

jobs:
  # Pre-flight checks
  preflight:
    runs-on: ubuntu-latest
    outputs:
      should-run-tests: \${{ steps.changes.outputs.should-run }}
    steps:
      - uses: actions/checkout@v3
      - name: Check for changes
        id: changes
        run: |
          echo "should-run=true" >> $GITHUB_OUTPUT

  # Dependency and security audit
  security-audit:
    needs: preflight
    if: needs.preflight.outputs.should-run-tests == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run dependency check
        run: npx better-npm-audit audit --level high

  # Linting and code quality
  code-quality:
    needs: preflight
    if: needs.preflight.outputs.should-run-tests == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run Prettier check
        run: npx prettier --check "src/**/*.js" "tests/**/*.js"

  # Unit tests
  unit-tests:
    needs: [security-audit, code-quality]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['16.x', '18.x', '20.x']
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
      
      - name: Upload unit test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: unit-test-results-\${{ matrix.node-version }}
          path: test-results.json

  # Integration tests
  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Upload integration test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: integration-test-results
          path: test-results.json

  # End-to-end tests
  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          npm run migrate:test
          npm run seed:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Start application
        run: |
          npm start &
          sleep 10
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          PORT: 3000
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000
      
      - name: Upload E2E test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-test-results
          path: test-results.json

  # Security tests
  security-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security tests
        run: npm run test:security
        env:
          NODE_ENV: test
      
      - name: Run SAST scan
        run: npx semgrep --config=auto src/
      
      - name: Upload security test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-test-results
          path: test-results.json

  # Performance tests
  performance-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run performance tests
        run: npm run test:performance
        env:
          NODE_ENV: test
      
      - name: Upload performance test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: performance-test-results
          path: test-results.json

  # Coverage analysis
  coverage:
    needs: [unit-tests, integration-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run coverage tests
        run: npm run test:coverage
        env:
          NODE_ENV: test
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Check coverage thresholds
        run: |
          node -e "
            const coverage = require('./coverage/coverage-summary.json');
            const thresholds = {
              statements: 80,
              branches: 75,
              functions: 80,
              lines: 80
            };
            
            let failed = false;
            Object.entries(thresholds).forEach(([key, threshold]) => {
              const actual = coverage.total[key].pct;
              if (actual < threshold) {
                console.error(\`Coverage for \${key} (\${actual}%) is below threshold (\${threshold}%)\`);
                failed = true;
              }
            });
            
            if (failed) process.exit(1);
            console.log('All coverage thresholds met!');
          "

  # Quality gates
  quality-gates:
    needs: [security-tests, performance-tests, coverage]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Download all test results
        uses: actions/download-artifact@v3
      
      - name: Evaluate quality gates
        run: |
          node -e "
            const fs = require('fs');
            const path = require('path');
            
            // Check all test results
            const testDirs = fs.readdirSync('.').filter(dir => 
              dir.includes('test-results') && fs.statSync(dir).isDirectory()
            );
            
            let allPassed = true;
            testDirs.forEach(dir => {
              const resultsFile = path.join(dir, 'test-results.json');
              if (fs.existsSync(resultsFile)) {
                const results = JSON.parse(fs.readFileSync(resultsFile));
                if (!results.summary.success) {
                  console.error(\`Quality gate failed for \${dir}\`);
                  allPassed = false;
                }
              }
            });
            
            if (!allPassed) {
              console.error('Quality gates failed!');
              process.exit(1);
            }
            
            console.log('All quality gates passed!');
          "

  # Deployment (only on main branch and after all tests pass)
  deploy:
    needs: quality-gates
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment steps here
      
      - name: Post-deployment smoke tests
        run: |
          echo "Running post-deployment smoke tests..."
          # Add smoke tests here

  # Notification
  notify:
    needs: [quality-gates, deploy]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Notify team
        run: |
          if [ "\${{ needs.quality-gates.result }}" == "success" ]; then
            echo "✅ All quality gates passed!"
          else
            echo "❌ Quality gates failed!"
          fi`;
  }

  /**
   * Generate Jest configuration for CI
   * @returns {Object} Jest configuration
   */
  generateJestCIConfig() {
    return {
      testEnvironment: 'node',
      collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/tests/**',
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
      coverageThreshold: this.config.qualityGates.coverage,
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
      testMatch: [
        '<rootDir>/tests/**/*.test.js',
      ],
      testPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
      ],
      verbose: true,
      forceExit: true,
      detectOpenHandles: true,
      maxWorkers: '50%',
      testTimeout: 30000,
      // CI-specific configurations
      ci: true,
      watchman: false,
      reporters: [
        'default',
        ['jest-junit', {
          outputDirectory: './test-results',
          outputName: 'junit.xml',
        }],
        ['jest-html-reporters', {
          publicPath: './test-results',
          filename: 'report.html',
        }],
      ],
    };
  }

  /**
   * Generate quality gates configuration
   * @returns {Object} Quality gates config
   */
  generateQualityGatesConfig() {
    return {
      gates: [
        {
          name: 'test-coverage',
          type: 'coverage',
          thresholds: this.config.qualityGates.coverage,
          required: true,
        },
        {
          name: 'performance',
          type: 'performance',
          thresholds: this.config.qualityGates.performance,
          required: true,
        },
        {
          name: 'security',
          type: 'security',
          thresholds: this.config.qualityGates.security,
          required: true,
        },
        {
          name: 'test-results',
          type: 'test-results',
          thresholds: {
            passRate: 95,
            maxFailures: 2,
          },
          required: true,
        },
      ],
      actions: {
        onPass: ['proceed', 'notify-success'],
        onFail: ['block', 'notify-failure', 'create-issue'],
      },
    };
  }

  /**
   * Generate Docker configuration for testing
   * @returns {string} Dockerfile content
   */
  generateTestDockerfile() {
    return `# Multi-stage Dockerfile for testing
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS test-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM test-deps AS test
COPY . .
RUN npm run lint
RUN npm run test:unit
RUN npm run test:integration
RUN npm run test:coverage

FROM base AS production
COPY --from=test-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;
  }

  /**
   * Generate database migration testing script
   * @returns {string} Migration test script
   */
  generateMigrationTestScript() {
    return `#!/bin/bash
# Database migration testing script

set -e

echo "🚀 Starting database migration tests..."

# Test environments
ENVIRONMENTS=("test" "staging")

for ENV in "\${ENVIRONMENTS[@]}"; do
    echo "📊 Testing migrations for \$ENV environment..."
    
    # Create test database
    DB_NAME="migration_test_\$ENV"
    createdb \$DB_NAME || true
    
    # Set environment variables
    export NODE_ENV=\$ENV
    export DATABASE_URL="postgresql://localhost/\$DB_NAME"
    
    # Test forward migrations
    echo "⬆️  Testing forward migrations..."
    npm run migrate:up
    
    # Verify schema
    echo "🔍 Verifying database schema..."
    psql \$DATABASE_URL -c "\\dt" > schema_\$ENV.txt
    
    # Test rollback migrations
    echo "⬇️  Testing rollback migrations..."
    npm run migrate:down
    
    # Test migration from scratch
    echo "🔄 Testing full migration from scratch..."
    npm run migrate:reset
    npm run migrate:up
    
    # Test seed data
    echo "🌱 Testing seed data..."
    npm run seed:run
    
    # Verify data integrity
    echo "✅ Verifying data integrity..."
    npm run test:data-integrity
    
    # Cleanup
    dropdb \$DB_NAME
    
    echo "✨ Migration tests completed for \$ENV environment"
done

echo "🎉 All migration tests passed!"`;
  }

  /**
   * Generate performance monitoring configuration
   * @returns {Object} Performance monitoring config
   */
  generatePerformanceMonitoringConfig() {
    return {
      metrics: {
        responseTime: {
          threshold: 1000,
          percentile: 95,
        },
        throughput: {
          threshold: 100, // requests per second
        },
        errorRate: {
          threshold: 0.01, // 1%
        },
        memoryUsage: {
          threshold: 512, // MB
        },
        cpuUsage: {
          threshold: 80, // %
        },
      },
      alerts: [
        {
          condition: 'responseTime > 2000',
          action: 'notify-team',
          severity: 'high',
        },
        {
          condition: 'errorRate > 0.05',
          action: 'rollback-deployment',
          severity: 'critical',
        },
        {
          condition: 'memoryUsage > 80%',
          action: 'scale-resources',
          severity: 'medium',
        },
      ],
      monitoring: {
        interval: 30, // seconds
        retention: '7d',
        dashboards: ['grafana', 'datadog'],
      },
    };
  }

  /**
   * Setup complete CI/CD testing infrastructure
   * @param {string} outputDir - Output directory for generated files
   */
  async setupCICDInfrastructure(outputDir = '.') {
    const files = {
      '.github/workflows/test.yml': this.generateGithubActionsWorkflow(),
      'jest.config.ci.js': `module.exports = ${JSON.stringify(this.generateJestCIConfig(), null, 2)};`,
      'quality-gates.json': JSON.stringify(this.generateQualityGatesConfig(), null, 2),
      'Dockerfile.test': this.generateTestDockerfile(),
      'scripts/test-migrations.sh': this.generateMigrationTestScript(),
      'monitoring.config.json': JSON.stringify(this.generatePerformanceMonitoringConfig(), null, 2),
    };

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(outputDir, filePath);
      const dir = path.dirname(fullPath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Generated: ${filePath}`);
    }

    // Make shell scripts executable
    const shellScripts = ['scripts/test-migrations.sh'];
    shellScripts.forEach(script => {
      const scriptPath = path.join(outputDir, script);
      if (fs.existsSync(scriptPath)) {
        fs.chmodSync(scriptPath, '755');
      }
    });

    console.log('🎉 CI/CD testing infrastructure setup complete!');
  }

  /**
   * Validate CI/CD configuration
   * @returns {Array} Validation results
   */
  validateCICDConfig() {
    const validations = [];

    // Check required files
    const requiredFiles = [
      'package.json',
      'jest.config.js',
      'tests/setup.js',
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        validations.push({ file, status: 'found', level: 'success' });
      } else {
        validations.push({ file, status: 'missing', level: 'error' });
      }
    });

    // Check package.json scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json'));
    const requiredScripts = [
      'test',
      'test:unit',
      'test:integration',
      'test:coverage',
      'lint',
    ];

    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        validations.push({ script, status: 'found', level: 'success' });
      } else {
        validations.push({ script, status: 'missing', level: 'warning' });
      }
    });

    return validations;
  }
}

module.exports = CICDTestingSetup;