/**
 * Test Suite for Agent Selection Optimizer
 * 
 * Comprehensive tests covering:
 * - Task analysis and keyword extraction
 * - Agent selection strategies
 * - Coordination pattern selection
 * - Resource optimization
 * - Performance and edge cases
 */

const { AgentSelectionOptimizer } = require('../../src/agent-optimization/core/AgentSelectionOptimizer');
const { SelectionStrategies } = require('../../src/agent-optimization/strategies/SelectionStrategies');
const { CoordinationPatterns } = require('../../src/agent-optimization/coordinators/CoordinationPatterns');
const { TaskAnalyzer } = require('../../src/agent-optimization/analyzers/TaskAnalyzer');

describe('Agent Selection Optimizer', () => {
    let optimizer;

    beforeEach(() => {
        optimizer = new AgentSelectionOptimizer();
    });

    describe('Task Analysis', () => {
        test('should extract keywords correctly', () => {
            const task = 'Implement a secure web application with testing and optimization';
            const analysis = optimizer.analyzeTask(task);
            
            expect(analysis.keywords).toContain('implement');
            expect(analysis.keywords).toContain('test');
            expect(analysis.keywords).toContain('optimize');
            expect(analysis.keywords).toContain('secure');
        });

        test('should assess complexity correctly', () => {
            const complexTask = 'Design and implement a distributed microservices architecture with advanced security, real-time analytics, machine learning integration, and automated deployment pipeline';
            const simpleTask = 'Create a simple HTML page with basic styling';
            
            const complexAnalysis = optimizer.analyzeTask(complexTask);
            const simpleAnalysis = optimizer.analyzeTask(simpleTask);
            
            expect(complexAnalysis.complexity).toBe('high');
            expect(simpleAnalysis.complexity).toBe('low');
        });

        test('should identify dependencies', () => {
            const task = 'First design the architecture, then implement the features, and finally test the application';
            const analysis = optimizer.analyzeTask(task);
            
            expect(analysis.dependencies).toHaveLength(2);
            expect(analysis.dependencies[0].prerequisite).toBe('design');
            expect(analysis.dependencies[0].dependent).toBe('implement');
        });

        test('should assess parallelizability', () => {
            const parallelTask = 'Research best practices and analyze requirements while implementing basic features';
            const sequentialTask = 'Deploy the application after testing is complete';
            
            const parallelAnalysis = optimizer.analyzeTask(parallelTask);
            const sequentialAnalysis = optimizer.analyzeTask(sequentialTask);
            
            expect(parallelAnalysis.parallelizable).toBe(true);
            expect(sequentialAnalysis.parallelizable).toBe(false);
        });
    });

    describe('Agent Selection', () => {
        test('should select appropriate agents for web development task', () => {
            const task = 'Build a React web application with Node.js backend and MongoDB database';
            const result = optimizer.selectAgents(task, { strategy: 'balanced' });
            
            expect(result.selectedAgents).toBeDefined();
            expect(result.selectedAgents.length).toBeGreaterThan(0);
            
            const agentTypes = result.selectedAgents.map(a => a.type);
            expect(agentTypes).toContain('coder');
            expect(agentTypes).toContain('tester');
        });

        test('should respect maximum agent limit', () => {
            const task = 'Complex enterprise system with multiple components and integrations';
            const result = optimizer.selectAgents(task, { 
                strategy: 'optimal',
                maxAgents: 3 
            });
            
            expect(result.selectedAgents.length).toBeLessThanOrEqual(3);
        });

        test('should respect resource budget', () => {
            const task = 'Build a comprehensive application';
            const result = optimizer.selectAgents(task, { 
                strategy: 'balanced',
                resourceBudget: 10 
            });
            
            expect(result.resourceAllocation.totalCost).toBeLessThanOrEqual(10);
        });

        test('should prefer parallel-capable agents for parallelizable tasks', () => {
            const task = 'Research documentation and implement features and test components in parallel';
            const result = optimizer.selectAgents(task, { 
                strategy: 'performance',
                preferParallel: true 
            });
            
            const parallelCapableCount = result.selectedAgents.filter(
                a => a.config.parallelCapability
            ).length;
            
            expect(parallelCapableCount).toBeGreaterThan(0);
        });
    });

    describe('Selection Strategies', () => {
        let strategies;
        let candidateAgents;

        beforeEach(() => {
            strategies = new SelectionStrategies(optimizer);
            
            // Mock candidate agents
            candidateAgents = [
                {
                    type: 'coordinator',
                    suitabilityScore: 25,
                    config: { resourceCost: 3, parallelCapability: true },
                    matchedKeywords: ['coordinate', 'manage']
                },
                {
                    type: 'coder',
                    suitabilityScore: 30,
                    config: { resourceCost: 4, parallelCapability: true },
                    matchedKeywords: ['implement', 'build']
                },
                {
                    type: 'tester',
                    suitabilityScore: 20,
                    config: { resourceCost: 3, parallelCapability: true },
                    matchedKeywords: ['test', 'verify']
                }
            ];
        });

        test('optimal strategy should select highest scoring agents', () => {
            const result = strategies.executeStrategy('optimal', candidateAgents, {
                maxAgents: 5,
                resourceBudget: 50
            });
            
            expect(result.agents).toContain(candidateAgents[1]); // Highest scoring coder
            expect(result.strategy).toBe('optimal');
        });

        test('minimal strategy should use fewest agents', () => {
            const result = strategies.executeStrategy('minimal', candidateAgents, {
                maxAgents: 5,
                resourceBudget: 50
            });
            
            expect(result.agents.length).toBeLessThanOrEqual(2);
            expect(result.strategy).toBe('minimal');
        });

        test('balanced strategy should optimize value vs cost', () => {
            const result = strategies.executeStrategy('balanced', candidateAgents, {
                maxAgents: 5,
                resourceBudget: 15
            });
            
            expect(result.totalCost).toBeLessThanOrEqual(15);
            expect(result.agents.length).toBeGreaterThan(1);
            expect(result.strategy).toBe('balanced');
        });

        test('should recommend appropriate strategy based on task', () => {
            const taskAnalysis = {
                complexity: 'high',
                parallelizable: true,
                estimatedDuration: 10
            };
            
            const constraints = {
                resourceBudget: 25,
                timeline: 'normal',
                qualityRequirements: 'high'
            };
            
            const recommendation = strategies.recommendStrategy(taskAnalysis, constraints);
            
            expect(recommendation.recommended).toBeDefined();
            expect(recommendation.scores).toBeDefined();
            expect(recommendation.reasoning).toBeInstanceOf(Array);
        });
    });

    describe('Coordination Patterns', () => {
        let patterns;
        let mockAgents;
        let mockTaskAnalysis;

        beforeEach(() => {
            patterns = new CoordinationPatterns();
            
            mockAgents = [
                { type: 'coordinator', suitabilityScore: 25 },
                { type: 'coder', suitabilityScore: 30 },
                { type: 'tester', suitabilityScore: 20 }
            ];
            
            mockTaskAnalysis = {
                complexity: 'medium',
                parallelizable: true,
                dependencies: [
                    { prerequisite: 'design', dependent: 'implement' }
                ]
            };
        });

        test('should select appropriate pattern for team size', () => {
            const smallTeam = mockAgents.slice(0, 2);
            const largeTeam = [...mockAgents, ...mockAgents, ...mockAgents];
            
            const smallResult = patterns.selectPattern(smallTeam, mockTaskAnalysis);
            const largeResult = patterns.selectPattern(largeTeam, mockTaskAnalysis);
            
            expect(['mesh', 'star']).toContain(smallResult.pattern);
            expect(['hierarchical', 'hybrid']).toContain(largeResult.pattern);
        });

        test('should configure pattern correctly', () => {
            const result = patterns.selectPattern(mockAgents, mockTaskAnalysis);
            
            expect(result.configuration).toBeDefined();
            expect(result.pattern).toBeDefined();
            expect(result.implementation).toBeDefined();
        });

        test('should handle high complexity with hierarchical pattern', () => {
            const complexTask = { ...mockTaskAnalysis, complexity: 'high' };
            const result = patterns.selectPattern(mockAgents, complexTask);
            
            // Should favor hierarchical or hybrid for complex tasks
            expect(['hierarchical', 'hybrid', 'star']).toContain(result.pattern);
        });
    });

    describe('Task Analyzer', () => {
        let analyzer;

        beforeEach(() => {
            analyzer = new TaskAnalyzer();
        });

        test('should extract comprehensive task analysis', () => {
            const task = 'Build a secure e-commerce platform with real-time inventory management';
            const analysis = analyzer.analyzeTask(task);
            
            expect(analysis.keywords).toBeDefined();
            expect(analysis.complexity).toBeDefined();
            expect(analysis.requirements).toBeDefined();
            expect(analysis.skills).toBeDefined();
            expect(analysis.risks).toBeDefined();
        });

        test('should identify technical skills from task', () => {
            const task = 'Implement machine learning model using Python and TensorFlow for data analysis';
            const analysis = analyzer.analyzeTask(task);
            
            expect(analysis.skills.technical).toContain('python');
            expect(analysis.skills.technical).toContain('machine_learning');
        });

        test('should assess testability correctly', () => {
            const testableTask = 'Build API that returns user data within 200ms response time';
            const nonTestableTask = 'Make the application better and more user-friendly';
            
            const testableAnalysis = analyzer.analyzeTask(testableTask);
            const nonTestableAnalysis = analyzer.analyzeTask(nonTestableTask);
            
            expect(testableAnalysis.testability.level).toBe('high');
            expect(nonTestableAnalysis.testability.level).toBe('low');
        });

        test('should identify risks appropriately', () => {
            const riskyTask = 'Migrate critical banking system using new experimental technology within tight deadline';
            const analysis = analyzer.analyzeTask(riskyTask);
            
            expect(analysis.risks.length).toBeGreaterThan(0);
            expect(analysis.risks.some(r => r.type === 'technical')).toBe(true);
        });

        test('should estimate effort and timeline', () => {
            const simpleTask = 'Fix CSS styling bug';
            const complexTask = 'Design enterprise-scale distributed system architecture';
            
            const simpleAnalysis = analyzer.analyzeTask(simpleTask);
            const complexAnalysis = analyzer.analyzeTask(complexTask);
            
            expect(complexAnalysis.effort.estimated).toBeGreaterThan(simpleAnalysis.effort.estimated);
            expect(complexAnalysis.timeline.estimated).toBeGreaterThan(simpleAnalysis.timeline.estimated);
        });
    });

    describe('Integration Tests', () => {
        test('should handle end-to-end agent selection process', () => {
            const task = 'Create a full-stack web application with user authentication, data visualization, and automated testing';
            const options = {
                strategy: 'balanced',
                maxAgents: 6,
                resourceBudget: 25,
                timeline: 'normal'
            };
            
            const result = optimizer.selectAgents(task, options);
            
            expect(result).toBeDefined();
            expect(result.selectedAgents).toBeDefined();
            expect(result.coordinationPattern).toBeDefined();
            expect(result.resourceAllocation).toBeDefined();
            expect(result.recommendations).toBeDefined();
        });

        test('should handle edge cases gracefully', () => {
            const emptyTask = '';
            const veryLongTask = 'a'.repeat(10000);
            const specialCharsTask = 'Build app with @#$%^&*() special characters and émojis 🚀';
            
            expect(() => optimizer.selectAgents(emptyTask)).not.toThrow();
            expect(() => optimizer.selectAgents(veryLongTask)).not.toThrow();
            expect(() => optimizer.selectAgents(specialCharsTask)).not.toThrow();
        });

        test('should maintain consistency across multiple runs', () => {
            const task = 'Implement REST API with database integration';
            const options = { strategy: 'balanced' };
            
            const result1 = optimizer.selectAgents(task, options);
            const result2 = optimizer.selectAgents(task, options);
            
            // Results should be consistent for same inputs
            expect(result1.selectedAgents.length).toBe(result2.selectedAgents.length);
            expect(result1.coordinationPattern.pattern).toBe(result2.coordinationPattern.pattern);
        });
    });

    describe('Performance Tests', () => {
        test('should complete selection within reasonable time', () => {
            const task = 'Build complex enterprise application with multiple microservices';
            
            const startTime = Date.now();
            optimizer.selectAgents(task, { strategy: 'optimal' });
            const executionTime = Date.now() - startTime;
            
            // Should complete within 1 second
            expect(executionTime).toBeLessThan(1000);
        });

        test('should handle multiple concurrent selections', async () => {
            const tasks = [
                'Build web application',
                'Create mobile app',
                'Implement API service',
                'Design database schema',
                'Set up CI/CD pipeline'
            ];
            
            const startTime = Date.now();
            
            const promises = tasks.map(task => 
                Promise.resolve(optimizer.selectAgents(task, { strategy: 'balanced' }))
            );
            
            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            
            expect(results).toHaveLength(tasks.length);
            expect(totalTime).toBeLessThan(2000); // Should complete all within 2 seconds
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid strategy gracefully', () => {
            const task = 'Build application';
            
            expect(() => optimizer.selectAgents(task, { strategy: 'invalid-strategy' }))
                .not.toThrow();
        });

        test('should handle extreme resource constraints', () => {
            const task = 'Build complex enterprise system';
            const options = {
                maxAgents: 1,
                resourceBudget: 1
            };
            
            const result = optimizer.selectAgents(task, options);
            
            expect(result.selectedAgents.length).toBeLessThanOrEqual(1);
            expect(result.resourceAllocation.totalCost).toBeLessThanOrEqual(1);
        });

        test('should provide meaningful error messages', () => {
            // Test with null/undefined inputs
            expect(() => optimizer.selectAgents(null)).not.toThrow();
            expect(() => optimizer.selectAgents(undefined)).not.toThrow();
        });
    });
});

// Performance benchmark suite
describe('Performance Benchmarks', () => {
    let optimizer;

    beforeAll(() => {
        optimizer = new AgentSelectionOptimizer();
    });

    test('benchmark: simple task selection', () => {
        const task = 'Create a simple web page';
        const iterations = 100;
        
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            optimizer.selectAgents(task, { strategy: 'minimal' });
        }
        
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / iterations;
        
        console.log(`Simple task selection: ${avgTime.toFixed(2)}ms average`);
        expect(avgTime).toBeLessThan(50); // Should average under 50ms
    });

    test('benchmark: complex task selection', () => {
        const task = `
            Design and implement a comprehensive enterprise-scale distributed system
            with microservices architecture, event-driven communication, real-time
            analytics, machine learning integration, advanced security measures,
            automated testing, deployment pipelines, monitoring, and compliance features.
        `;
        const iterations = 10;
        
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            optimizer.selectAgents(task, { strategy: 'optimal' });
        }
        
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / iterations;
        
        console.log(`Complex task selection: ${avgTime.toFixed(2)}ms average`);
        expect(avgTime).toBeLessThan(200); // Should average under 200ms
    });
});