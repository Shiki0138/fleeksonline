/**
 * Usage Examples for Agent Selection Optimizer
 * 
 * Demonstrates various scenarios and use cases for the agent selection system
 */

const { AgentOptimizationOrchestrator } = require('../AgentOptimizationOrchestrator');

class UsageExamples {
    constructor() {
        this.orchestrator = new AgentOptimizationOrchestrator({
            defaultStrategy: 'balanced',
            maxAgents: 8,
            resourceBudget: 25,
            enableLearning: true
        });
    }

    /**
     * Example 1: Simple Web Application Development
     */
    async example1_SimpleWebApp() {
        console.log('\n=== Example 1: Simple Web Application Development ===');
        
        const task = `
            Create a simple web application with user authentication and a dashboard.
            The app should have a React frontend and Node.js backend with MongoDB.
            Include basic CRUD operations for user data and ensure responsive design.
            Timeline: 2 weeks, Budget: moderate, Quality: high
        `;

        const options = {
            resourceBudget: 15,
            timeline: 'normal',
            qualityRequirements: 'high',
            context: {
                teamExperience: 'mixed',
                technologies: ['react', 'nodejs', 'mongodb']
            }
        };

        const result = await this.orchestrator.orchestrateAgentSelection(task, options);
        
        console.log('🎯 Recommended Strategy:', result.strategy.recommended);
        console.log('👥 Selected Agents:', result.agents.selectedAgents.map(a => a.type));
        console.log('🔗 Coordination Pattern:', result.coordination.pattern);
        console.log('📊 Confidence:', result.confidence.level);
        console.log('💡 Key Recommendations:');
        result.recommendations.forEach(rec => 
            console.log(`   • ${rec.message}`)
        );
        
        return result;
    }

    /**
     * Example 2: Complex Microservices Architecture
     */
    async example2_MicroservicesArchitecture() {
        console.log('\n=== Example 2: Complex Microservices Architecture ===');
        
        const task = `
            Design and implement a scalable microservices architecture for an e-commerce platform.
            The system must handle high load, support multiple payment gateways, inventory management,
            order processing, user management, and real-time notifications. Include API gateway,
            service discovery, distributed logging, monitoring, and CI/CD pipeline.
            Requirements: 99.9% uptime, sub-200ms response times, handle 10k concurrent users.
            Technologies: Docker, Kubernetes, Redis, PostgreSQL, RabbitMQ, Elasticsearch.
        `;

        const options = {
            resourceBudget: 40,
            timeline: 'extended',
            qualityRequirements: 'very-high',
            faultTolerance: true,
            scalability: 'high',
            context: {
                teamExperience: 'senior',
                technologies: ['docker', 'kubernetes', 'microservices', 'redis', 'postgresql'],
                complexity: 'enterprise'
            }
        };

        const result = await this.orchestrator.orchestrateAgentSelection(task, options);
        
        console.log('🎯 Recommended Strategy:', result.strategy.recommended);
        console.log('👥 Selected Agents:', result.agents.selectedAgents.map(a => a.type));
        console.log('🔗 Coordination Pattern:', result.coordination.pattern);
        console.log('⚡ Parallelization Score:', result.taskAnalysis.parallelization.overallParallelizability);
        console.log('🏗️ Architecture Insights:', result.taskAnalysis.orchestrationInsights);
        
        return result;
    }

    /**
     * Example 3: AI/ML Model Development
     */
    async example3_MLModelDevelopment() {
        console.log('\n=== Example 3: AI/ML Model Development ===');
        
        const task = `
            Develop a machine learning model for fraud detection in financial transactions.
            The model should process real-time data streams, provide explainable AI results,
            and integrate with existing banking systems. Include data preprocessing, feature engineering,
            model training with multiple algorithms, hyperparameter tuning, model validation,
            deployment pipeline, and monitoring dashboard. Ensure compliance with financial regulations.
        `;

        const options = {
            strategy: 'optimal', // Force optimal strategy for ML projects
            resourceBudget: 35,
            timeline: 'extended',
            qualityRequirements: 'critical',
            context: {
                domain: 'machine-learning',
                regulations: ['PCI-DSS', 'GDPR'],
                data_sensitivity: 'high'
            }
        };

        const result = await this.orchestrator.orchestrateAgentSelection(task, options);
        
        console.log('🎯 Strategy Used:', result.strategy.recommended);
        console.log('🧠 Task Complexity:', result.taskAnalysis.complexity.level);
        console.log('👥 Agent Team:', result.agents.selectedAgents.map(a => `${a.type} (${a.suitabilityScore})`));
        console.log('📈 Resource Allocation:', result.resources.agents);
        
        return result;
    }

