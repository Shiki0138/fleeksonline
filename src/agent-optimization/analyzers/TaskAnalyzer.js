/**
 * Task Analyzer
 * 
 * Analyzes tasks to extract:
 * - Keywords and requirements
 * - Complexity assessment
 * - Resource requirements
 * - Dependencies and workflow
 * - Parallelization opportunities
 * - Risk factors
 * - Success metrics
 */

class TaskAnalyzer {
    constructor() {
        this.keywordPatterns = this.initializeKeywordPatterns();
        this.complexityRules = this.initializeComplexityRules();
        this.dependencyPatterns = this.initializeDependencyPatterns();
        this.riskFactors = this.initializeRiskFactors();
    }

    /**
     * Main analysis method - comprehensive task analysis
     */
    analyzeTask(task, context = {}) {
        const startTime = Date.now();
        
        // Basic extraction
        const keywords = this.extractKeywords(task);
        const entities = this.extractEntities(task);
        const requirements = this.extractRequirements(task, keywords);
        
        // Complexity analysis
        const complexity = this.assessComplexity(task, keywords, entities);
        const effort = this.estimateEffort(complexity, keywords);
        
        // Workflow analysis
        const dependencies = this.analyzeDependencies(task, keywords);
        const parallelization = this.analyzeParallelization(task, keywords, dependencies);
        const criticalPath = this.identifyCriticalPath(dependencies);
        
        // Resource analysis
        const resourceRequirements = this.analyzeResourceRequirements(keywords, complexity);
        const skills = this.identifyRequiredSkills(keywords, entities);
        
        // Risk analysis
        const risks = this.assessRisks(task, keywords, complexity);
        const constraints = this.identifyConstraints(task, context);
        
        // Success criteria
        const successMetrics = this.defineSuccessMetrics(keywords, requirements);
        const testability = this.assessTestability(keywords, requirements);
        
        // Timeline estimation
        const timeline = this.estimateTimeline(complexity, effort, parallelization);
        
        const analysisTime = Date.now() - startTime;
        
        return {
            // Basic information
            originalTask: task,
            context,
            analysisTime,
            
            // Content analysis
            keywords,
            entities,
            requirements,
            
            // Complexity assessment
            complexity,
            effort,
            timeline,
            
            // Workflow analysis
            dependencies,
            parallelization,
            criticalPath,
            
            // Resource planning
            resourceRequirements,
            skills,
            
            // Risk management
            risks,
            constraints,
            
            // Quality assurance
            successMetrics,
            testability,
            
            // Metadata
            confidence: this.calculateConfidence(keywords, entities, requirements),
            recommendations: this.generateRecommendations(keywords, complexity, risks)
        };
    }

    /**
     * Initialize keyword patterns for different categories
     */
    initializeKeywordPatterns() {
        return {
            // Development actions
            development: {
                patterns: ['implement', 'build', 'create', 'develop', 'code', 'write', 'construct'],
                weight: 3,
                category: 'action'
            },
            
            // Testing actions
            testing: {
                patterns: ['test', 'verify', 'validate', 'check', 'ensure', 'confirm'],
                weight: 2,
                category: 'quality'
            },
            
            // Analysis actions
            analysis: {
                patterns: ['analyze', 'examine', 'investigate', 'study', 'research', 'evaluate'],
                weight: 2,
                category: 'research'
            },
            
            // Design actions
            design: {
                patterns: ['design', 'architect', 'plan', 'structure', 'model', 'blueprint'],
                weight: 3,
                category: 'architecture'
            },
            
            // Optimization actions
            optimization: {
                patterns: ['optimize', 'improve', 'enhance', 'refactor', 'streamline', 'tune'],
                weight: 2,
                category: 'improvement'
            },
            
            // Technologies
            technologies: {
                patterns: ['react', 'node', 'python', 'javascript', 'api', 'database', 'frontend', 'backend'],
                weight: 2,
                category: 'technology'
            },
            
            // Complexity indicators
            complexity: {
                patterns: ['complex', 'advanced', 'sophisticated', 'enterprise', 'scalable', 'distributed'],
                weight: 4,
                category: 'complexity'
            },
            
            // Urgency indicators
            urgency: {
                patterns: ['urgent', 'asap', 'immediate', 'critical', 'emergency', 'quickly'],
                weight: 3,
                category: 'timeline'
            },
            
            // Quality indicators
            quality: {
                patterns: ['secure', 'reliable', 'robust', 'maintainable', 'scalable', 'performant'],
                weight: 3,
                category: 'quality'
            }
        };
    }

