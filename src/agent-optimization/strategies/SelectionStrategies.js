/**
 * Agent Selection Strategies
 * 
 * Implements different strategy types for agent selection:
 * - Optimal: Maximize capability regardless of cost
 * - Minimal: Use fewest agents possible
 * - Balanced: Optimize for efficiency and capability
 * - Adaptive: Dynamic strategy based on context
 * - Cost-Effective: Minimize cost while meeting requirements
 * - Performance: Maximize throughput and speed
 */

class SelectionStrategies {
    constructor(optimizer) {
        this.optimizer = optimizer;
        this.strategies = {
            optimal: new OptimalStrategy(optimizer),
            minimal: new MinimalStrategy(optimizer),
            balanced: new BalancedStrategy(optimizer),
            adaptive: new AdaptiveStrategy(optimizer),
            costEffective: new CostEffectiveStrategy(optimizer),
            performance: new PerformanceStrategy(optimizer)
        };
    }

    /**
     * Execute strategy and return selected agents
     */
    executeStrategy(strategyName, candidates, options) {
        const strategy = this.strategies[strategyName];
        if (!strategy) {
            throw new Error(`Unknown strategy: ${strategyName}`);
        }

        return strategy.execute(candidates, options);
    }

    /**
     * Get all available strategies
     */
    getAvailableStrategies() {
        return Object.keys(this.strategies).map(name => ({
            name,
            description: this.strategies[name].description,
            bestFor: this.strategies[name].bestFor,
            characteristics: this.strategies[name].characteristics
        }));
    }

    /**
     * Recommend best strategy based on task characteristics
     */
    recommendStrategy(taskAnalysis, constraints) {
        const { complexity, parallelizable, estimatedDuration } = taskAnalysis;
        const { resourceBudget, timeline, qualityRequirements } = constraints;

        // Decision matrix for strategy recommendation
        let scores = {
            optimal: 0,
            minimal: 0,
            balanced: 0,
            adaptive: 0,
            costEffective: 0,
            performance: 0
        };

        // Complexity factor
        if (complexity === 'high') {
            scores.optimal += 3;
            scores.adaptive += 2;
            scores.balanced += 2;
        } else if (complexity === 'low') {
            scores.minimal += 3;
            scores.costEffective += 2;
        } else {
            scores.balanced += 3;
            scores.adaptive += 2;
        }

        // Budget constraints
        if (resourceBudget < 10) {
            scores.minimal += 3;
            scores.costEffective += 2;
        } else if (resourceBudget > 20) {
            scores.optimal += 2;
            scores.performance += 2;
        }

        // Timeline constraints
        if (timeline === 'urgent') {
            scores.performance += 3;
            scores.optimal += 2;
        } else if (timeline === 'flexible') {
            scores.minimal += 2;
            scores.costEffective += 2;
        }

        // Quality requirements
        if (qualityRequirements === 'high') {
            scores.optimal += 3;
            scores.balanced += 2;
        }

        // Parallelization capability
        if (parallelizable) {
            scores.performance += 2;
            scores.optimal += 1;
        }

        // Find highest scoring strategy
        const recommendedStrategy = Object.entries(scores)
            .sort(([,a], [,b]) => b - a)[0][0];

        return {
            recommended: recommendedStrategy,
            scores,
            reasoning: this.generateStrategyReasoning(recommendedStrategy, taskAnalysis, constraints)
        };
    }

