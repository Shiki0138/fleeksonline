/**
 * Agent Selection Optimizer
 * 
 * Intelligent agent selection system for Claude Flow that:
 * - Maps task keywords to required agent skills
 * - Determines optimal agent combinations
 * - Considers task dependencies and workflow
 * - Balances workload distribution
 * - Minimizes resource usage while maximizing efficiency
 */

class AgentSelectionOptimizer {
    constructor() {
        this.agentTypes = this.initializeAgentTypes();
        this.taskKeywordMap = this.initializeTaskKeywordMap();
        this.dependencyGraph = new Map();
        this.resourceManager = new ResourceManager();
    }

    /**
     * Initialize available agent types with their capabilities
     */
    initializeAgentTypes() {
        return {
            // Core Development Agents
            coordinator: {
                skills: ['task-management', 'progress-tracking', 'workflow-orchestration', 'resource-allocation'],
                complexity: 'medium',
                resourceCost: 3,
                parallelCapability: true,
                dependencies: [],
                specializations: ['project-coordination', 'team-management', 'progress-monitoring']
            },
            researcher: {
                skills: ['documentation', 'analysis', 'best-practices', 'requirement-gathering', 'technical-research'],
                complexity: 'low',
                resourceCost: 2,
                parallelCapability: true,
                dependencies: [],
                specializations: ['market-research', 'technical-documentation', 'competitive-analysis']
            },
            coder: {
                skills: ['implementation', 'code-generation', 'feature-development', 'bug-fixing', 'refactoring'],
                complexity: 'high',
                resourceCost: 4,
                parallelCapability: true,
                dependencies: ['architect', 'reviewer'],
                specializations: ['frontend', 'backend', 'full-stack', 'api-development']
            },
            tester: {
                skills: ['test-creation', 'quality-assurance', 'validation', 'test-automation', 'coverage-analysis'],
                complexity: 'medium',
                resourceCost: 3,
                parallelCapability: true,
                dependencies: ['coder'],
                specializations: ['unit-testing', 'integration-testing', 'e2e-testing', 'performance-testing']
            },
            analyst: {
                skills: ['performance-optimization', 'bottleneck-analysis', 'data-analysis', 'metrics-evaluation'],
                complexity: 'high',
                resourceCost: 4,
                parallelCapability: false,
                dependencies: ['coder', 'tester'],
                specializations: ['performance-analysis', 'security-analysis', 'code-quality-analysis']
            },
            architect: {
                skills: ['system-design', 'architecture-decisions', 'scalability-planning', 'technology-selection'],
                complexity: 'high',
                resourceCost: 5,
                parallelCapability: false,
                dependencies: ['researcher'],
                specializations: ['system-architecture', 'database-design', 'microservices', 'cloud-architecture']
            },
            reviewer: {
                skills: ['code-review', 'quality-control', 'best-practices-enforcement', 'security-review'],
                complexity: 'medium',
                resourceCost: 3,
                parallelCapability: true,
                dependencies: ['coder'],
                specializations: ['security-review', 'performance-review', 'maintainability-review']
            },
            optimizer: {
                skills: ['performance-tuning', 'resource-optimization', 'efficiency-improvement', 'cost-reduction'],
                complexity: 'high',
                resourceCost: 4,
                parallelCapability: false,
                dependencies: ['analyst'],
                specializations: ['database-optimization', 'algorithm-optimization', 'infrastructure-optimization']
            }
        };
    }