    /**
     * Example 4: Quick Prototype Development
     */
    async example4_QuickPrototype() {
        console.log('\n=== Example 4: Quick Prototype Development ===');
        
        const task = `
            Build a quick prototype for a mobile app that tracks daily habits.
            Simple UI with habit creation, daily check-ins, and basic statistics.
            Use React Native for cross-platform compatibility. Timeline: 1 week.
        `;

        const options = {
            strategy: 'minimal',
            resourceBudget: 8,
            timeline: 'urgent',
            qualityRequirements: 'basic',
            context: {
                project_type: 'prototype',
                platforms: ['ios', 'android']
            }
        };

        const result = await this.orchestrator.orchestrateAgentSelection(task, options);
        
        console.log('🎯 Strategy:', result.strategy.recommended);
        console.log('👥 Minimal Team:', result.agents.selectedAgents.map(a => a.type));
        console.log('⏱️ Estimated Timeline:', result.taskAnalysis.timeline.estimated, 'days');
        console.log('💰 Cost Efficiency:', result.agents.resourceAllocation.efficiency);
        
        return result;
    }

    /**
     * Example 5: Legacy System Migration
     */
    async example5_LegacyMigration() {
        console.log('\n=== Example 5: Legacy System Migration ===');
        
        const task = `
            Migrate a legacy monolithic application to modern cloud-native architecture.
            The current system is built with old Java frameworks and uses Oracle database.
            Target: Spring Boot microservices, PostgreSQL, AWS cloud deployment.
            Must ensure zero downtime during migration, data integrity, and performance improvement.
            Include comprehensive testing, rollback procedures, and team training.
        `;

        const options = {
            strategy: 'adaptive',
            resourceBudget: 30,
            timeline: 'extended',
            qualityRequirements: 'high',
            faultTolerance: true,
            context: {
                migration_type: 'legacy_modernization',
                risk_level: 'high',
                business_critical: true,
                existing_system: 'monolith'
            }
        };

        const result = await this.orchestrator.orchestrateAgentSelection(task, options);
        
        console.log('🎯 Adaptive Strategy Selected:', result.strategy.recommended);
        console.log('⚠️ Risk Assessment:', result.taskAnalysis.risks.length, 'risks identified');
        console.log('👥 Migration Team:', result.agents.selectedAgents.map(a => a.type));
        console.log('🔄 Coordination Pattern:', result.coordination.pattern);
        console.log('📋 Execution Phases:', result.executionPlan.phases.map(p => p.name));
        
        return result;
    }

    /**
     * Example 6: Performance Optimization Project
     */
    async example6_PerformanceOptimization() {
        console.log('\n=== Example 6: Performance Optimization Project ===');
        
        const task = `
            Optimize the performance of an existing e-commerce website that's experiencing
            slow load times and high bounce rates. Analyze current bottlenecks, implement
            caching strategies, optimize database queries, compress assets, implement CDN,
            and improve code efficiency. Target: 50% reduction in page load time.
        `;

        const options = {
            strategy: 'performance',
            resourceBudget: 20,
            timeline: 'normal',
            qualityRequirements: 'high',
            performance: 'critical',
            context: {
                project_type: 'optimization',
                current_metrics: {
                    load_time: '3.5s',
                    bounce_rate: '65%'
                },
                targets: {
                    load_time: '1.5s',
                    bounce_rate: '35%'
                }
            }
        };

        const result = await this.orchestrator.orchestrateAgentSelection(task, options);
        
        console.log('🎯 Performance Strategy:', result.strategy.recommended);
        console.log('⚡ Optimization Team:', result.agents.selectedAgents.map(a => a.type));
        console.log('📊 Success Metrics:', result.taskAnalysis.successMetrics.performance);
        console.log('🔍 Analysis Confidence:', result.taskAnalysis.confidence);
        
        return result;
    }

    /**
     * Run all examples
     */
    async runAllExamples() {
        console.log('🚀 Running Agent Selection Optimizer Examples...\n');
        
        const examples = [
            this.example1_SimpleWebApp,
            this.example2_MicroservicesArchitecture,
            this.example3_MLModelDevelopment,
            this.example4_QuickPrototype,
            this.example5_LegacyMigration,
            this.example6_PerformanceOptimization
        ];

        const results = [];
        
        for (const example of examples) {
            try {
                const result = await example.call(this);
                results.push(result);
                console.log('✅ Example completed successfully\n');
            } catch (error) {
                console.error('❌ Example failed:', error.message);
                results.push({ error: error.message });
            }
        }

        // Summary analysis
        console.log('\n=== Examples Summary ===');
        this.analyzResults(results);
        
        return results;
    }