    /**
     * Generate reasoning for strategy recommendation
     */
    generateStrategyReasoning(strategy, taskAnalysis, constraints) {
        const reasons = [];

        switch (strategy) {
            case 'optimal':
                reasons.push('High complexity task requires maximum capability');
                if (constraints.resourceBudget > 20) reasons.push('Sufficient budget for optimal resource allocation');
                if (constraints.qualityRequirements === 'high') reasons.push('High quality requirements favor comprehensive approach');
                break;

            case 'minimal':
                reasons.push('Low complexity allows for minimal resource usage');
                if (constraints.resourceBudget < 10) reasons.push('Budget constraints favor minimal approach');
                if (taskAnalysis.estimatedDuration < 4) reasons.push('Short duration task suitable for small team');
                break;

            case 'balanced':
                reasons.push('Medium complexity benefits from balanced approach');
                reasons.push('Good balance between capability and resource efficiency');
                break;

            case 'adaptive':
                reasons.push('Complex requirements benefit from adaptive strategy');
                reasons.push('Dynamic allocation based on real-time needs');
                break;

            case 'costEffective':
                reasons.push('Resource constraints prioritize cost efficiency');
                if (constraints.timeline === 'flexible') reasons.push('Flexible timeline allows for cost optimization');
                break;

            case 'performance':
                reasons.push('Speed and throughput are prioritized');
                if (constraints.timeline === 'urgent') reasons.push('Urgent timeline requires performance focus');
                if (taskAnalysis.parallelizable) reasons.push('Parallelizable task benefits from performance strategy');
                break;
        }

        return reasons;
    }
}

/**
 * Base Strategy class
 */
class BaseStrategy {
    constructor(optimizer) {
        this.optimizer = optimizer;
    }

    /**
     * Filter agents based on strategy-specific criteria
     */
    filterCandidates(candidates, criteria) {
        return candidates.filter(candidate => this.meetsCriteria(candidate, criteria));
    }

    /**
     * Check if candidate meets strategy criteria
     */
    meetsCriteria(candidate, criteria) {
        return true; // Override in subclasses
    }

    /**
     * Calculate strategy-specific scoring
     */
    calculateScore(candidate, context) {
        return candidate.suitabilityScore; // Override in subclasses
    }
}

/**
 * Optimal Strategy - Maximize capability regardless of cost
 */
class OptimalStrategy extends BaseStrategy {
    constructor(optimizer) {
        super(optimizer);
        this.description = 'Maximize capability and quality regardless of cost';
        this.bestFor = 'Critical projects, high-stakes deliverables, complex systems';
        this.characteristics = ['High resource usage', 'Maximum capability', 'Best quality output'];
    }

    execute(candidates, options) {
        const { maxAgents = 8, taskComplexity } = options;
        const selected = [];
        let totalCost = 0;

        // Always include a coordinator for optimal coordination
        const coordinator = candidates.find(c => c.type === 'coordinator');
        if (coordinator) {
            selected.push(coordinator);
            totalCost += coordinator.config.resourceCost;
        }

        // Add architect for complex tasks
        if (taskComplexity !== 'low') {
            const architect = candidates.find(c => c.type === 'architect');
            if (architect && !selected.includes(architect)) {
                selected.push(architect);
                totalCost += architect.config.resourceCost;
            }
        }

        // Select highest scoring remaining agents
        const remaining = candidates
            .filter(c => !selected.includes(c))
            .sort((a, b) => b.suitabilityScore - a.suitabilityScore);

        for (const candidate of remaining) {
            if (selected.length >= maxAgents) break;
            
            // In optimal strategy, include high-value agents even if expensive
            if (candidate.suitabilityScore > 15) {
                selected.push(candidate);
                totalCost += candidate.config.resourceCost;
            }
        }

        return {
            agents: selected,
            totalCost,
            strategy: 'optimal',
            justification: 'Selected for maximum capability and quality output'
        };
    }
}

/**
 * Minimal Strategy - Use fewest agents possible
 */
class MinimalStrategy extends BaseStrategy {
    constructor(optimizer) {
        super(optimizer);
        this.description = 'Use minimum number of agents to complete task';
        this.bestFor = 'Simple tasks, tight budgets, quick deliverables';
        this.characteristics = ['Low resource usage', 'Essential skills only', 'Fast setup'];
    }