    /**
     * Initialize task keyword mapping to agent skills
     */
    initializeTaskKeywordMap() {
        return {
            // Development Keywords
            'implement': ['coder', 'architect'],
            'build': ['coder', 'architect'],
            'create': ['coder', 'architect'],
            'develop': ['coder', 'architect'],
            'code': ['coder', 'reviewer'],
            'feature': ['coder', 'architect', 'tester'],
            'function': ['coder', 'reviewer'],
            'component': ['coder', 'architect'],
            'api': ['coder', 'architect', 'tester'],
            'endpoint': ['coder', 'tester'],
            
            // Testing Keywords
            'test': ['tester', 'coder'],
            'testing': ['tester', 'coder'],
            'validate': ['tester', 'reviewer'],
            'verify': ['tester', 'reviewer'],
            'coverage': ['tester', 'analyst'],
            'quality': ['tester', 'reviewer', 'analyst'],
            'e2e': ['tester'],
            'integration': ['tester', 'coder'],
            'unit': ['tester', 'coder'],
            
            // Architecture Keywords
            'design': ['architect', 'researcher'],
            'architecture': ['architect', 'researcher'],
            'structure': ['architect', 'coder'],
            'pattern': ['architect', 'coder'],
            'framework': ['architect', 'researcher'],
            'scalability': ['architect', 'optimizer'],
            'microservices': ['architect', 'coder'],
            'database': ['architect', 'coder'],
            
            // Performance Keywords
            'optimize': ['optimizer', 'analyst'],
            'performance': ['optimizer', 'analyst'],
            'speed': ['optimizer', 'analyst'],
            'efficiency': ['optimizer', 'analyst'],
            'bottleneck': ['analyst', 'optimizer'],
            'memory': ['optimizer', 'analyst'],
            'cpu': ['optimizer', 'analyst'],
            'latency': ['optimizer', 'analyst'],
            
            // Research Keywords
            'research': ['researcher'],
            'analyze': ['researcher', 'analyst'],
            'investigate': ['researcher', 'analyst'],
            'study': ['researcher'],
            'documentation': ['researcher', 'reviewer'],
            'requirements': ['researcher', 'architect'],
            'specification': ['researcher', 'architect'],
            
            // Review Keywords
            'review': ['reviewer', 'analyst'],
            'audit': ['reviewer', 'analyst'],
            'check': ['reviewer', 'tester'],
            'inspect': ['reviewer', 'analyst'],
            'security': ['reviewer', 'analyst'],
            'compliance': ['reviewer', 'analyst'],
            
            // Coordination Keywords
            'coordinate': ['coordinator'],
            'manage': ['coordinator'],
            'orchestrate': ['coordinator'],
            'organize': ['coordinator'],
            'plan': ['coordinator', 'architect'],
            'schedule': ['coordinator'],
            'workflow': ['coordinator', 'architect']
        };
    }

    /**
     * Main selection method - analyzes task and returns optimal agent selection
     */
    selectAgents(task, options = {}) {
        const {
            strategy = 'balanced',
            maxAgents = 8,
            resourceBudget = 20,
            preferParallel = true,
            taskComplexity = 'medium',
            timeline = 'normal'
        } = options;

        // Step 1: Parse task and extract keywords
        const taskAnalysis = this.analyzeTask(task);
        
        // Step 2: Map keywords to required skills
        const requiredSkills = this.mapKeywordsToSkills(taskAnalysis.keywords);
        
        // Step 3: Find candidate agents
        const candidateAgents = this.findCandidateAgents(requiredSkills);
        
        // Step 4: Apply selection strategy
        const selectedAgents = this.applySelectionStrategy(
            candidateAgents,
            strategy,
            { maxAgents, resourceBudget, preferParallel, taskComplexity, timeline }
        );
        
        // Step 5: Determine coordination pattern
        const coordinationPattern = this.determineCoordinationPattern(selectedAgents, taskAnalysis);
        
        // Step 6: Calculate resource allocation
        const resourceAllocation = this.calculateResourceAllocation(selectedAgents);
        
        return {
            selectedAgents,
            coordinationPattern,
            resourceAllocation,
            taskAnalysis,
            recommendations: this.generateRecommendations(selectedAgents, taskAnalysis, strategy)
        };
    }