    /**
     * Analyze results across examples
     */
    analyzResults(results) {
        const validResults = results.filter(r => !r.error);
        
        if (validResults.length === 0) {
            console.log('No valid results to analyze');
            return;
        }

        // Strategy usage
        const strategies = validResults.map(r => r.strategy.recommended);
        const strategyCount = strategies.reduce((count, strategy) => {
            count[strategy] = (count[strategy] || 0) + 1;
            return count;
        }, {});
        
        console.log('📊 Strategy Usage:');
        Object.entries(strategyCount).forEach(([strategy, count]) => 
            console.log(`   ${strategy}: ${count} times`)
        );

        // Average team sizes
        const teamSizes = validResults.map(r => r.agents.selectedAgents.length);
        const avgTeamSize = teamSizes.reduce((a, b) => a + b, 0) / teamSizes.length;
        console.log(`👥 Average Team Size: ${avgTeamSize.toFixed(1)} agents`);

        // Coordination patterns
        const patterns = validResults.map(r => r.coordination.pattern);
        const patternCount = patterns.reduce((count, pattern) => {
            count[pattern] = (count[pattern] || 0) + 1;
            return count;
        }, {});
        
        console.log('🔗 Coordination Patterns:');
        Object.entries(patternCount).forEach(([pattern, count]) => 
            console.log(`   ${pattern}: ${count} times`)
        );

        // Confidence levels
        const confidenceLevels = validResults.map(r => r.confidence.level);
        const confidenceCount = confidenceLevels.reduce((count, level) => {
            count[level] = (count[level] || 0) + 1;
            return count;
        }, {});
        
        console.log('🎯 Confidence Levels:');
        Object.entries(confidenceCount).forEach(([level, count]) => 
            console.log(`   ${level}: ${count} times`)
        );
    }

    /**
     * Demonstrate real-time agent selection for different scenarios
     */
    async demonstrateRealTimeSelection() {
        console.log('\n=== Real-Time Agent Selection Demonstration ===');
        
        const scenarios = [
            {
                name: 'Bug Fix',
                task: 'Fix critical security vulnerability in authentication module',
                options: { timeline: 'urgent', resourceBudget: 5 }
            },
            {
                name: 'Feature Enhancement',
                task: 'Add real-time chat feature to existing application',
                options: { timeline: 'normal', resourceBudget: 12 }
            },
            {
                name: 'Code Review',
                task: 'Review and refactor legacy codebase for maintainability',
                options: { timeline: 'flexible', resourceBudget: 8 }
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n--- ${scenario.name} ---`);
            const startTime = Date.now();
            
            const result = await this.orchestrator.orchestrateAgentSelection(
                scenario.task, 
                scenario.options
            );
            
            const selectionTime = Date.now() - startTime;
            
            console.log(`⚡ Selection Time: ${selectionTime}ms`);
            console.log(`👥 Selected: ${result.agents.selectedAgents.map(a => a.type).join(', ')}`);
            console.log(`🎯 Confidence: ${result.confidence.level}`);
        }
    }

    /**
     * Show learning capabilities
     */
    async demonstrateLearning() {
        console.log('\n=== Learning Capabilities Demonstration ===');
        
        // Simulate multiple selections to build learning data
        const tasks = [
            'Build REST API for user management',
            'Create responsive web dashboard',
            'Implement automated testing suite',
            'Optimize database performance',
            'Deploy application to cloud infrastructure'
        ];

        console.log('🧠 Training agent selection optimizer...');
        
        for (const task of tasks) {
            await this.orchestrator.orchestrateAgentSelection(task, {
                timeline: 'normal',
                resourceBudget: 15
            });
        }

        // Analyze learning insights
        const insights = await this.orchestrator.learnFromPastSelections();
        
        console.log('📊 Learning Insights:');
        console.log('   Best Strategies:', insights.bestStrategies);
        console.log('   Optimal Team Sizes:', insights.optimalTeamSizes);
        console.log('   Pattern Efficiency:', insights.patternEfficiency);
        
        return insights;
    }
}

// Export for use in other files
module.exports = { UsageExamples };

// If run directly, execute all examples
if (require.main === module) {
    const examples = new UsageExamples();
    
    (async () => {
        try {
            await examples.runAllExamples();
            await examples.demonstrateRealTimeSelection();
            await examples.demonstrateLearning();
            
            console.log('\n🎉 All examples completed successfully!');
        } catch (error) {
            console.error('💥 Examples failed:', error);
            process.exit(1);
        }
    })();
}