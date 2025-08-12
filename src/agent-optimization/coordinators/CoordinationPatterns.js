/**
 * Coordination Patterns
 * 
 * Defines and implements different coordination patterns for agent swarms:
 * - Hierarchical: Tree-like structure with clear command chain
 * - Mesh: Full connectivity between all agents
 * - Star: Central coordinator with spoke agents
 * - Ring: Circular communication pattern
 * - Hybrid: Combination of multiple patterns
 * - Pipeline: Sequential processing chain
 */

class CoordinationPatterns {
    constructor() {
        this.patterns = {
            hierarchical: new HierarchicalPattern(),
            mesh: new MeshPattern(),
            star: new StarPattern(),
            ring: new RingPattern(),
            hybrid: new HybridPattern(),
            pipeline: new PipelinePattern()
        };
    }

    /**
     * Select optimal coordination pattern based on agents and task
     */
    selectPattern(agents, taskAnalysis, options = {}) {
        const agentCount = agents.length;
        const complexity = taskAnalysis.complexity;
        const parallelizable = taskAnalysis.parallelizable;
        const dependencies = taskAnalysis.dependencies;

        // Decision matrix for pattern selection
        const scores = {};
        
        // Score each pattern based on context
        Object.keys(this.patterns).forEach(patternName => {
            scores[patternName] = this.calculatePatternScore(
                patternName, agentCount, complexity, parallelizable, dependencies, options
            );
        });

        // Find best pattern
        const bestPattern = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)[0][0];

        return {
            pattern: bestPattern,
            implementation: this.patterns[bestPattern],
            scores,
            configuration: this.configurePattern(bestPattern, agents, taskAnalysis, options)
        };
    }

    /**
     * Calculate score for each pattern based on context
     */
    calculatePatternScore(patternName, agentCount, complexity, parallelizable, dependencies, options) {
        let score = 0;
        const pattern = this.patterns[patternName];

        // Agent count factor
        if (agentCount >= pattern.minAgents && agentCount <= pattern.maxAgents) {
            score += 10;
        } else if (agentCount < pattern.minAgents) {
            score -= 5;
        } else if (agentCount > pattern.maxAgents) {
            score -= (agentCount - pattern.maxAgents) * 2;
        }

        // Complexity factor
        if (pattern.suitableComplexity.includes(complexity)) {
            score += 8;
        }

        // Parallelization factor
        if (parallelizable && pattern.supportsParallel) {
            score += 6;
        } else if (!parallelizable && !pattern.requiresParallel) {
            score += 4;
        }

        // Dependencies factor
        if (dependencies.length > 0 && pattern.handlesDependencies) {
            score += 5;
        }

        // Communication overhead factor
        const communicationCost = this.calculateCommunicationCost(patternName, agentCount);
        score -= communicationCost;

        // Fault tolerance factor
        if (options.faultTolerance && pattern.faultTolerant) {
            score += 4;
        }

        return Math.max(0, score);
    }

    /**
     * Calculate communication cost for a pattern
     */
    calculateCommunicationCost(patternName, agentCount) {
        const costFactors = {
            hierarchical: Math.log2(agentCount),
            mesh: agentCount * (agentCount - 1) / 4, // Simplified mesh cost
            star: agentCount - 1,
            ring: agentCount,
            hybrid: agentCount * 1.5,
            pipeline: agentCount - 1
        };

        return costFactors[patternName] || 0;
    }

    /**
     * Configure pattern with specific agents and requirements
     */
    configurePattern(patternName, agents, taskAnalysis, options) {
        const pattern = this.patterns[patternName];
        return pattern.configure(agents, taskAnalysis, options);
    }

    /**
     * Get all available patterns with descriptions
     */
    getAvailablePatterns() {
        return Object.entries(this.patterns).map(([name, pattern]) => ({
            name,
            description: pattern.description,
            bestFor: pattern.bestFor,
            characteristics: pattern.characteristics,
            minAgents: pattern.minAgents,
            maxAgents: pattern.maxAgents
        }));
    }
}

/**
 * Base Pattern class
 */
class BasePattern {
    constructor() {
        this.communicationGraph = new Map();
        this.roles = new Map();
    }

    /**
     * Build communication graph for the pattern
     */
    buildCommunicationGraph(agents) {
        this.communicationGraph.clear();
        agents.forEach(agent => {
            this.communicationGraph.set(agent.type, new Set());
        });
    }

    /**
     * Assign roles to agents
     */
    assignRoles(agents) {
        this.roles.clear();
        // Override in subclasses
    }