    /**
     * Analyze task to extract keywords, complexity, and requirements
     */
    analyzeTask(task) {
        const keywords = this.extractKeywords(task.toLowerCase());
        const complexity = this.assessComplexity(task, keywords);
        const dependencies = this.identifyDependencies(keywords);
        const parallelizable = this.assessParallelizability(keywords);
        
        return {
            originalTask: task,
            keywords,
            complexity,
            dependencies,
            parallelizable,
            estimatedDuration: this.estimateDuration(complexity, keywords),
            criticalPath: this.identifyCriticalPath(dependencies)
        };
    }

    /**
     * Extract relevant keywords from task description
     */
    extractKeywords(task) {
        const keywords = [];
        const words = task.split(/\s+/);
        
        for (const word of words) {
            const cleanWord = word.replace(/[^\w]/g, '');
            if (this.taskKeywordMap[cleanWord]) {
                keywords.push(cleanWord);
            }
        }
        
        // Also check for phrase matches
        const phrases = [
            'code review', 'performance optimization', 'system design',
            'test automation', 'api development', 'database design',
            'security audit', 'load testing', 'user interface'
        ];
        
        for (const phrase of phrases) {
            if (task.includes(phrase)) {
                keywords.push(phrase.replace(/\s+/g, '-'));
            }
        }
        
        return [...new Set(keywords)];
    }

    /**
     * Assess task complexity based on keywords and structure
     */
    assessComplexity(task, keywords) {
        let complexityScore = 0;
        
        // Base complexity from keywords
        const complexityKeywords = {
            'high': ['architecture', 'design', 'optimize', 'scalability', 'performance', 'security'],
            'medium': ['implement', 'test', 'review', 'analyze', 'integrate'],
            'low': ['research', 'documentation', 'simple', 'basic', 'fix']
        };
        
        for (const keyword of keywords) {
            if (complexityKeywords.high.includes(keyword)) complexityScore += 3;
            else if (complexityKeywords.medium.includes(keyword)) complexityScore += 2;
            else if (complexityKeywords.low.includes(keyword)) complexityScore += 1;
        }
        
        // Task length factor
        if (task.length > 200) complexityScore += 2;
        else if (task.length > 100) complexityScore += 1;
        
        // Multiple components factor
        const componentKeywords = ['component', 'service', 'module', 'system'];
        if (componentKeywords.some(k => keywords.includes(k))) complexityScore += 2;
        
        if (complexityScore >= 8) return 'high';
        if (complexityScore >= 4) return 'medium';
        return 'low';
    }

    /**
     * Map extracted keywords to required agent skills
     */
    mapKeywordsToSkills(keywords) {
        const skillsMap = new Map();
        
        for (const keyword of keywords) {
            const agents = this.taskKeywordMap[keyword] || [];
            for (const agent of agents) {
                if (!skillsMap.has(agent)) {
                    skillsMap.set(agent, { relevance: 0, keywords: [] });
                }
                skillsMap.get(agent).relevance += 1;
                skillsMap.get(agent).keywords.push(keyword);
            }
        }
        
        return skillsMap;
    }

    /**
     * Find candidate agents based on required skills
     */
    findCandidateAgents(requiredSkills) {
        const candidates = [];
        
        for (const [agentType, skillData] of requiredSkills.entries()) {
            const agentConfig = this.agentTypes[agentType];
            if (agentConfig) {
                candidates.push({
                    type: agentType,
                    relevance: skillData.relevance,
                    matchedKeywords: skillData.keywords,
                    config: agentConfig,
                    suitabilityScore: this.calculateSuitabilityScore(agentConfig, skillData)
                });
            }
        }
        
        return candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }

    /**
     * Calculate suitability score for agent selection
     */
    calculateSuitabilityScore(agentConfig, skillData) {
        let score = skillData.relevance * 10; // Base relevance score
        
        // Bonus for specialized skills
        const specializedBonus = agentConfig.skills.filter(skill => 
            skillData.keywords.some(keyword => skill.includes(keyword))
        ).length * 5;
        
        score += specializedBonus;
        
        // Penalty for high resource cost if not highly relevant
        if (agentConfig.resourceCost > 3 && skillData.relevance < 2) {
            score -= (agentConfig.resourceCost - 3) * 3;
        }
        
        return Math.max(0, score);
    }