    /**
     * Extract keywords from task description
     */
    extractKeywords(task) {
        const taskLower = task.toLowerCase();
        const extractedKeywords = {
            byCategory: {},
            all: [],
            weighted: []
        };

        Object.entries(this.keywordPatterns).forEach(([category, config]) => {
            const found = config.patterns.filter(pattern => {
                // Support both exact matches and partial matches
                return taskLower.includes(pattern) || 
                       new RegExp(`\\b${pattern}\\b`, 'i').test(task) ||
                       new RegExp(`${pattern}ing\\b`, 'i').test(task); // gerund forms
            });

            if (found.length > 0) {
                extractedKeywords.byCategory[category] = found;
                extractedKeywords.all.push(...found);
                
                found.forEach(keyword => {
                    extractedKeywords.weighted.push({
                        keyword,
                        weight: config.weight,
                        category: config.category
                    });
                });
            }
        });

        // Remove duplicates from all keywords
        extractedKeywords.all = [...new Set(extractedKeywords.all)];
        
        // Sort weighted keywords by weight
        extractedKeywords.weighted.sort((a, b) => b.weight - a.weight);

        return extractedKeywords;
    }

    /**
     * Extract entities (specific technologies, frameworks, etc.)
     */
    extractEntities(task) {
        const entities = {
            technologies: [],
            frameworks: [],
            databases: [],
            services: [],
            platforms: []
        };

        // Technology patterns
        const techPatterns = {
            technologies: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php'],
            frameworks: ['react', 'vue', 'angular', 'express', 'django', 'spring', 'laravel'],
            databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch'],
            services: ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'api'],
            platforms: ['web', 'mobile', 'desktop', 'cloud', 'serverless']
        };

        const taskLower = task.toLowerCase();
        
        Object.entries(techPatterns).forEach(([category, patterns]) => {
            patterns.forEach(pattern => {
                if (new RegExp(`\\b${pattern}\\b`, 'i').test(taskLower)) {
                    entities[category].push(pattern);
                }
            });
        });

        // Extract version numbers or specific mentions
        const versionMatch = task.match(/\b\d+\.\d+(\.\d+)?\b/g);
        if (versionMatch) {
            entities.versions = versionMatch;
        }