    /**
     * Get communication paths between agents
     */
    getCommunicationPaths(fromAgent, toAgent) {
        // BFS to find shortest communication path
        const queue = [fromAgent];
        const visited = new Set([fromAgent]);
        const paths = new Map();
        paths.set(fromAgent, [fromAgent]);

        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current === toAgent) {
                return paths.get(current);
            }

            const connections = this.communicationGraph.get(current) || new Set();
            for (const next of connections) {
                if (!visited.has(next)) {
                    visited.add(next);
                    queue.push(next);
                    paths.set(next, [...paths.get(current), next]);
                }
            }
        }

        return null; // No path found
    }

    /**
     * Calculate pattern efficiency metrics
     */
    calculateEfficiency(agents) {
        const totalConnections = Array.from(this.communicationGraph.values())
            .reduce((sum, connections) => sum + connections.size, 0);
        
        const maxPossibleConnections = agents.length * (agents.length - 1);
        const connectivity = totalConnections / maxPossibleConnections;
        
        const averagePathLength = this.calculateAveragePathLength(agents);
        
        return {
            connectivity,
            averagePathLength,
            efficiency: connectivity / (averagePathLength || 1)
        };
    }

    /**
     * Calculate average path length between all agent pairs
     */
    calculateAveragePathLength(agents) {
        let totalLength = 0;
        let pathCount = 0;

        for (const agent1 of agents) {
            for (const agent2 of agents) {
                if (agent1.type !== agent2.type) {
                    const path = this.getCommunicationPaths(agent1.type, agent2.type);
                    if (path) {
                        totalLength += path.length - 1;
                        pathCount++;
                    }
                }
            }
        }

        return pathCount > 0 ? totalLength / pathCount : 0;
    }
}

/**
 * Hierarchical Pattern - Tree-like structure with clear command chain
 */
class HierarchicalPattern extends BasePattern {
    constructor() {
        super();
        this.description = 'Tree-like hierarchy with clear command chain';
        this.bestFor = 'Complex projects, large teams, clear authority structure';
        this.characteristics = ['Clear hierarchy', 'Scalable', 'Efficient coordination'];
        this.minAgents = 3;
        this.maxAgents = 20;
        this.suitableComplexity = ['medium', 'high'];
        this.supportsParallel = true;
        this.requiresParallel = false;
        this.handlesDependencies = true;
        this.faultTolerant = false;
    }

    configure(agents, taskAnalysis, options) {
        this.buildCommunicationGraph(agents);
        this.assignRoles(agents);

        // Find coordinator or designate one
        let coordinator = agents.find(a => a.type === 'coordinator');
        if (!coordinator) {
            // Assign coordinator role to most suitable agent
            coordinator = agents.reduce((best, current) => 
                current.suitabilityScore > (best?.suitabilityScore || 0) ? current : best
            );
        }

        // Create hierarchy levels
        const hierarchy = this.createHierarchy(agents, coordinator);
        
        // Build communication graph based on hierarchy
        this.buildHierarchicalConnections(hierarchy);

        return {
            coordinator: coordinator.type,
            hierarchy,
            communicationGraph: Object.fromEntries(
                Array.from(this.communicationGraph.entries()).map(
                    ([key, value]) => [key, Array.from(value)]
                )
            ),
            roles: Object.fromEntries(this.roles.entries()),
            executionOrder: this.determineExecutionOrder(hierarchy, taskAnalysis.dependencies)
        };
    }

    assignRoles(agents) {
        agents.forEach(agent => {
            switch (agent.type) {
                case 'coordinator':
                    this.roles.set(agent.type, 'root');
                    break;
                case 'architect':
                    this.roles.set(agent.type, 'planning-lead');
                    break;
                case 'coder':
                    this.roles.set(agent.type, 'implementation-worker');
                    break;
                case 'tester':
                    this.roles.set(agent.type, 'quality-worker');
                    break;
                default:
                    this.roles.set(agent.type, 'worker');
            }
        });
    }

    createHierarchy(agents, coordinator) {
        const hierarchy = {
            root: coordinator,
            levels: []
        };

        const remaining = agents.filter(a => a !== coordinator);
        
        // Level 1: Planning and coordination agents
        const level1 = remaining.filter(a => 
            ['architect', 'analyst', 'reviewer'].includes(a.type)
        );
        
        // Level 2: Implementation agents
        const level2 = remaining.filter(a => 
            ['coder', 'tester', 'optimizer'].includes(a.type)
        );

        // Level 3: Specialized agents
        const level3 = remaining.filter(a => 
            !level1.includes(a) && !level2.includes(a)
        );

        if (level1.length > 0) hierarchy.levels.push(level1);
        if (level2.length > 0) hierarchy.levels.push(level2);
        if (level3.length > 0) hierarchy.levels.push(level3);

        return hierarchy;
    }