    /**
     * Apply selection strategy to choose optimal agents
     */
    applySelectionStrategy(candidates, strategy, options) {
        switch (strategy) {
            case 'optimal':
                return this.selectOptimalAgents(candidates, options);
            case 'minimal':
                return this.selectMinimalAgents(candidates, options);
            case 'balanced':
            default:
                return this.selectBalancedAgents(candidates, options);
        }
    }

    /**
     * Optimal strategy - maximize capability regardless of cost
     */
    selectOptimalAgents(candidates, options) {
        const selected = [];
        const { maxAgents } = options;
        let totalCost = 0;
        
        // Always include a coordinator for complex tasks
        const coordinator = candidates.find(c => c.type === 'coordinator');
        if (coordinator) {
            selected.push(coordinator);
            totalCost += coordinator.config.resourceCost;
        }
        
        // Select highest scoring agents within limits
        for (const candidate of candidates) {
            if (selected.length >= maxAgents) break;
            if (selected.some(s => s.type === candidate.type)) continue;
            
            selected.push(candidate);
            totalCost += candidate.config.resourceCost;
        }
        
        return selected;
    }

    /**
     * Minimal strategy - use fewest agents possible
     */
    selectMinimalAgents(candidates, options) {
        const selected = [];
        const covered = new Set();
        
        // Greedy selection - pick agents that cover most uncovered skills
        while (candidates.length > 0 && covered.size < candidates.length) {
            const bestCandidate = candidates.reduce((best, candidate) => {
                const newCoverage = candidate.matchedKeywords.filter(k => !covered.has(k)).length;
                const bestCoverage = best ? best.matchedKeywords.filter(k => !covered.has(k)).length : 0;
                return newCoverage > bestCoverage ? candidate : best;
            }, null);
            
            if (!bestCandidate) break;
            
            selected.push(bestCandidate);
            bestCandidate.matchedKeywords.forEach(k => covered.add(k));
            candidates.splice(candidates.indexOf(bestCandidate), 1);
        }
        
        return selected;
    }

    /**
     * Balanced strategy - optimize for efficiency and capability
     */
    selectBalancedAgents(candidates, options) {
        const { maxAgents, resourceBudget, taskComplexity } = options;
        const selected = [];
        let totalCost = 0;
        
        // Core team selection based on task complexity
        const coreTeam = this.selectCoreTeam(candidates, taskComplexity);
        for (const agent of coreTeam) {
            if (totalCost + agent.config.resourceCost <= resourceBudget) {
                selected.push(agent);
                totalCost += agent.config.resourceCost;
            }
        }
        
        // Fill remaining slots with highest value agents
        const remaining = candidates.filter(c => !selected.some(s => s.type === c.type));
        for (const candidate of remaining) {
            if (selected.length >= maxAgents || totalCost + candidate.config.resourceCost > resourceBudget) {
                break;
            }
            
            const valueScore = candidate.suitabilityScore / candidate.config.resourceCost;
            if (valueScore > 2) { // Minimum value threshold
                selected.push(candidate);
                totalCost += candidate.config.resourceCost;
            }
        }
        
        return selected;
    }

    /**
     * Select core team based on task complexity
     */
    selectCoreTeam(candidates, complexity) {
        const core = [];
        
        switch (complexity) {
            case 'high':
                // High complexity needs architecture, coordination, and specialized skills
                ['coordinator', 'architect', 'coder', 'analyst', 'reviewer'].forEach(type => {
                    const agent = candidates.find(c => c.type === type);
                    if (agent) core.push(agent);
                });
                break;
                
            case 'medium':
                // Medium complexity needs implementation and validation
                ['coordinator', 'coder', 'tester', 'reviewer'].forEach(type => {
                    const agent = candidates.find(c => c.type === type);
                    if (agent) core.push(agent);
                });
                break;
                
            case 'low':
                // Low complexity can be handled with minimal team
                ['coder', 'tester'].forEach(type => {
                    const agent = candidates.find(c => c.type === type);
                    if (agent) core.push(agent);
                });
                break;
        }
        
        return core;
    }

