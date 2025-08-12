#!/usr/bin/env node

/**
 * Agent Selection Optimizer Demo
 * 
 * Interactive demonstration of the agent selection system
 * Shows real-time agent selection for different scenarios
 */

const { AgentOptimizationOrchestrator } = require('./AgentOptimizationOrchestrator');

class AgentSelectionDemo {
    constructor() {
        this.orchestrator = new AgentOptimizationOrchestrator({
            defaultStrategy: 'balanced',
            maxAgents: 8,
            resourceBudget: 25,
            enableLearning: true,
            enableMonitoring: true
        });
        
        this.scenarios = [
            {
                name: '🌐 Web Application Development',
                description: 'Standard web app with modern stack',
                task: 'Build a responsive web application with user authentication, real-time chat, and data visualization. Use React frontend, Node.js backend, PostgreSQL database, and Redis for caching.',
                options: {
                    timeline: 'normal',
                    qualityRequirements: 'high',
                    resourceBudget: 18
                }
            },
            {
                name: '🏗️ Microservices Architecture',
                description: 'Enterprise-scale distributed system',
                task: 'Design and implement a scalable microservices architecture for an e-commerce platform. Include API gateway, service discovery, distributed logging, monitoring, CI/CD pipeline, and handle high load with 99.9% uptime.',
                options: {
                    strategy: 'optimal',
                    timeline: 'extended',
                    qualityRequirements: 'critical',
                    resourceBudget: 35,
                    faultTolerance: true,
                    scalability: 'high'
                }
            },
            {
                name: '📱 Mobile App Prototype',
                description: 'Quick prototype development',
                task: 'Create a mobile app prototype for habit tracking with React Native. Simple UI for habit creation, daily check-ins, and basic progress statistics.',
                options: {
                    strategy: 'minimal',
                    timeline: 'urgent',
                    qualityRequirements: 'basic',
                    resourceBudget: 8
                }
            },
            {
                name: '🤖 AI/ML Model Development',
                description: 'Machine learning project',
                task: 'Develop a machine learning model for fraud detection in financial transactions. Include data preprocessing, feature engineering, model training, validation, deployment pipeline, and monitoring dashboard.',
                options: {
                    strategy: 'optimal',
                    timeline: 'extended',
                    qualityRequirements: 'critical',
                    resourceBudget: 30,
                    context: {
                        domain: 'machine-learning',
                        regulations: ['PCI-DSS', 'SOX']
                    }
                }
            },
            {
                name: '⚡ Performance Optimization',
                description: 'System performance improvement',
                task: 'Optimize performance of existing e-commerce platform experiencing slow load times. Implement caching, optimize database queries, compress assets, set up CDN, and improve code efficiency.',
                options: {
                    strategy: 'performance',
                    timeline: 'normal',
                    qualityRequirements: 'high',
                    resourceBudget: 15,
                    performance: 'critical'
                }
            }
        ];
    }

    /**
     * Run interactive demo
     */
    async runDemo() {
        console.log('🚀 Agent Selection Optimizer Demo\n');
        console.log('This demo showcases intelligent agent selection for different project scenarios.');
        console.log('Each scenario demonstrates how the system analyzes requirements and selects optimal teams.\n');
        
        // Show available strategies and patterns
        await this.showSystemCapabilities();
        
        // Run scenarios
        for (let i = 0; i < this.scenarios.length; i++) {
            await this.runScenario(this.scenarios[i], i + 1);
            
            if (i < this.scenarios.length - 1) {
                console.log('\n' + '='.repeat(80) + '\n');
                await this.sleep(2000); // Pause between scenarios
            }
        }
        
        // Show learning insights
        await this.showLearningInsights();
        
        // Performance summary
        await this.showPerformanceSummary();
        
        console.log('\n🎉 Demo completed! Thank you for exploring the Agent Selection Optimizer.');
    }

    /**
     * Show system capabilities
     */
    async showSystemCapabilities() {
        console.log('📋 System Capabilities:\n');
        
        console.log('🎯 Selection Strategies:');
        const strategies = ['optimal', 'minimal', 'balanced', 'adaptive', 'costEffective', 'performance'];
        strategies.forEach(strategy => {
            console.log(`   • ${strategy.charAt(0).toUpperCase() + strategy.slice(1)}`);
        });
        
        console.log('\n🔗 Coordination Patterns:');
        const patterns = ['hierarchical', 'mesh', 'star', 'ring', 'hybrid', 'pipeline'];
        patterns.forEach(pattern => {
            console.log(`   • ${pattern.charAt(0).toUpperCase() + pattern.slice(1)}`);
        });
        
        console.log('\n👥 Agent Types:');
        const agents = ['coordinator', 'researcher', 'coder', 'tester', 'analyst', 'architect', 'reviewer', 'optimizer'];
        agents.forEach(agent => {
            console.log(`   • ${agent.charAt(0).toUpperCase() + agent.slice(1)}`);
        });
        
        console.log('\n' + '-'.repeat(80) + '\n');
    }

    /**
     * Run individual scenario
     */
    async runScenario(scenario, scenarioNumber) {
        console.log(`${scenario.name} (${scenarioNumber}/${this.scenarios.length})`);
        console.log(`📝 ${scenario.description}\n`);
        
        console.log('🔍 Analyzing requirements...');
        const startTime = Date.now();
        
        try {
            const result = await this.orchestrator.orchestrateAgentSelection(
                scenario.task, 
                scenario.options
            );
            
            const executionTime = Date.now() - startTime;
            
            // Display results
            this.displayResults(result, executionTime);
            
        } catch (error) {
            console.error('❌ Selection failed:', error.message);
        }
    }