    buildHierarchicalConnections(hierarchy) {
        const coordinator = hierarchy.root.type;
        
        // Coordinator connects to all level 1 agents
        const level1Connections = hierarchy.levels[0] || [];
        level1Connections.forEach(agent => {
            this.communicationGraph.get(coordinator).add(agent.type);
            this.communicationGraph.get(agent.type).add(coordinator);
        });

        // Each level connects to the next level
        for (let i = 0; i < hierarchy.levels.length - 1; i++) {
            const currentLevel = hierarchy.levels[i];
            const nextLevel = hierarchy.levels[i + 1];

            currentLevel.forEach((supervisor, index) => {
                const workersPerSupervisor = Math.ceil(nextLevel.length / currentLevel.length);
                const startIdx = index * workersPerSupervisor;
                const endIdx = Math.min(startIdx + workersPerSupervisor, nextLevel.length);

                for (let j = startIdx; j < endIdx; j++) {
                    if (nextLevel[j]) {
                        this.communicationGraph.get(supervisor.type).add(nextLevel[j].type);
                        this.communicationGraph.get(nextLevel[j].type).add(supervisor.type);
                    }
                }
            });
        }
    }

    determineExecutionOrder(hierarchy, dependencies) {
        const order = [];
        
        // Start with coordinator
        order.push(hierarchy.root.type);
        
        // Process levels in order, considering dependencies
        hierarchy.levels.forEach(level => {
            const levelAgents = level.map(a => a.type);
            order.push(...levelAgents);
        });

        return order;
    }
}

/**
 * Mesh Pattern - Full connectivity between all agents
 */
class MeshPattern extends BasePattern {
    constructor() {
        super();
        this.description = 'Full connectivity between all agents';
        this.bestFor = 'Collaborative tasks, peer-to-peer coordination, dynamic workflows';
        this.characteristics = ['Full connectivity', 'High redundancy', 'Flexible communication'];
        this.minAgents = 2;
        this.maxAgents = 8;
        this.suitableComplexity = ['low', 'medium'];
        this.supportsParallel = true;
        this.requiresParallel = false;
        this.handlesDependencies = true;
        this.faultTolerant = true;
    }

    configure(agents, taskAnalysis, options) {
        this.buildCommunicationGraph(agents);
        this.assignRoles(agents);

        // Create full mesh connectivity
        agents.forEach(agent1 => {
            agents.forEach(agent2 => {
                if (agent1.type !== agent2.type) {
                    this.communicationGraph.get(agent1.type).add(agent2.type);
                }
            });
        });

        return {
            communicationGraph: Object.fromEntries(
                Array.from(this.communicationGraph.entries()).map(
                    ([key, value]) => [key, Array.from(value)]
                )
            ),
            roles: Object.fromEntries(this.roles.entries()),
            consensusProtocol: 'majority-vote',
            redundancyLevel: 'high'
        };
    }

    assignRoles(agents) {
        // In mesh pattern, all agents are peers with specialized roles
        agents.forEach(agent => {
            this.roles.set(agent.type, `peer-${agent.type}`);
        });
    }
}

/**
 * Star Pattern - Central coordinator with spoke agents
 */
class StarPattern extends BasePattern {
    constructor() {
        super();
        this.description = 'Central coordinator with spoke agents';
        this.bestFor = 'Coordinated execution, centralized control, medium-scale projects';
        this.characteristics = ['Central coordination', 'Simple communication', 'Single point of control'];
        this.minAgents = 3;
        this.maxAgents = 10;
        this.suitableComplexity = ['low', 'medium', 'high'];
        this.supportsParallel = true;
        this.requiresParallel = false;
        this.handlesDependencies = true;
        this.faultTolerant = false;
    }