    /**
     * Determine optimal coordination pattern for selected agents
     */
    determineCoordinationPattern(selectedAgents, taskAnalysis) {
        const agentCount = selectedAgents.length;
        const complexity = taskAnalysis.complexity;
        const parallelizable = taskAnalysis.parallelizable;
        
        if (agentCount <= 2) {
            return {
                pattern: 'peer-to-peer',
                description: 'Direct collaboration between agents',
                topology: 'mesh'
            };
        }
        
        if (agentCount <= 4 && parallelizable) {
            return {
                pattern: 'parallel-execution',
                description: 'Parallel agent execution with coordination checkpoints',
                topology: 'star'
            };
        }
        
        if (complexity === 'high' || agentCount > 6) {
            return {
                pattern: 'hierarchical',
                description: 'Hierarchical coordination with coordinator as orchestrator',
                topology: 'hierarchical'
            };
        }
        
        return {
            pattern: 'collaborative-mesh',
            description: 'Mesh network with shared state and coordination',
            topology: 'mesh'
        };
    }

    /**
     * Calculate resource allocation for selected agents
     */
    calculateResourceAllocation(selectedAgents) {
        const totalCost = selectedAgents.reduce((sum, agent) => sum + agent.config.resourceCost, 0);
        const allocation = {};
        
        selectedAgents.forEach(agent => {
            const percentage = (agent.config.resourceCost / totalCost) * 100;
            allocation[agent.type] = {
                resourceCost: agent.config.resourceCost,
                percentage: Math.round(percentage),
                priority: agent.suitabilityScore > 20 ? 'high' : 
                         agent.suitabilityScore > 10 ? 'medium' : 'low'
            };
        });
        
        return {
            totalCost,
            agentAllocation: allocation,
            efficiency: this.calculateEfficiencyScore(selectedAgents)
        };
    }

    /**
     * Calculate efficiency score for the selected team
     */
    calculateEfficiencyScore(selectedAgents) {
        const totalSuitability = selectedAgents.reduce((sum, agent) => sum + agent.suitabilityScore, 0);
        const totalCost = selectedAgents.reduce((sum, agent) => sum + agent.config.resourceCost, 0);
        const parallelCapable = selectedAgents.filter(agent => agent.config.parallelCapability).length;
        
        const baseScore = totalSuitability / totalCost;
        const parallelBonus = (parallelCapable / selectedAgents.length) * 0.2;
        
        return Math.min(10, baseScore + parallelBonus);
    }

    /**
     * Generate recommendations for the selected team
     */
    generateRecommendations(selectedAgents, taskAnalysis, strategy) {
        const recommendations = [];
        
        // Team composition recommendations
        if (selectedAgents.length < 3 && taskAnalysis.complexity === 'high') {
            recommendations.push({
                type: 'warning',
                message: 'Consider adding more agents for high complexity task',
                suggestion: 'Add architect or analyst for better coverage'
            });
        }
        
        // Dependency recommendations
        const hasCoordinator = selectedAgents.some(a => a.type === 'coordinator');
        if (selectedAgents.length > 3 && !hasCoordinator) {
            recommendations.push({
                type: 'suggestion',
                message: 'Consider adding a coordinator for better orchestration',
                suggestion: 'Add coordinator agent to manage workflow'
            });
        }
        
        // Parallel execution recommendations
        const parallelCapable = selectedAgents.filter(a => a.config.parallelCapability).length;
        if (parallelCapable >= 2 && taskAnalysis.parallelizable) {
            recommendations.push({
                type: 'optimization',
                message: 'Task can benefit from parallel execution',
                suggestion: 'Use mesh or star topology for parallel processing'
            });
        }
        
        // Strategy-specific recommendations
        if (strategy === 'optimal') {
            recommendations.push({
                type: 'info',
                message: 'Optimal strategy selected - maximize capability',
                suggestion: 'Monitor resource usage and adjust if needed'
            });
        }
        
        return recommendations;
    }