    execute(candidates, options) {
        const selected = [];
        const coveredSkills = new Set();
        
        // Get all required skills
        const allSkills = new Set();
        candidates.forEach(c => c.matchedKeywords.forEach(k => allSkills.add(k)));
        
        // Greedy selection - pick agents that cover most uncovered skills
        while (coveredSkills.size < allSkills.size && candidates.length > 0) {
            let bestCandidate = null;
            let bestCoverage = 0;
            
            for (const candidate of candidates) {
                if (selected.includes(candidate)) continue;
                
                const newSkills = candidate.matchedKeywords.filter(k => !coveredSkills.has(k));
                const coverage = newSkills.length;
                
                // Prefer lower cost agents with good coverage
                const efficiency = coverage / candidate.config.resourceCost;
                
                if (efficiency > bestCoverage) {
                    bestCandidate = candidate;
                    bestCoverage = efficiency;
                }
            }
            
            if (bestCandidate) {
                selected.push(bestCandidate);
                bestCandidate.matchedKeywords.forEach(k => coveredSkills.add(k));
            } else {
                break;
            }
        }
        
        const totalCost = selected.reduce((sum, agent) => sum + agent.config.resourceCost, 0);
        
        return {
            agents: selected,
            totalCost,
            strategy: 'minimal',
            justification: 'Selected minimum agents to cover all required skills'
        };
    }
}

/**
 * Balanced Strategy - Optimize for efficiency and capability
 */
class BalancedStrategy extends BaseStrategy {
    constructor(optimizer) {
        super(optimizer);
        this.description = 'Balance capability with resource efficiency';
        this.bestFor = 'Most projects, standard requirements, moderate budgets';
        this.characteristics = ['Balanced resource usage', 'Good capability coverage', 'Efficient allocation'];
    }

    execute(candidates, options) {
        const { maxAgents = 6, resourceBudget = 20, taskComplexity } = options;
        const selected = [];
        let totalCost = 0;

        // Select core team based on task complexity
        const coreTeam = this.selectCoreTeam(candidates, taskComplexity);
        
        // Add core team members within budget
        for (const agent of coreTeam) {
            if (totalCost + agent.config.resourceCost <= resourceBudget) {
                selected.push(agent);
                totalCost += agent.config.resourceCost;
            }
        }

        // Fill remaining slots with best value agents
        const remaining = candidates.filter(c => !selected.includes(c));
        const valueRanked = remaining.map(agent => ({
            ...agent,
            valueScore: agent.suitabilityScore / agent.config.resourceCost
        })).sort((a, b) => b.valueScore - a.valueScore);

        for (const candidate of valueRanked) {
            if (selected.length >= maxAgents || totalCost + candidate.config.resourceCost > resourceBudget) {
                break;
            }
            
            // Only add if value score meets threshold
            if (candidate.valueScore > 2) {
                selected.push(candidate);
                totalCost += candidate.config.resourceCost;
            }
        }

        return {
            agents: selected,
            totalCost,
            strategy: 'balanced',
            justification: 'Balanced selection optimizing capability and resource efficiency'
        };
    }

    selectCoreTeam(candidates, complexity) {
        const coreTypes = {
            'high': ['coordinator', 'architect', 'coder', 'analyst'],
            'medium': ['coordinator', 'coder', 'tester'],
            'low': ['coder', 'tester']
        };

        const requiredTypes = coreTypes[complexity] || coreTypes.medium;
        const core = [];

        for (const type of requiredTypes) {
            const agent = candidates.find(c => c.type === type);
            if (agent) core.push(agent);
        }

        return core;
    }
}

/**
 * Adaptive Strategy - Dynamic strategy based on context
 */
class AdaptiveStrategy extends BaseStrategy {
    constructor(optimizer) {
        super(optimizer);
        this.description = 'Dynamically adapt selection based on task context';
        this.bestFor = 'Complex projects, changing requirements, uncertain scope';
        this.characteristics = ['Context-aware selection', 'Flexible allocation', 'Adaptive scaling'];
    }