    configure(agents, taskAnalysis, options) {
        this.buildCommunicationGraph(agents);
        this.assignRoles(agents);

        // Find or assign central coordinator
        let coordinator = agents.find(a => a.type === 'coordinator');
        if (!coordinator) {
            coordinator = agents.reduce((best, current) => 
                current.suitabilityScore > (best?.suitabilityScore || 0) ? current : best
            );
        }

        // Connect coordinator to all other agents
        const spokes = agents.filter(a => a !== coordinator);
        spokes.forEach(spoke => {
            this.communicationGraph.get(coordinator.type).add(spoke.type);
            this.communicationGraph.get(spoke.type).add(coordinator.type);
        });

        return {
            coordinator: coordinator.type,
            spokes: spokes.map(s => s.type),
            communicationGraph: Object.fromEntries(
                Array.from(this.communicationGraph.entries()).map(
                    ([key, value]) => [key, Array.from(value)]
                )
            ),
            roles: Object.fromEntries(this.roles.entries())
        };
    }

    assignRoles(agents) {
        const coordinator = agents.find(a => a.type === 'coordinator');
        
        if (coordinator) {
            this.roles.set(coordinator.type, 'central-coordinator');
        }
        
        agents.filter(a => a !== coordinator).forEach(agent => {
            this.roles.set(agent.type, `spoke-${agent.type}`);
        });
    }
}

/**
 * Ring Pattern - Circular communication pattern
 */
class RingPattern extends BasePattern {
    constructor() {
        super();
        this.description = 'Circular communication pattern';
        this.bestFor = 'Sequential processing, pipeline workflows, ordered execution';
        this.characteristics = ['Sequential processing', 'Ordered communication', 'Pipeline execution'];
        this.minAgents = 3;
        this.maxAgents = 12;
        this.suitableComplexity = ['low', 'medium'];
        this.supportsParallel = false;
        this.requiresParallel = false;
        this.handlesDependencies = true;
        this.faultTolerant = false;
    }

    configure(agents, taskAnalysis, options) {
        this.buildCommunicationGraph(agents);
        this.assignRoles(agents);

        // Order agents based on task dependencies and logical flow
        const orderedAgents = this.orderAgentsForRing(agents, taskAnalysis.dependencies);
        
        // Create ring connections
        for (let i = 0; i < orderedAgents.length; i++) {
            const current = orderedAgents[i];
            const next = orderedAgents[(i + 1) % orderedAgents.length];
            
            this.communicationGraph.get(current.type).add(next.type);
        }

        return {
            ringOrder: orderedAgents.map(a => a.type),
            communicationGraph: Object.fromEntries(
                Array.from(this.communicationGraph.entries()).map(
                    ([key, value]) => [key, Array.from(value)]
                )
            ),
            roles: Object.fromEntries(this.roles.entries()),
            processingMode: 'sequential'
        };
    }