    /**
     * Identify task dependencies
     */
    identifyDependencies(keywords) {
        const dependencies = [];
        
        // Common dependency patterns
        const dependencyMap = {
            'implement': ['design', 'architecture'],
            'test': ['implement', 'code'],
            'optimize': ['analyze', 'implement'],
            'deploy': ['test', 'review'],
            'review': ['implement', 'code']
        };
        
        for (const keyword of keywords) {
            if (dependencyMap[keyword]) {
                dependencies.push({
                    task: keyword,
                    dependencies: dependencyMap[keyword].filter(dep => keywords.includes(dep))
                });
            }
        }
        
        return dependencies;
    }

    /**
     * Assess if task can be parallelized
     */
    assessParallelizability(keywords) {
        const sequentialKeywords = ['deploy', 'integrate', 'merge', 'release'];
        const parallelKeywords = ['implement', 'test', 'research', 'analyze', 'review'];
        
        const hasSequential = keywords.some(k => sequentialKeywords.includes(k));
        const hasParallel = keywords.some(k => parallelKeywords.includes(k));
        
        return hasParallel && !hasSequential;
    }

    /**
     * Estimate task duration based on complexity and keywords
     */
    estimateDuration(complexity, keywords) {
        const baseDuration = {
            'low': 2,
            'medium': 6,
            'high': 12
        };
        
        let duration = baseDuration[complexity];
        
        // Adjust based on specific keywords
        const timeMultipliers = {
            'research': 0.5,
            'implement': 1.5,
            'optimize': 2.0,
            'architecture': 1.8,
            'test': 1.2
        };
        
        for (const keyword of keywords) {
            if (timeMultipliers[keyword]) {
                duration *= timeMultipliers[keyword];
            }
        }
        
        return Math.round(duration);
    }

    /**
     * Identify critical path in task dependencies
     */
    identifyCriticalPath(dependencies) {
        if (dependencies.length === 0) return [];
        
        // Simple critical path identification
        const path = [];
        const processed = new Set();
        
        for (const dep of dependencies) {
            if (!processed.has(dep.task)) {
                path.push(dep.task);
                processed.add(dep.task);
                
                // Add dependencies to path
                for (const subDep of dep.dependencies) {
                    if (!processed.has(subDep)) {
                        path.unshift(subDep);
                        processed.add(subDep);
                    }
                }
            }
        }
        
        return path;
    }
}

/**
 * Resource Manager for tracking and allocating resources
 */
class ResourceManager {
    constructor() {
        this.allocatedResources = new Map();
        this.resourcePool = {
            cpu: 100,
            memory: 100,
            network: 100
        };
    }
    
    allocateResources(agentType, cost) {
        if (!this.allocatedResources.has(agentType)) {
            this.allocatedResources.set(agentType, 0);
        }
        
        const current = this.allocatedResources.get(agentType);
        this.allocatedResources.set(agentType, current + cost);
        
        return {
            allocated: cost,
            total: current + cost,
            available: this.getAvailableResources()
        };
    }
    
    getAvailableResources() {
        const totalAllocated = Array.from(this.allocatedResources.values())
            .reduce((sum, cost) => sum + cost, 0);
        
        return Math.max(0, 100 - totalAllocated);
    }
    
    releaseResources(agentType) {
        this.allocatedResources.delete(agentType);
    }
}

module.exports = { AgentSelectionOptimizer, ResourceManager };