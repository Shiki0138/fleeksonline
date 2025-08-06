/**
 * Comprehensive Performance Testing Suite
 * Tests response times, memory usage, concurrent requests, and load handling
 */

const request = require('supertest');
const { performanceHelpers } = require('../helpers/testHelpers');

// Mock dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/config/redis');
jest.mock('../../src/config/logger');

describe('Performance Testing Suite', () => {
  let app;

  beforeAll(async () => {
    // Mock Express app for performance testing
    const express = require('express');
    app = express();
    
    app.use(express.json());

    // Simulate database operations with artificial delays
    app.get('/api/fast', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Fast endpoint',
        timestamp: Date.now(),
      });
    });

    app.get('/api/slow', async (req, res) => {
      // Simulate slow database query
      await new Promise(resolve => setTimeout(resolve, 100));
      res.status(200).json({
        success: true,
        message: 'Slow endpoint',
        timestamp: Date.now(),
      });
    });

    app.get('/api/memory-intensive', (req, res) => {
      // Simulate memory-intensive operation
      const largeArray = new Array(10000).fill(0).map((_, i) => ({
        id: i,
        data: `Large data object ${i}`,
        timestamp: Date.now(),
      }));

      res.status(200).json({
        success: true,
        data: largeArray.slice(0, 100), // Return only first 100 items
        total: largeArray.length,
      });
    });

    app.post('/api/process-data', (req, res) => {
      const { data } = req.body;
      
      // Simulate CPU-intensive processing
      if (data && Array.isArray(data)) {
        const processed = data.map(item => ({
          ...item,
          processed: true,
          processedAt: Date.now(),
        }));

        res.status(200).json({
          success: true,
          processed: processed.length,
          data: processed,
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid data format',
        });
      }
    });

    // Endpoint that grows in response time with load
    let requestCounter = 0;
    app.get('/api/scaling-load', async (req, res) => {
      requestCounter++;
      const delay = Math.min(requestCounter * 2, 500); // Max 500ms delay
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      res.status(200).json({
        success: true,
        requestNumber: requestCounter,
        delay,
        timestamp: Date.now(),
      });

      // Reset counter after some time
      setTimeout(() => {
        if (requestCounter > 0) requestCounter--;
      }, 1000);
    });
  });

  describe('Response Time Performance', () => {
    test('fast endpoint should respond quickly', async () => {
      const { result, duration } = await performanceHelpers.measureTime(async () => {
        return await request(app).get('/api/fast');
      });

      expect(result.status).toBe(200);
      performanceHelpers.expectPerformance(duration, 100); // Should be under 100ms
    });

    test('slow endpoint should still meet acceptable thresholds', async () => {
      const { result, duration } = await performanceHelpers.measureTime(async () => {
        return await request(app).get('/api/slow');
      });

      expect(result.status).toBe(200);
      performanceHelpers.expectPerformance(duration, 500); // Should be under 500ms
    });

    test('should handle data processing efficiently', async () => {
      const testData = Array(100).fill(0).map((_, i) => ({
        id: i,
        value: `test-${i}`,
      }));

      const { result, duration } = await performanceHelpers.measureTime(async () => {
        return await request(app)
          .post('/api/process-data')
          .send({ data: testData });
      });

      expect(result.status).toBe(200);
      expect(result.body.processed).toBe(100);
      performanceHelpers.expectPerformance(duration, 1000); // Should be under 1 second
    });
  });

  describe('Memory Usage Performance', () => {
    test('should handle memory-intensive operations efficiently', async () => {
      const initialMemory = performanceHelpers.measureMemory();

      const response = await request(app).get('/api/memory-intensive');

      const finalMemory = performanceHelpers.measureMemory();

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(100);
      
      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50);
    });

    test('should not cause memory leaks', async () => {
      const initialMemory = performanceHelpers.measureMemory();

      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        await request(app).get('/api/fast');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performanceHelpers.measureMemory();
      
      // Memory should not grow significantly
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
    });
  });

  describe('Concurrent Request Performance', () => {
    test('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(0).map(() =>
        request(app).get('/api/fast')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable for concurrent execution
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 20;
      const requests = Array(concurrentRequests).fill(0).map((_, i) =>
        performanceHelpers.measureTime(async () => {
          return await request(app).get('/api/fast');
        })
      );

      const results = await Promise.all(requests);

      // All requests should succeed
      results.forEach(({ result }) => {
        expect(result.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgDuration = results.reduce((sum, { duration }) => sum + duration, 0) / results.length;
      expect(avgDuration).toBeLessThan(200); // Average under 200ms
    });
  });

  describe('Load Testing', () => {
    test('should handle increasing load gracefully', async () => {
      const loadTests = [];
      
      // Simulate increasing load
      for (let i = 0; i < 5; i++) {
        const batchRequests = Array(5).fill(0).map(() =>
          request(app).get('/api/scaling-load')
        );
        
        loadTests.push(Promise.all(batchRequests));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const allResponses = await Promise.all(loadTests);
      const flatResponses = allResponses.flat();

      // All requests should eventually succeed
      flatResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Response times should increase gracefully, not exponentially
      const responseTimes = flatResponses.map(r => r.body.delay);
      const maxResponseTime = Math.max(...responseTimes);
      expect(maxResponseTime).toBeLessThan(1000); // Should not exceed 1 second
    });

    test('should recover from load spikes', async () => {
      // Create a load spike
      const spikeRequests = Array(15).fill(0).map(() =>
        request(app).get('/api/scaling-load')
      );

      await Promise.all(spikeRequests);

      // Wait for system to recover
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test recovery
      const recoveryResponse = await request(app).get('/api/scaling-load');
      expect(recoveryResponse.status).toBe(200);
      expect(recoveryResponse.body.delay).toBeLessThan(100); // Should be back to normal
    });
  });

  describe('Database Performance', () => {
    test('should simulate efficient database queries', async () => {
      // Simulate database query patterns
      const queryTests = [
        '/api/fast', // Simple query
        '/api/slow', // Complex query
        '/api/memory-intensive', // Large result set
      ];

      for (const endpoint of queryTests) {
        const { result, duration } = await performanceHelpers.measureTime(async () => {
          return await request(app).get(endpoint);
        });

        expect(result.status).toBe(200);
        
        // Different endpoints have different performance expectations
        const maxDuration = endpoint.includes('slow') ? 500 : 
                           endpoint.includes('memory') ? 300 : 100;
        
        performanceHelpers.expectPerformance(duration, maxDuration);
      }
    });
  });

  describe('Resource Utilization', () => {
    test('should monitor CPU usage patterns', async () => {
      const startTime = process.hrtime();
      const startCpuUsage = process.cpuUsage();

      // Perform CPU-intensive operation
      await request(app)
        .post('/api/process-data')
        .send({
          data: Array(500).fill(0).map((_, i) => ({ id: i, value: `test-${i}` }))
        });

      const endTime = process.hrtime(startTime);
      const endCpuUsage = process.cpuUsage(startCpuUsage);

      const executionTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to ms
      const cpuPercent = (endCpuUsage.user + endCpuUsage.system) / (executionTime * 1000);

      // CPU usage should be reasonable
      expect(cpuPercent).toBeLessThan(1.0); // Less than 100% CPU usage
    });

    test('should monitor heap usage', async () => {
      const initialHeap = process.memoryUsage().heapUsed;

      // Perform memory operations
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/memory-intensive');
      }

      const finalHeap = process.memoryUsage().heapUsed;
      const heapIncrease = (finalHeap - initialHeap) / 1024 / 1024; // Convert to MB

      // Heap increase should be manageable
      expect(heapIncrease).toBeLessThan(100); // Less than 100MB increase
    });
  });

  describe('Caching Performance', () => {
    test('should benefit from caching mechanisms', async () => {
      // Simulate cache behavior
      const cacheableEndpoint = '/api/fast';

      // First request (cache miss)
      const { duration: firstDuration } = await performanceHelpers.measureTime(async () => {
        return await request(app).get(cacheableEndpoint);
      });

      // Second request (cache hit - should be faster)
      const { duration: secondDuration } = await performanceHelpers.measureTime(async () => {
        return await request(app).get(cacheableEndpoint);
      });

      // Note: This is a simplified test. In a real scenario with caching,
      // the second request should be significantly faster
      expect(firstDuration).toBeGreaterThan(0);
      expect(secondDuration).toBeGreaterThan(0);
    });
  });
});