    orderAgentsForRing(agents, dependencies) {
        // Simple ordering based on typical workflow
        const typeOrder = ['researcher', 'architect', 'coder', 'tester', 'reviewer', 'optimizer'];
        
        return agents.sort((a, b) => {
            const aIndex = typeOrder.indexOf(a.type);
            const bIndex = typeOrder.indexOf(b.type);
            
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
    }

    assignRoles(agents) {
        agents.forEach((agent, index) => {
            this.roles.set(agent.type, `ring-position-${index}`);
        });
    }
}

/**
 * Hybrid Pattern - Combination of multiple patterns
 */
class HybridPattern extends BasePattern {
    constructor() {
        super();
        this.description = 'Combination of multiple coordination patterns';
        this.bestFor = 'Complex systems, mixed requirements, adaptive coordination';
        this.characteristics = ['Flexible structure', 'Adaptive coordination', 'Pattern combination'];
        this.minAgents = 4;
        this.maxAgents = 15;
        this.suitableComplexity = ['medium', 'high'];
        this.supportsParallel = true;
        this.requiresParallel = false;
        this.handlesDependencies = true;
        this.faultTolerant = true;
    }

    configure(agents, taskAnalysis, options) {
        this.buildCommunicationGraph(agents);
        
        // Determine which patterns to combine based on agent types and task
        const subPatterns = this.selectSubPatterns(agents, taskAnalysis);
        
        // Apply each sub-pattern to relevant agent groups
        const configuration = {
            subPatterns: {},
            communicationGraph: {},
            roles: {}
        };
        
        subPatterns.forEach(({ pattern, agents: subAgents, name }) => {
            const subConfig = pattern.configure(subAgents, taskAnalysis, options);
            configuration.subPatterns[name] = subConfig;
            
            // Merge communication graphs
            Object.entries(subConfig.communicationGraph).forEach(([agent, connections]) => {
                if (!configuration.communicationGraph[agent]) {
                    configuration.communicationGraph[agent] = [];
                }
                configuration.communicationGraph[agent] = [
                    ...new Set([...configuration.communicationGraph[agent], ...connections])
                ];
            });
            
            // Merge roles
            Object.entries(subConfig.roles).forEach(([agent, role]) => {
                configuration.roles[agent] = `${name}-${role}`;
            });
        });
        
        return configuration;
    }

    selectSubPatterns(agents, taskAnalysis) {
        const patterns = [];
        
        // Coordination layer (star pattern for coordinators)
        const coordinators = agents.filter(a => a.type === 'coordinator');
        if (coordinators.length > 0) {
            patterns.push({
                name: 'coordination',
                pattern: new StarPattern(),
                agents: coordinators.concat(agents.filter(a => 
                    ['architect', 'analyst'].includes(a.type)
                ))
            });
        }
        
        // Implementation layer (mesh pattern for coders and testers)
        const implementationAgents = agents.filter(a => 
            ['coder', 'tester', 'reviewer'].includes(a.type)
        );
        if (implementationAgents.length > 1) {
            patterns.push({
                name: 'implementation',
                pattern: new MeshPattern(),
                agents: implementationAgents
            });
        }
        
        return patterns;
    }

    assignRoles(agents) {
        // Roles are assigned by sub-patterns
    }
}

/**
 * Pipeline Pattern - Sequential processing chain
 */
class PipelinePattern extends BasePattern {
    constructor() {
        super();
        this.description = 'Sequential processing chain with stages';
        this.bestFor = 'Linear workflows, stage-gate processes, sequential dependencies';
        this.characteristics = ['Linear processing', 'Stage-based execution', 'Clear handoffs'];
        this.minAgents = 2;
        this.maxAgents = 10;
        this.suitableComplexity = ['low', 'medium', 'high'];
        this.supportsParallel = false;
        this.requiresParallel = false;
        this.handlesDependencies = true;
        this.faultTolerant = false;
    }

    configure(agents, taskAnalysis, options) {
        this.buildCommunicationGraph(agents);
        this.assignRoles(agents);

        // Order agents in pipeline sequence
        const pipeline = this.createPipeline(agents, taskAnalysis.dependencies);
        
        // Connect adjacent pipeline stages
        for (let i = 0; i < pipeline.length - 1; i++) {
            const current = pipeline[i];
            const next = pipeline[i + 1];
            
            this.communicationGraph.get(current.type).add(next.type);
        }

        return {
            pipeline: pipeline.map(a => a.type),
            stages: this.definePipelineStages(pipeline, taskAnalysis),
            communicationGraph: Object.fromEntries(
                Array.from(this.communicationGraph.entries()).map(
                    ([key, value]) => [key, Array.from(value)]
                )
            ),
            roles: Object.fromEntries(this.roles.entries()),
            processingMode: 'pipeline'
        };
    }

    createPipeline(agents, dependencies) {
        // Order based on typical software development pipeline
        const stageOrder = [
            'researcher',    // Requirements gathering
            'architect',     // Design
            'coder',         // Implementation
            'tester',        // Testing
            'reviewer',      // Review
            'optimizer',     // Optimization
            'coordinator'    // Final coordination
        ];
        
        return agents.sort((a, b) => {
            const aIndex = stageOrder.indexOf(a.type);
            const bIndex = stageOrder.indexOf(b.type);
            
            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });
    }

    definePipelineStages(pipeline, taskAnalysis) {
        return pipeline.map((agent, index) => ({
            stage: index + 1,
            agent: agent.type,
            description: this.getStageDescription(agent.type),
            inputs: index === 0 ? ['task-requirements'] : [`stage-${index}-output`],
            outputs: [`stage-${index + 1}-output`]
        }));
    }

    getStageDescription(agentType) {
        const descriptions = {
            researcher: 'Requirements analysis and research',
            architect: 'System design and architecture',
            coder: 'Implementation and development',
            tester: 'Testing and quality assurance',
            reviewer: 'Code review and quality control',
            optimizer: 'Performance optimization',
            coordinator: 'Final coordination and delivery'
        };
        
        return descriptions[agentType] || `${agentType} processing stage`;
    }

    assignRoles(agents) {
        agents.forEach((agent, index) => {
            this.roles.set(agent.type, `pipeline-stage-${index + 1}`);
        });
    }
}

module.exports = { 
    CoordinationPatterns, 
    HierarchicalPattern, 
    MeshPattern, 
    StarPattern, 
    RingPattern, 
    HybridPattern, 
    PipelinePattern 
};