        return entities;
    }

    /**
     * Extract functional and non-functional requirements
     */
    extractRequirements(task, keywords) {
        const requirements = {
            functional: [],
            nonFunctional: [],
            constraints: [],
            assumptions: []
        };

        // Functional requirement patterns
        const functionalPatterns = [
            /should\s+([^.]+)/gi,
            /must\s+([^.]+)/gi,
            /need(?:s)?\s+to\s+([^.]+)/gi,
            /require(?:s)?\s+([^.]+)/gi
        ];

        functionalPatterns.forEach(pattern => {
            const matches = task.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    requirements.functional.push(match.trim());
                });
            }
        });

        // Non-functional requirement indicators
        const nfRequirements = {
            performance: ['fast', 'quick', 'responsive', 'efficient'],
            security: ['secure', 'safe', 'protected', 'authenticated'],
            scalability: ['scalable', 'handle load', 'many users'],
            reliability: ['reliable', 'stable', 'available', 'uptime'],
            usability: ['user-friendly', 'intuitive', 'easy to use'],
            maintainability: ['maintainable', 'clean', 'documented']
        };

        Object.entries(nfRequirements).forEach(([category, indicators]) => {
            indicators.forEach(indicator => {
                if (task.toLowerCase().includes(indicator)) {
                    requirements.nonFunctional.push({
                        category,
                        requirement: indicator,
                        context: this.extractContext(task, indicator)
                    });
                }
            });
        });

        // Extract constraints
        const constraintPatterns = [
            /within\s+(\d+\s+\w+)/gi,
            /budget\s+of\s+([^.]+)/gi,
            /using\s+([^.]+)/gi,
            /without\s+([^.]+)/gi
        ];

        constraintPatterns.forEach(pattern => {
            const matches = task.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    requirements.constraints.push(match.trim());
                });
            }
        });

        return requirements;
    }

    /**
     * Assess task complexity using multiple factors
     */
    assessComplexity(task, keywords, entities) {
        let complexityScore = 0;
        const factors = {};

        // Keyword-based complexity
        keywords.weighted.forEach(({ keyword, weight, category }) => {
            if (category === 'complexity') {
                complexityScore += weight * 2;
                factors.complexity_keywords = (factors.complexity_keywords || 0) + weight;
            } else if (category === 'architecture') {
                complexityScore += weight * 1.5;
                factors.architecture_complexity = (factors.architecture_complexity || 0) + weight;
            }
        });

        // Technology complexity
        const techComplexity = {
            high: ['microservices', 'distributed', 'machine learning', 'blockchain'],
            medium: ['api', 'database', 'frontend', 'backend'],
            low: ['html', 'css', 'simple']
        };

        Object.entries(techComplexity).forEach(([level, techs]) => {
            techs.forEach(tech => {
                if (task.toLowerCase().includes(tech)) {
                    const score = level === 'high' ? 4 : level === 'medium' ? 2 : 1;
                    complexityScore += score;
                    factors.technology_complexity = (factors.technology_complexity || 0) + score;
                }
            });
        });

        // Task length factor
        if (task.length > 500) {
            complexityScore += 3;
            factors.task_length = 3;
        } else if (task.length > 200) {
            complexityScore += 1;
            factors.task_length = 1;
        }

        // Multiple components factor
        const componentCount = (task.match(/\band\b/gi) || []).length;
        if (componentCount > 3) {
            complexityScore += componentCount;
            factors.multiple_components = componentCount;
        }

        // Integration points
        const integrationKeywords = ['integrate', 'connect', 'sync', 'api', 'service'];
        const integrationScore = integrationKeywords.reduce((score, keyword) => {
            return score + (task.toLowerCase().includes(keyword) ? 2 : 0);
        }, 0);
        complexityScore += integrationScore;
        if (integrationScore > 0) factors.integration_complexity = integrationScore;

        // Determine complexity level
        let level;
        if (complexityScore >= 15) level = 'very-high';
        else if (complexityScore >= 10) level = 'high';
        else if (complexityScore >= 6) level = 'medium';
        else if (complexityScore >= 3) level = 'low';
        else level = 'very-low';

        return {
            level,
            score: complexityScore,
            factors,
            confidence: this.calculateComplexityConfidence(factors)
        };
    }

    /**
     * Estimate effort in person-hours
     */
    estimateEffort(complexity, keywords) {
        const baseEffort = {
            'very-low': 2,
            'low': 8,
            'medium': 24,
            'high': 72,
            'very-high': 168
        };

        let effort = baseEffort[complexity.level];

        // Adjust based on specific activities
        const effortMultipliers = {
            research: 0.8,
            design: 1.2,
            implementation: 1.5,
            testing: 1.0,
            optimization: 1.8,
            integration: 1.6
        };

        keywords.byCategory && Object.keys(keywords.byCategory).forEach(category => {
            if (effortMultipliers[category]) {
                effort *= effortMultipliers[category];
            }
        });

        return {
            estimated: Math.round(effort),
            range: {
                min: Math.round(effort * 0.7),
                max: Math.round(effort * 1.5)
            },
            confidence: complexity.confidence
        };
    }

    /**
     * Analyze task dependencies
     */
    analyzeDependencies(task, keywords) {
        const dependencies = [];
        const taskLower = task.toLowerCase();

        // Common dependency patterns
        const dependencyRules = {
            'implement': ['design', 'plan', 'research'],
            'test': ['implement', 'build', 'create'],
            'deploy': ['test', 'build', 'implement'],
            'optimize': ['implement', 'analyze', 'measure'],
            'integrate': ['implement', 'test'],
            'review': ['implement', 'complete']
        };

        // Sequential indicators
        const sequentialPatterns = [
            /first\s+([^,]+),?\s+then\s+([^.]+)/gi,
            /after\s+([^,]+),?\s+([^.]+)/gi,
            /once\s+([^,]+),?\s+([^.]+)/gi,
            /before\s+([^,]+),?\s+([^.]+)/gi
        ];

        sequentialPatterns.forEach(pattern => {
            const matches = Array.from(taskLower.matchAll(pattern));
            matches.forEach(match => {
                dependencies.push({
                    type: 'sequential',
                    prerequisite: match[1].trim(),
                    dependent: match[2].trim(),
                    confidence: 0.8
                });
            });
        });

        // Rule-based dependencies
        keywords.all.forEach(keyword => {
            if (dependencyRules[keyword]) {
                dependencyRules[keyword].forEach(prereq => {
                    if (keywords.all.includes(prereq)) {
                        dependencies.push({
                            type: 'logical',
                            prerequisite: prereq,
                            dependent: keyword,
                            confidence: 0.6
                        });
                    }
                });
            }
        });

        return this.consolidateDependencies(dependencies);
    }

    /**
     * Analyze parallelization opportunities
     */
    analyzeParallelization(task, keywords, dependencies) {
        const parallelizable = [];
        const sequential = [];
        
        // Identify inherently parallel activities
        const parallelActivities = [
            'research', 'analyze', 'review', 'test', 'document'
        ];
        
        const sequentialActivities = [
            'deploy', 'release', 'merge', 'integrate'
        ];

        keywords.all.forEach(keyword => {
            if (parallelActivities.includes(keyword)) {
                parallelizable.push({
                    activity: keyword,
                    reason: 'inherently_parallel',
                    confidence: 0.8
                });
            } else if (sequentialActivities.includes(keyword)) {
                sequential.push({
                    activity: keyword,
                    reason: 'inherently_sequential',
                    confidence: 0.9
                });
            }
        });

        // Analyze dependencies for parallel opportunities
        const independentTasks = this.findIndependentTasks(dependencies);
        independentTasks.forEach(task => {
            parallelizable.push({
                activity: task,
                reason: 'no_dependencies',
                confidence: 0.7
            });
        });

        return {
            parallelizable,
            sequential,
            overallParallelizability: this.calculateParallelizability(parallelizable, sequential, keywords.all)
        };
    }

    /**
     * Identify critical path through dependencies
     */
    identifyCriticalPath(dependencies) {
        if (!dependencies || dependencies.length === 0) return [];

        // Build dependency graph
        const graph = new Map();
        const inDegree = new Map();
        
        dependencies.forEach(dep => {
            if (!graph.has(dep.prerequisite)) graph.set(dep.prerequisite, []);
            if (!graph.has(dep.dependent)) graph.set(dep.dependent, []);
            
            graph.get(dep.prerequisite).push(dep.dependent);
            inDegree.set(dep.dependent, (inDegree.get(dep.dependent) || 0) + 1);
            if (!inDegree.has(dep.prerequisite)) inDegree.set(dep.prerequisite, 0);
        });

        // Find longest path (critical path)
        const longestPaths = new Map();
        const visited = new Set();

        const dfs = (node) => {
            if (visited.has(node)) return longestPaths.get(node) || 0;
            
            visited.add(node);
            let maxPath = 0;
            
            const neighbors = graph.get(node) || [];
            neighbors.forEach(neighbor => {
                maxPath = Math.max(maxPath, 1 + dfs(neighbor));
            });
            
            longestPaths.set(node, maxPath);
            return maxPath;
        };

        // Calculate longest path from each starting node
        Array.from(graph.keys()).forEach(node => {
            if (inDegree.get(node) === 0) {
                dfs(node);
            }
        });

        // Find the actual critical path
        const criticalPath = [];
        let current = Array.from(longestPaths.entries())
            .sort(([,a], [,b]) => b - a)[0]?.[0];
        
        while (current) {
            criticalPath.push(current);
            const neighbors = graph.get(current) || [];
            current = neighbors.find(neighbor => 
                longestPaths.get(neighbor) === longestPaths.get(current) - 1
            );
        }

        return criticalPath;
    }

    /**
     * Analyze resource requirements
     */
    analyzeResourceRequirements(keywords, complexity) {
        const requirements = {
            computational: {
                cpu: 'medium',
                memory: 'medium',
                storage: 'low'
            },
            human: {
                expertise_level: 'medium',
                team_size: 3,
                duration: '1-2 weeks'
            },
            infrastructure: {
                development: ['IDE', 'version_control'],
                testing: ['testing_framework'],
                deployment: ['CI/CD']
            }
        };

        // Adjust based on complexity
        const complexityMultipliers = {
            'very-low': { cpu: 0.5, memory: 0.5, team_size: 1 },
            'low': { cpu: 0.7, memory: 0.7, team_size: 2 },
            'medium': { cpu: 1.0, memory: 1.0, team_size: 3 },
            'high': { cpu: 1.5, memory: 1.5, team_size: 5 },
            'very-high': { cpu: 2.0, memory: 2.0, team_size: 8 }
        };

        const multiplier = complexityMultipliers[complexity.level];
        requirements.human.team_size = Math.round(requirements.human.team_size * multiplier.team_size);

        // Adjust based on specific technologies
        if (keywords.all.includes('database')) {
            requirements.computational.storage = 'high';
            requirements.infrastructure.development.push('database');
        }

        if (keywords.all.includes('machine learning') || keywords.all.includes('ai')) {
            requirements.computational.cpu = 'very-high';
            requirements.computational.memory = 'very-high';
            requirements.infrastructure.development.push('gpu', 'ml_framework');
        }

        return requirements;
    }

    /**
     * Identify required skills and expertise
     */
    identifyRequiredSkills(keywords, entities) {
        const skills = {
            technical: new Set(),
            domain: new Set(),
            soft: new Set()
        };

        // Technical skills from keywords
        const technicalSkillMap = {
            'implement': ['programming', 'software_development'],
            'test': ['testing', 'quality_assurance'],
            'design': ['system_design', 'architecture'],
            'optimize': ['performance_tuning', 'profiling'],
            'analyze': ['analytical_thinking', 'problem_solving']
        };

        keywords.all.forEach(keyword => {
            if (technicalSkillMap[keyword]) {
                technicalSkillMap[keyword].forEach(skill => skills.technical.add(skill));
            }
        });

        // Technical skills from entities
        Object.values(entities).flat().forEach(entity => {
            skills.technical.add(entity);
        });

        // Domain skills based on context
        if (keywords.all.some(k => ['web', 'frontend', 'ui'].includes(k))) {
            skills.domain.add('web_development');
        }
        if (keywords.all.some(k => ['api', 'backend', 'server'].includes(k))) {
            skills.domain.add('backend_development');
        }
        if (keywords.all.some(k => ['database', 'data'].includes(k))) {
            skills.domain.add('data_management');
        }

        // Soft skills based on complexity and team requirements
        skills.soft.add('communication');
        skills.soft.add('problem_solving');
        
        if (keywords.all.includes('coordinate') || keywords.all.includes('manage')) {
            skills.soft.add('project_management');
            skills.soft.add('leadership');
        }

        return {
            technical: Array.from(skills.technical),
            domain: Array.from(skills.domain),
            soft: Array.from(skills.soft)
        };
    }

    /**
     * Assess project risks
     */
    assessRisks(task, keywords, complexity) {
        const risks = [];

        // Complexity-based risks
        if (complexity.level === 'high' || complexity.level === 'very-high') {
            risks.push({
                type: 'technical',
                category: 'complexity',
                description: 'High complexity may lead to unexpected challenges',
                probability: 0.7,
                impact: 'high',
                mitigation: ['Break down into smaller tasks', 'Add buffer time', 'Regular checkpoints']
            });
        }

        // Technology risks
        const riskTechnologies = ['new', 'experimental', 'beta', 'cutting-edge'];
        riskTechnologies.forEach(tech => {
            if (task.toLowerCase().includes(tech)) {
                risks.push({
                    type: 'technical',
                    category: 'technology',
                    description: `Using ${tech} technology introduces uncertainty`,
                    probability: 0.6,
                    impact: 'medium',
                    mitigation: ['Prototype early', 'Have fallback options', 'Extra research time']
                });
            }
        });

        // Timeline risks
        if (keywords.all.includes('urgent') || keywords.all.includes('asap')) {
            risks.push({
                type: 'schedule',
                category: 'timeline',
                description: 'Tight timeline may compromise quality',
                probability: 0.8,
                impact: 'high',
                mitigation: ['Prioritize features', 'Increase team size', 'Reduce scope']
            });
        }

        // Integration risks
        if (keywords.all.some(k => ['integrate', 'connect', 'sync'].includes(k))) {
            risks.push({
                type: 'technical',
                category: 'integration',
                description: 'Integration points may cause delays',
                probability: 0.5,
                impact: 'medium',
                mitigation: ['Early integration testing', 'Mock services', 'Clear interfaces']
            });
        }

        // Resource risks
        if (complexity.level === 'high' && keywords.all.includes('small team')) {
            risks.push({
                type: 'resource',
                category: 'capacity',
                description: 'Small team for complex task may be insufficient',
                probability: 0.6,
                impact: 'high',
                mitigation: ['Add team members', 'Extend timeline', 'Reduce scope']
            });
        }

        return risks.map(risk => ({
            ...risk,
            riskScore: risk.probability * this.getImpactScore(risk.impact)
        })).sort((a, b) => b.riskScore - a.riskScore);
    }

    /**
     * Identify constraints
     */
    identifyConstraints(task, context) {
        const constraints = {
            time: [],
            budget: [],
            technology: [],
            team: [],
            quality: []
        };

        // Time constraints
        const timePatterns = [
            /within\s+(\d+)\s+(day|week|month)s?/gi,
            /by\s+(next\s+\w+|\w+day)/gi,
            /deadline\s+of\s+([^.]+)/gi
        ];

        timePatterns.forEach(pattern => {
            const matches = task.match(pattern);
            if (matches) {
                matches.forEach(match => constraints.time.push(match.trim()));
            }
        });

        // Budget constraints
        if (task.toLowerCase().includes('budget') || task.toLowerCase().includes('cost')) {
            constraints.budget.push('Budget limitations mentioned');
        }

        // Technology constraints
        const techConstraints = [
            /must\s+use\s+([^.]+)/gi,
            /only\s+([^.]+)/gi,
            /without\s+([^.]+)/gi
        ];

        techConstraints.forEach(pattern => {
            const matches = task.match(pattern);
            if (matches) {
                matches.forEach(match => constraints.technology.push(match.trim()));
            }
        });

        // Context-based constraints
        if (context.teamSize) {
            constraints.team.push(`Team size limited to ${context.teamSize}`);
        }
        if (context.technologies) {
            constraints.technology.push(`Limited to: ${context.technologies.join(', ')}`);
        }

        return constraints;
    }

    /**
     * Define success metrics
     */
    defineSuccessMetrics(keywords, requirements) {
        const metrics = {
            functional: [],
            performance: [],
            quality: [],
            business: []
        };

        // Functional metrics based on requirements
        requirements.functional.forEach(req => {
            metrics.functional.push({
                metric: `Completion of: ${req}`,
                measurable: this.isMeasurableRequirement(req),
                testable: true
            });
        });

        // Performance metrics
        if (keywords.all.some(k => ['fast', 'performance', 'speed'].includes(k))) {
            metrics.performance.push({
                metric: 'Response time < 500ms',
                measurable: true,
                testable: true
            });
        }

        // Quality metrics
        if (keywords.all.includes('test')) {
            metrics.quality.push({
                metric: 'Code coverage > 80%',
                measurable: true,
                testable: true
            });
        }

        // Business metrics
        if (keywords.all.some(k => ['user', 'customer', 'business'].includes(k))) {
            metrics.business.push({
                metric: 'User satisfaction score',
                measurable: true,
                testable: true
            });
        }

        return metrics;
    }

    /**
     * Assess testability of requirements
     */
    assessTestability(keywords, requirements) {
        let testabilityScore = 0;
        const factors = {};

        // Functional testability
        const testableRequirements = requirements.functional.filter(req => 
            this.isMeasurableRequirement(req)
        ).length;
        
        if (requirements.functional.length > 0) {
            factors.functional_testability = testableRequirements / requirements.functional.length;
            testabilityScore += factors.functional_testability * 30;
        }

        // Keywords that indicate testability
        const testableKeywords = ['test', 'verify', 'validate', 'measure', 'check'];
        const testKeywordCount = keywords.all.filter(k => testableKeywords.includes(k)).length;
        factors.test_keywords = testKeywordCount / keywords.all.length;
        testabilityScore += factors.test_keywords * 20;

        // Non-functional testability
        const testableNFRs = requirements.nonFunctional.filter(nfr => 
            ['performance', 'security', 'reliability'].includes(nfr.category)
        ).length;
        
        if (requirements.nonFunctional.length > 0) {
            factors.nfr_testability = testableNFRs / requirements.nonFunctional.length;
            testabilityScore += factors.nfr_testability * 25;
        }

        // Specificity bonus
        const specificPatterns = /\d+|\b(all|every|each)\b/gi;
        if (specificPatterns.test(requirements.functional.join(' '))) {
            factors.specificity_bonus = 0.2;
            testabilityScore += 25;
        }

        return {
            score: Math.min(100, testabilityScore),
            factors,
            level: testabilityScore >= 70 ? 'high' : testabilityScore >= 40 ? 'medium' : 'low',
            recommendations: this.generateTestabilityRecommendations(factors, testabilityScore)
        };
    }

    /**
     * Estimate timeline with dependencies
     */
    estimateTimeline(complexity, effort, parallelization) {
        const baseTimeline = effort.estimated / 8; // Convert hours to days
        
        // Adjust for parallelization
        const parallelFactor = parallelization.overallParallelizability;
        const adjustedTimeline = baseTimeline * (1 - parallelFactor * 0.3);
        
        // Add buffer for complexity
        const complexityBuffer = {
            'very-low': 1.1,
            'low': 1.2,
            'medium': 1.3,
            'high': 1.5,
            'very-high': 1.8
        };
        
        const finalTimeline = adjustedTimeline * complexityBuffer[complexity.level];
        
        return {
            estimated: Math.ceil(finalTimeline),
            range: {
                optimistic: Math.ceil(finalTimeline * 0.7),
                pessimistic: Math.ceil(finalTimeline * 1.5)
            },
            phases: this.breakdownTimelinePhases(finalTimeline, complexity.level)
        };
    }

    /**
     * Helper methods
     */
    extractContext(text, keyword) {
        const index = text.toLowerCase().indexOf(keyword.toLowerCase());
        if (index === -1) return '';
        
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + keyword.length + 20);
        
        return text.slice(start, end).trim();
    }

    calculateComplexityConfidence(factors) {
        const factorCount = Object.keys(factors).length;
        return Math.min(1.0, factorCount / 5); // Higher confidence with more factors
    }

    consolidateDependencies(dependencies) {
        // Remove duplicates and resolve conflicts
        const consolidated = [];
        const seen = new Set();
        
        dependencies.forEach(dep => {
            const key = `${dep.prerequisite}->${dep.dependent}`;
            if (!seen.has(key)) {
                seen.add(key);
                consolidated.push(dep);
            }
        });
        
        return consolidated;
    }

    findIndependentTasks(dependencies) {
        const allTasks = new Set();
        const dependent = new Set();
        
        dependencies.forEach(dep => {
            allTasks.add(dep.prerequisite);
            allTasks.add(dep.dependent);
            dependent.add(dep.dependent);
        });
        
        return Array.from(allTasks).filter(task => !dependent.has(task));
    }

    calculateParallelizability(parallelizable, sequential, allKeywords) {
        const parallelCount = parallelizable.length;
        const sequentialCount = sequential.length;
        const totalKeywords = allKeywords.length;
        
        if (totalKeywords === 0) return 0;
        
        const parallelScore = parallelCount / totalKeywords;
        const sequentialPenalty = sequentialCount / totalKeywords;
        
        return Math.max(0, Math.min(1, parallelScore - sequentialPenalty));
    }

    getImpactScore(impact) {
        const scores = { low: 1, medium: 2, high: 3, critical: 4 };
        return scores[impact] || 2;
    }

    isMeasurableRequirement(requirement) {
        const measurablePatterns = [
            /\d+/,  // Contains numbers
            /\b(all|every|each|any|no|none)\b/i,  // Quantifiers
            /\b(must|should|will)\s+(not\s+)?be\b/i  // Clear conditions
        ];
        
        return measurablePatterns.some(pattern => pattern.test(requirement));
    }

    generateTestabilityRecommendations(factors, score) {
        const recommendations = [];
        
        if (score < 40) {
            recommendations.push('Add specific, measurable acceptance criteria');
            recommendations.push('Define clear input/output specifications');
        }
        
        if (factors.functional_testability < 0.5) {
            recommendations.push('Make functional requirements more specific and testable');
        }
        
        if (factors.test_keywords < 0.2) {
            recommendations.push('Include explicit testing and validation requirements');
        }
        
        return recommendations;
    }

    breakdownTimelinePhases(totalDays, complexity) {
        const phases = {
            planning: 0.15,
            design: 0.20,
            implementation: 0.40,
            testing: 0.15,
            review: 0.10
        };
        
        // Adjust phases based on complexity
        if (complexity === 'high' || complexity === 'very-high') {
            phases.design += 0.05;
            phases.planning += 0.05;
            phases.implementation -= 0.10;
        }
        
        return Object.entries(phases).map(([phase, ratio]) => ({
            phase,
            duration: Math.ceil(totalDays * ratio),
            percentage: Math.round(ratio * 100)
        }));
    }

    calculateConfidence(keywords, entities, requirements) {
        let confidence = 0.5; // Base confidence
        
        // More keywords increase confidence
        confidence += Math.min(0.3, keywords.all.length * 0.05);
        
        // More entities increase confidence
        const entityCount = Object.values(entities).flat().length;
        confidence += Math.min(0.1, entityCount * 0.02);
        
        // Clear requirements increase confidence
        confidence += Math.min(0.1, requirements.functional.length * 0.02);
        
        return Math.min(1.0, confidence);
    }

    generateRecommendations(keywords, complexity, risks) {
        const recommendations = [];
        
        // Complexity-based recommendations
        if (complexity.level === 'high' || complexity.level === 'very-high') {
            recommendations.push({
                type: 'planning',
                message: 'Break down into smaller, manageable tasks',
                priority: 'high'
            });
            recommendations.push({
                type: 'team',
                message: 'Consider adding experienced team members',
                priority: 'medium'
            });
        }
        
        // Risk-based recommendations
        const highRisks = risks.filter(r => r.riskScore > 2);
        if (highRisks.length > 0) {
            recommendations.push({
                type: 'risk',
                message: `Address ${highRisks.length} high-priority risks early`,
                priority: 'high'
            });
        }
        
        // Keyword-based recommendations
        if (keywords.all.includes('test') && !keywords.all.includes('automate')) {
            recommendations.push({
                type: 'quality',
                message: 'Consider test automation to improve efficiency',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    initializeComplexityRules() {
        // Placeholder for future complexity rules
        return {};
    }

    initializeDependencyPatterns() {
        // Placeholder for future dependency patterns
        return {};
    }

    initializeRiskFactors() {
        // Placeholder for future risk factors
        return {};
    }
}

module.exports = { TaskAnalyzer };