    execute(candidates, options) {
        const { taskComplexity, timeline, resourceBudget } = options;
        
        // Analyze context to determine sub-strategy
        let subStrategy;
        
        if (resourceBudget < 10) {
            subStrategy = 'minimal';
        } else if (timeline === 'urgent' && resourceBudget > 15) {
            subStrategy = 'performance';
        } else if (taskComplexity === 'high') {
            subStrategy = 'optimal';
        } else {
            subStrategy = 'balanced';
        }

        // Execute chosen sub-strategy
        const strategyClass = {
            minimal: MinimalStrategy,
            performance: PerformanceStrategy,
            optimal: OptimalStrategy,
            balanced: BalancedStrategy
        }[subStrategy];

        const strategy = new strategyClass(this.optimizer);
        const result = strategy.execute(candidates, options);
        
        return {
            ...result,
            strategy: 'adaptive',
            subStrategy,
            justification: `Adaptive strategy chose ${subStrategy} based on context analysis`
        };
    }
}

/**
 * Cost-Effective Strategy - Minimize cost while meeting requirements
 */
class CostEffectiveStrategy extends BaseStrategy {
    constructor(optimizer) {
        super(optimizer);
        this.description = 'Minimize cost while meeting minimum requirements';
        this.bestFor = 'Budget-constrained projects, non-critical tasks, prototype development';
        this.characteristics = ['Minimal cost', 'Efficient resource use', 'Value optimization'];
    }

    execute(candidates, options) {
        const { maxAgents = 4, resourceBudget = 12 } = options;
        const selected = [];
        let totalCost = 0;

        // Sort by cost-effectiveness (suitability / cost)
        const costEffective = candidates
            .map(agent => ({
                ...agent,
                efficiency: agent.suitabilityScore / agent.config.resourceCost
            }))
            .sort((a, b) => b.efficiency - a.efficiency);

        // Select most cost-effective agents within budget
        for (const candidate of costEffective) {
            if (selected.length >= maxAgents || totalCost + candidate.config.resourceCost > resourceBudget) {
                break;
            }
            
            // Only select if efficiency meets minimum threshold
            if (candidate.efficiency > 1.5) {
                selected.push(candidate);
                totalCost += candidate.config.resourceCost;
            }
        }

        return {
            agents: selected,
            totalCost,
            strategy: 'costEffective',
            justification: 'Cost-effective selection maximizing value per resource unit'
        };
    }
}

/**
 * Performance Strategy - Maximize throughput and speed
 */
class PerformanceStrategy extends BaseStrategy {
    constructor(optimizer) {
        super(optimizer);
        this.description = 'Maximize speed and throughput';
        this.bestFor = 'Time-critical projects, high-throughput requirements, parallel tasks';
        this.characteristics = ['Maximum parallelization', 'Speed optimization', 'High throughput'];
    }

    execute(candidates, options) {
        const { maxAgents = 8 } = options;
        const selected = [];
        
        // Prioritize agents with parallel capability
        const parallelCapable = candidates.filter(c => c.config.parallelCapability);
        const nonParallel = candidates.filter(c => !c.config.parallelCapability);
        
        // Add high-scoring parallel agents first
        const sortedParallel = parallelCapable.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
        for (const agent of sortedParallel) {
            if (selected.length >= maxAgents * 0.7) break; // Reserve 30% for non-parallel
            selected.push(agent);
        }
        
        // Add essential non-parallel agents
        const sortedNonParallel = nonParallel.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
        for (const agent of sortedNonParallel) {
            if (selected.length >= maxAgents) break;
            if (agent.suitabilityScore > 20) { // High threshold for non-parallel
                selected.push(agent);
            }
        }

        const totalCost = selected.reduce((sum, agent) => sum + agent.config.resourceCost, 0);

        return {
            agents: selected,
            totalCost,
            strategy: 'performance',
            justification: 'Performance-optimized selection prioritizing parallel execution and speed'
        };
    }
}

module.exports = { 
    SelectionStrategies, 
    OptimalStrategy, 
    MinimalStrategy, 
    BalancedStrategy, 
    AdaptiveStrategy, 
    CostEffectiveStrategy, 
    PerformanceStrategy 
};