    /**
     * Display orchestration results
     */
    displayResults(result, executionTime) {
        console.log(`✅ Analysis completed in ${executionTime}ms\n`);
        
        // Task Analysis Summary
        console.log('📊 Task Analysis:');
        console.log(`   Complexity: ${result.taskAnalysis.complexity.level.toUpperCase()}`);
        console.log(`   Keywords: ${result.taskAnalysis.keywords.all.slice(0, 5).join(', ')}${result.taskAnalysis.keywords.all.length > 5 ? '...' : ''}`);
        console.log(`   Dependencies: ${result.taskAnalysis.dependencies.length} identified`);
        console.log(`   Parallelization: ${Math.round(result.taskAnalysis.parallelization.overallParallelizability * 100)}%`);
        console.log(`   Estimated Timeline: ${result.taskAnalysis.timeline.estimated} days`);
        
        // Strategy Selection
        console.log(`\n🎯 Selected Strategy: ${result.strategy.recommended.toUpperCase()}`);
        if (result.strategy.adjusted) {
            console.log(`   (Adjusted to: ${result.strategy.adjusted.toUpperCase()})`);
        }
        
        // Agent Team
        console.log(`\n👥 Selected Team (${result.agents.selectedAgents.length} agents):`);
        result.agents.selectedAgents.forEach(agent => {
            const suitability = Math.round(agent.suitabilityScore);
            const cost = agent.config.resourceCost;
            const parallel = agent.config.parallelCapability ? '⚡' : '⏱️';
            console.log(`   • ${agent.type.toUpperCase()} ${parallel} (Score: ${suitability}, Cost: ${cost})`);
        });
        
        // Coordination Pattern
        console.log(`\n🔗 Coordination Pattern: ${result.coordination.pattern.toUpperCase()}`);
        console.log(`   Communication Overhead: ${result.coordination.communicationOptimization?.bandwidth || 'N/A'} MB/s`);
        console.log(`   Expected Latency: ${result.coordination.communicationOptimization?.latency || 'N/A'} ms`);
        
        // Resource Allocation
        console.log(`\n💰 Resource Allocation:`);
        console.log(`   Total Cost: ${result.resources.totalCost} units`);
        console.log(`   Efficiency Score: ${result.resources.efficiency.toFixed(2)}/10`);
        
        // Confidence and Recommendations
        console.log(`\n📈 Confidence Level: ${result.confidence.level.toUpperCase()} (${Math.round(result.confidence.overall * 100)}%)`);
        
        if (result.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            result.recommendations.slice(0, 3).forEach(rec => {
                console.log(`   • ${rec.message}`);
            });
        }
        
        // Risk Assessment
        if (result.taskAnalysis.risks.length > 0) {
            console.log(`\n⚠️ Top Risks Identified:`);
            result.taskAnalysis.risks.slice(0, 2).forEach(risk => {
                console.log(`   • ${risk.description} (${risk.impact} impact)`);
            });
        }
    }

    /**
     * Show learning insights after all scenarios
     */
    async showLearningInsights() {
        console.log('\n🧠 Learning Insights:\n');
        
        try {
            const insights = await this.orchestrator.learnFromPastSelections();
            
            console.log('📊 Strategy Performance:');
            Object.entries(insights.bestStrategies).forEach(([strategy, score]) => {
                const percentage = Math.round(score * 100);
                const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
                console.log(`   ${strategy.padEnd(12)} ${bar} ${percentage}%`);
            });
            
            console.log('\n👥 Team Size Effectiveness:');
            Object.entries(insights.optimalTeamSizes).forEach(([size, score]) => {
                const percentage = Math.round(score * 100);
                const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
                console.log(`   ${size.padEnd(12)} ${bar} ${percentage}%`);
            });
            
            console.log('\n🔗 Pattern Efficiency:');
            Object.entries(insights.patternEfficiency).forEach(([pattern, score]) => {
                const percentage = Math.round(score * 100);
                const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
                console.log(`   ${pattern.padEnd(12)} ${bar} ${percentage}%`);
            });
            
        } catch (error) {
            console.log('Learning system is still collecting data...');
        }
    }

    /**
     * Show performance summary
     */
    async showPerformanceSummary() {
        console.log('\n⚡ Performance Summary:\n');
        
        const performanceData = this.orchestrator.performance;
        
        if (performanceData.selections.length > 0) {
            const avgTime = performanceData.selections.reduce((sum, s) => sum + s.orchestrationTime, 0) / performanceData.selections.length;
            const avgConfidence = performanceData.selections.reduce((sum, s) => sum + s.confidence, 0) / performanceData.selections.length;
            const avgCost = performanceData.selections.reduce((sum, s) => sum + s.resourceCost, 0) / performanceData.selections.length;
            
            console.log(`📈 Selections Processed: ${performanceData.selections.length}`);
            console.log(`⏱️ Average Selection Time: ${Math.round(avgTime)}ms`);
            console.log(`🎯 Average Confidence: ${Math.round(avgConfidence * 100)}%`);
            console.log(`💰 Average Resource Cost: ${Math.round(avgCost)} units`);
            
            // Performance grade
            let grade = 'C';
            if (avgTime < 200 && avgConfidence > 0.7) grade = 'A';
            else if (avgTime < 500 && avgConfidence > 0.6) grade = 'B';
            
            console.log(`📊 Overall Performance Grade: ${grade}`);
        }
        
        console.log('\n🔧 System Statistics:');
        console.log(`   Memory Usage: ~50MB (estimated)`);
        console.log(`   Concurrent Selections: Up to 10`);
        console.log(`   Learning Data: ${performanceData.selections.length}/1000 selections stored`);
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run demo if executed directly
if (require.main === module) {
    const demo = new AgentSelectionDemo();
    
    demo.runDemo().catch(error => {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    });
}

module.exports = { AgentSelectionDemo };