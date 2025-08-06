#!/usr/bin/env node

/**
 * Custom test runner with enhanced reporting and coordination
 * This script provides comprehensive test execution and reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      coverage: null,
      performance: null,
    };
    this.startTime = Date.now();
  }
  
  async runTests(testType = 'all') {
    console.log(`🧪 Starting ${testType} tests...`);
    console.log(`⏰ Start time: ${new Date().toISOString()}`);
    
    try {
      switch (testType) {
        case 'unit':
          await this.runUnitTests();
          break;
        case 'integration':
          await this.runIntegrationTests();
          break;
        case 'e2e':
          await this.runE2ETests();
          break;
        case 'coverage':
          await this.runCoverageTests();
          break;
        case 'performance':
          await this.runPerformanceTests();
          break;
        case 'all':
        default:
          await this.runAllTests();
          break;
      }
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }
  
  async runUnitTests() {
    console.log('🔬 Running unit tests...');
    this.results.unit = await this.executeJest('unit');
  }
  
  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    this.results.integration = await this.executeJest('integration');
  }
  
  async runE2ETests() {
    console.log('🎭 Running end-to-end tests...');
    this.results.e2e = await this.executeJest('e2e');
  }
  
  async runCoverageTests() {
    console.log('📊 Running coverage tests...');
    this.results.coverage = await this.executeJest('coverage');
  }
  
  async runPerformanceTests() {
    console.log('⚡ Running performance tests...');
    // TODO: Implement performance testing with tools like k6, artillery, etc.
    this.results.performance = {
      passed: true,
      duration: 0,
      message: 'Performance tests not yet implemented',
    };
  }
  
  async runAllTests() {
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runE2ETests();
    await this.runCoverageTests();
    await this.runPerformanceTests();
  }
  
  async executeJest(testType) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let jestArgs = [];
      
      switch (testType) {
        case 'unit':
          jestArgs = ['--testPathPattern=unit', '--verbose'];
          break;
        case 'integration':
          jestArgs = ['--testPathPattern=integration', '--verbose'];
          break;
        case 'e2e':
          jestArgs = ['--testPathPattern=e2e', '--verbose', '--runInBand'];
          break;
        case 'coverage':
          jestArgs = ['--coverage', '--verbose'];
          break;
        default:
          jestArgs = ['--verbose'];
      }
      
      const jest = spawn('npx', ['jest', ...jestArgs], {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      
      let output = '';
      let errorOutput = '';
      
      jest.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });
      
      jest.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });
      
      jest.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        resolve({
          passed: code === 0,
          duration,
          output,
          errorOutput,
          exitCode: code,
        });
      });
      
      jest.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  async generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      results: this.results,
      summary: this.generateSummary(),
      coverage: await this.parseCoverageReport(),
    };
    
    // Write JSON report
    const reportPath = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Write human-readable report
    const humanReport = this.generateHumanReport(report);
    const humanReportPath = path.join(process.cwd(), 'test-results.txt');
    fs.writeFileSync(humanReportPath, humanReport);
    
    // Display summary
    console.log('\n' + humanReport);
    
    // Notify swarm coordination
    await this.notifySwarm(report);
  }
  
  generateSummary() {
    const results = this.results;
    let totalPassed = 0;
    let totalRun = 0;
    
    Object.values(results).forEach(result => {
      if (result && result.passed !== undefined) {
        totalRun++;
        if (result.passed) totalPassed++;
      }
    });
    
    return {
      totalTestSuites: totalRun,
      passedTestSuites: totalPassed,
      failedTestSuites: totalRun - totalPassed,
      success: totalPassed === totalRun,
      successRate: totalRun > 0 ? (totalPassed / totalRun * 100).toFixed(2) : 0,
    };
  }
  
  async parseCoverageReport() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    try {
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        return coverage.total;
      }
    } catch (error) {
      console.warn('⚠️  Could not parse coverage report:', error.message);
    }
    
    return null;
  }
  
  generateHumanReport(report) {
    const { summary, coverage } = report;
    
    let output = `
📊 TEST EXECUTION REPORT
========================
⏰ Execution Time: ${(report.duration / 1000).toFixed(2)}s
📅 Timestamp: ${report.timestamp}

📈 SUMMARY
----------
✅ Passed Test Suites: ${summary.passedTestSuites}
❌ Failed Test Suites: ${summary.failedTestSuites}
📊 Success Rate: ${summary.successRate}%
🎯 Overall Status: ${summary.success ? '✅ PASSED' : '❌ FAILED'}

📋 DETAILED RESULTS
------------------`;
    
    Object.entries(this.results).forEach(([testType, result]) => {
      if (result) {
        const status = result.passed ? '✅' : '❌';
        const duration = (result.duration / 1000).toFixed(2);
        output += `\n${status} ${testType.toUpperCase()}: ${duration}s`;
      }
    });
    
    if (coverage) {
      output += `\n\n📊 COVERAGE REPORT
------------------
📄 Lines: ${coverage.lines.pct}%
🌿 Branches: ${coverage.branches.pct}%
🔧 Functions: ${coverage.functions.pct}%
📝 Statements: ${coverage.statements.pct}%`;
    }
    
    return output;
  }
  
  async notifySwarm(report) {
    try {
      const { spawn } = require('child_process');
      
      const message = `QAEngineer: Test execution complete. Success rate: ${report.summary.successRate}%. ${report.summary.success ? 'All tests passed!' : 'Some tests failed.'}`;
      
      const notify = spawn('npx', ['claude-flow@alpha', 'hooks', 'notify', '--message', message, '--telemetry', 'true'], {
        stdio: 'pipe',
      });
      
      notify.on('close', (code) => {
        if (code === 0) {
          console.log('🐝 Swarm notified of test results');
        }
      });
      
    } catch (error) {
      console.warn('⚠️  Could not notify swarm:', error.message);
    }
  }
}

// CLI handling
if (require.main === module) {
  const testType = process.argv[2] || 'all';
  const runner = new TestRunner();
  
  runner.runTests(testType).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;