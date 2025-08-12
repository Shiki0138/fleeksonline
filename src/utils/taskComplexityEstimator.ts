/**
 * Task Complexity Estimator
 * Analyzes task descriptions to estimate complexity with detailed scoring
 */

export interface ComplexityScore {
  totalScore: number;
  confidence: number;
  category: 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex';
  breakdown: {
    technicalDomains: DomainComplexity[];
    featureComplexity: number;
    integrationComplexity: number;
    dependencyComplexity: number;
    testingComplexity: number;
    documentationComplexity: number;
  };
  analysis: {
    identifiedFeatures: string[];
    technicalStack: string[];
    integrationPoints: string[];
    dependencies: string[];
    workType: 'sequential' | 'parallel' | 'mixed';
    estimatedEffort: string;
  };
  recommendations: string[];
}

interface DomainComplexity {
  domain: string;
  score: number;
  keywords: string[];
}

export class TaskComplexityEstimator {
  // Domain keywords and their base complexity scores
  private static readonly DOMAIN_PATTERNS = {
    backend: {
      keywords: ['api', 'server', 'database', 'backend', 'endpoint', 'rest', 'graphql', 'microservice', 'queue', 'cache', 'redis', 'mongodb', 'postgresql', 'mysql', 'orm', 'migration'],
      baseScore: 3,
      weight: 1.2
    },
    frontend: {
      keywords: ['ui', 'ux', 'component', 'frontend', 'react', 'vue', 'angular', 'css', 'styling', 'responsive', 'mobile', 'desktop', 'layout', 'design', 'interface', 'widget'],
      baseScore: 2.5,
      weight: 1.0
    },
    authentication: {
      keywords: ['auth', 'login', 'logout', 'session', 'jwt', 'oauth', 'permission', 'role', 'security', 'password', 'token', 'authorization', 'authentication', '2fa', 'mfa'],
      baseScore: 4,
      weight: 1.3
    },
    infrastructure: {
      keywords: ['deploy', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'pipeline', 'devops', 'terraform', 'ansible', 'monitoring', 'logging', 'scaling', 'load-balancing'],
      baseScore: 4.5,
      weight: 1.4
    },
    database: {
      keywords: ['schema', 'table', 'query', 'index', 'optimization', 'transaction', 'acid', 'nosql', 'sql', 'relationship', 'normalization', 'denormalization', 'sharding'],
      baseScore: 3.5,
      weight: 1.2
    },
    testing: {
      keywords: ['test', 'unit', 'integration', 'e2e', 'jest', 'mocha', 'cypress', 'selenium', 'tdd', 'bdd', 'coverage', 'mock', 'stub', 'fixture'],
      baseScore: 2,
      weight: 0.8
    },
    performance: {
      keywords: ['performance', 'optimization', 'speed', 'latency', 'throughput', 'benchmark', 'profiling', 'memory', 'cpu', 'bottleneck', 'caching', 'lazy-loading'],
      baseScore: 4,
      weight: 1.3
    },
    security: {
      keywords: ['security', 'vulnerability', 'encryption', 'ssl', 'tls', 'xss', 'csrf', 'injection', 'sanitization', 'validation', 'firewall', 'penetration'],
      baseScore: 4.5,
      weight: 1.5
    },
    integration: {
      keywords: ['integrate', 'api', 'webhook', 'third-party', 'external', 'service', 'plugin', 'module', 'package', 'library', 'sdk', 'connector'],
      baseScore: 3.5,
      weight: 1.2
    },
    realtime: {
      keywords: ['realtime', 'websocket', 'socket.io', 'streaming', 'live', 'push', 'notification', 'event', 'pubsub', 'message-queue'],
      baseScore: 4,
      weight: 1.3
    }
  };

  // Feature complexity indicators
  private static readonly FEATURE_INDICATORS = {
    simple: ['add', 'create', 'display', 'show', 'list', 'view', 'basic', 'simple'],
    moderate: ['update', 'modify', 'filter', 'sort', 'search', 'validate', 'calculate'],
    complex: ['optimize', 'refactor', 'migrate', 'transform', 'analyze', 'process', 'batch'],
    veryComplex: ['redesign', 'architect', 'overhaul', 'implement', 'build', 'develop', 'integrate']
  };

  // Integration complexity patterns
  private static readonly INTEGRATION_PATTERNS = {
    low: ['single', 'standalone', 'independent', 'isolated'],
    medium: ['connect', 'link', 'communicate', 'interact'],
    high: ['integrate', 'synchronize', 'coordinate', 'orchestrate', 'distributed']
  };

  // Work type indicators
  private static readonly WORK_TYPE_PATTERNS = {
    sequential: ['then', 'after', 'before', 'first', 'next', 'finally', 'step by step'],
    parallel: ['simultaneously', 'concurrently', 'parallel', 'at the same time', 'together']
  };

  /**
   * Estimate task complexity from description
   */
  static estimateComplexity(taskDescription: string): ComplexityScore {
    const normalizedTask = taskDescription.toLowerCase();
    
    // Analyze technical domains
    const domainAnalysis = this.analyzeTechnicalDomains(normalizedTask);
    
    // Analyze features
    const featureAnalysis = this.analyzeFeatures(normalizedTask);
    
    // Analyze integrations
    const integrationAnalysis = this.analyzeIntegrations(normalizedTask);
    
    // Analyze dependencies
    const dependencyAnalysis = this.analyzeDependencies(normalizedTask);
    
    // Analyze testing requirements
    const testingAnalysis = this.analyzeTestingRequirements(normalizedTask);
    
    // Analyze documentation requirements
    const documentationAnalysis = this.analyzeDocumentationRequirements(normalizedTask);
    
    // Determine work type
    const workType = this.determineWorkType(normalizedTask);
    
    // Calculate total score
    const breakdown = {
      technicalDomains: domainAnalysis.domains,
      featureComplexity: featureAnalysis.score,
      integrationComplexity: integrationAnalysis.score,
      dependencyComplexity: dependencyAnalysis.score,
      testingComplexity: testingAnalysis.score,
      documentationComplexity: documentationAnalysis.score
    };
    
    const totalScore = this.calculateTotalScore(breakdown);
    const confidence = this.calculateConfidence(taskDescription, domainAnalysis, featureAnalysis);
    const category = this.categorizeComplexity(totalScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(totalScore, breakdown, workType);
    
    return {
      totalScore,
      confidence,
      category,
      breakdown,
      analysis: {
        identifiedFeatures: featureAnalysis.features,
        technicalStack: domainAnalysis.stack,
        integrationPoints: integrationAnalysis.points,
        dependencies: dependencyAnalysis.dependencies,
        workType,
        estimatedEffort: this.estimateEffort(totalScore, category)
      },
      recommendations
    };
  }

  /**
   * Analyze technical domains in the task
   */
  private static analyzeTechnicalDomains(task: string): { domains: DomainComplexity[], stack: string[] } {
    const domains: DomainComplexity[] = [];
    const stack: string[] = [];
    
    for (const [domain, config] of Object.entries(this.DOMAIN_PATTERNS)) {
      const matchedKeywords = config.keywords.filter(keyword => 
        new RegExp(`\\b${keyword}\\b`, 'i').test(task)
      );
      
      if (matchedKeywords.length > 0) {
        domains.push({
          domain,
          score: config.baseScore * config.weight * Math.min(matchedKeywords.length / 3, 1.5),
          keywords: matchedKeywords
        });
        stack.push(...matchedKeywords);
      }
    }
    
    return { domains, stack: [...new Set(stack)] };
  }

  /**
   * Analyze feature complexity
   */
  private static analyzeFeatures(task: string): { score: number, features: string[] } {
    const features: string[] = [];
    let score = 0;
    
    // Count feature mentions
    const featurePattern = /(?:feature|functionality|capability|requirement|implement|create|build|develop)\s+(\w+(?:\s+\w+){0,3})/gi;
    const matches = task.match(featurePattern) || [];
    features.push(...matches);
    
    // Check complexity indicators
    for (const [level, indicators] of Object.entries(this.FEATURE_INDICATORS)) {
      const matchCount = indicators.filter(indicator => 
        new RegExp(`\\b${indicator}\\b`, 'i').test(task)
      ).length;
      
      if (matchCount > 0) {
        switch (level) {
          case 'simple': score += matchCount * 1; break;
          case 'moderate': score += matchCount * 2; break;
          case 'complex': score += matchCount * 3; break;
          case 'veryComplex': score += matchCount * 4; break;
        }
      }
    }
    
    // Additional score based on feature count
    score += Math.min(features.length * 0.5, 3);
    
    return { score, features };
  }

  /**
   * Analyze integration complexity
   */
  private static analyzeIntegrations(task: string): { score: number, points: string[] } {
    const points: string[] = [];
    let score = 0;
    
    // Find integration mentions
    const integrationPattern = /(?:integrate|connect|interface|communicate)\s+(?:with\s+)?(\w+(?:\s+\w+){0,3})/gi;
    let match;
    while ((match = integrationPattern.exec(task)) !== null) {
      points.push(match[1]);
    }
    
    // Check integration complexity levels
    for (const [level, patterns] of Object.entries(this.INTEGRATION_PATTERNS)) {
      const matchCount = patterns.filter(pattern => 
        new RegExp(`\\b${pattern}\\b`, 'i').test(task)
      ).length;
      
      if (matchCount > 0) {
        switch (level) {
          case 'low': score += matchCount * 1; break;
          case 'medium': score += matchCount * 2; break;
          case 'high': score += matchCount * 3; break;
        }
      }
    }
    
    // Additional score for external service mentions
    const externalServices = ['api', 'database', 'cache', 'queue', 'storage', 'email', 'sms', 'payment'];
    const serviceCount = externalServices.filter(service => 
      new RegExp(`\\b${service}\\b`, 'i').test(task)
    ).length;
    score += serviceCount * 1.5;
    
    return { score, points };
  }

  /**
   * Analyze dependencies
   */
  private static analyzeDependencies(task: string): { score: number, dependencies: string[] } {
    const dependencies: string[] = [];
    let score = 0;
    
    // Check for dependency indicators
    const dependencyPatterns = [
      /depends?\s+on\s+(\w+(?:\s+\w+){0,3})/gi,
      /requires?\s+(\w+(?:\s+\w+){0,3})/gi,
      /needs?\s+(\w+(?:\s+\w+){0,3})/gi,
      /after\s+(\w+(?:\s+\w+){0,3})/gi,
      /before\s+(\w+(?:\s+\w+){0,3})/gi
    ];
    
    for (const pattern of dependencyPatterns) {
      let match;
      while ((match = pattern.exec(task)) !== null) {
        dependencies.push(match[1]);
        score += 1.5;
      }
    }
    
    // Check for sequential work indicators
    const sequentialCount = this.WORK_TYPE_PATTERNS.sequential.filter(pattern =>
      new RegExp(`\\b${pattern}\\b`, 'i').test(task)
    ).length;
    score += sequentialCount * 0.5;
    
    return { score: Math.min(score, 5), dependencies };
  }

  /**
   * Analyze testing requirements
   */
  private static analyzeTestingRequirements(task: string): { score: number } {
    let score = 0;
    
    // Check for explicit testing mentions
    const testingKeywords = ['test', 'testing', 'unit test', 'integration test', 'e2e', 'coverage', 'tdd'];
    const explicitTestingCount = testingKeywords.filter(keyword =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(task)
    ).length;
    
    if (explicitTestingCount > 0) {
      score += explicitTestingCount * 2;
    } else {
      // Implicit testing based on feature complexity
      const featureCount = (task.match(/(?:feature|functionality|implement|create|build)/gi) || []).length;
      score += Math.min(featureCount * 0.5, 2);
    }
    
    return { score: Math.min(score, 5) };
  }

  /**
   * Analyze documentation requirements
   */
  private static analyzeDocumentationRequirements(task: string): { score: number } {
    let score = 0;
    
    // Check for explicit documentation mentions
    const docKeywords = ['document', 'documentation', 'readme', 'guide', 'tutorial', 'api doc', 'comment'];
    const explicitDocCount = docKeywords.filter(keyword =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(task)
    ).length;
    
    if (explicitDocCount > 0) {
      score += explicitDocCount * 1.5;
    } else {
      // Implicit documentation based on API/public interface mentions
      const apiCount = (task.match(/(?:api|endpoint|interface|public)/gi) || []).length;
      score += Math.min(apiCount * 0.3, 1);
    }
    
    return { score: Math.min(score, 3) };
  }

  /**
   * Determine work type (sequential, parallel, or mixed)
   */
  private static determineWorkType(task: string): 'sequential' | 'parallel' | 'mixed' {
    let sequentialScore = 0;
    let parallelScore = 0;
    
    // Check sequential patterns
    for (const pattern of this.WORK_TYPE_PATTERNS.sequential) {
      if (new RegExp(`\\b${pattern}\\b`, 'i').test(task)) {
        sequentialScore++;
      }
    }
    
    // Check parallel patterns
    for (const pattern of this.WORK_TYPE_PATTERNS.parallel) {
      if (new RegExp(`\\b${pattern}\\b`, 'i').test(task)) {
        parallelScore++;
      }
    }
    
    // Check for numbered steps or bullet points
    if (/(?:\d+\.|[-*])\s+\w+/g.test(task)) {
      sequentialScore += 2;
    }
    
    if (sequentialScore > 0 && parallelScore > 0) {
      return 'mixed';
    } else if (parallelScore > sequentialScore) {
      return 'parallel';
    } else {
      return 'sequential';
    }
  }

  /**
   * Calculate total complexity score
   */
  private static calculateTotalScore(breakdown: ComplexityScore['breakdown']): number {
    const domainScore = breakdown.technicalDomains.reduce((sum, d) => sum + d.score, 0);
    
    const weightedScore = 
      domainScore * 0.25 +
      breakdown.featureComplexity * 0.20 +
      breakdown.integrationComplexity * 0.20 +
      breakdown.dependencyComplexity * 0.15 +
      breakdown.testingComplexity * 0.10 +
      breakdown.documentationComplexity * 0.10;
    
    return Math.round(weightedScore * 10) / 10;
  }

  /**
   * Calculate confidence level
   */
  private static calculateConfidence(
    task: string, 
    domainAnalysis: { domains: DomainComplexity[] },
    featureAnalysis: { features: string[] }
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on task description length
    const wordCount = task.split(/\s+/).length;
    if (wordCount > 50) confidence += 0.2;
    else if (wordCount > 20) confidence += 0.1;
    
    // Increase confidence based on identified domains
    if (domainAnalysis.domains.length > 0) confidence += 0.1;
    if (domainAnalysis.domains.length > 2) confidence += 0.1;
    
    // Increase confidence based on identified features
    if (featureAnalysis.features.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Categorize complexity based on score
   */
  private static categorizeComplexity(score: number): ComplexityScore['category'] {
    if (score < 2) return 'trivial';
    if (score < 5) return 'simple';
    if (score < 10) return 'moderate';
    if (score < 15) return 'complex';
    return 'very-complex';
  }

  /**
   * Estimate effort based on complexity
   */
  private static estimateEffort(score: number, category: ComplexityScore['category']): string {
    const effortMap = {
      'trivial': '1-2 hours',
      'simple': '2-4 hours',
      'moderate': '1-2 days',
      'complex': '3-5 days',
      'very-complex': '1-2 weeks'
    };
    
    return effortMap[category];
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    score: number, 
    breakdown: ComplexityScore['breakdown'],
    workType: string
  ): string[] {
    const recommendations: string[] = [];
    
    // Team size recommendations
    if (score < 5) {
      recommendations.push('Single developer can handle this task');
    } else if (score < 10) {
      recommendations.push('Consider pair programming for better quality');
    } else {
      recommendations.push('Recommend team of 2-3 developers');
    }
    
    // Approach recommendations
    if (workType === 'parallel') {
      recommendations.push('Task can be parallelized - consider splitting among team members');
    } else if (workType === 'sequential') {
      recommendations.push('Task requires sequential execution - plan phases carefully');
    }
    
    // Technical recommendations
    if (breakdown.technicalDomains.length > 3) {
      recommendations.push('Multiple domains involved - ensure team has diverse expertise');
    }
    
    if (breakdown.integrationComplexity > 3) {
      recommendations.push('High integration complexity - allocate time for integration testing');
    }
    
    if (breakdown.dependencyComplexity > 3) {
      recommendations.push('Complex dependencies - create detailed execution plan');
    }
    
    if (breakdown.testingComplexity > 2) {
      recommendations.push('Significant testing required - follow TDD approach');
    }
    
    // Risk recommendations
    if (score > 15) {
      recommendations.push('High complexity - consider breaking into smaller tasks');
      recommendations.push('Plan for regular reviews and checkpoints');
    }
    
    return recommendations;
  }

  /**
   * Generate a summary report
   */
  static generateReport(score: ComplexityScore): string {
    const report = `
# Task Complexity Analysis Report

## Overall Assessment
- **Complexity Score**: ${score.totalScore}/20
- **Category**: ${score.category.toUpperCase()}
- **Confidence**: ${Math.round(score.confidence * 100)}%
- **Estimated Effort**: ${score.analysis.estimatedEffort}

## Technical Analysis
- **Domains Involved**: ${score.breakdown.technicalDomains.map(d => d.domain).join(', ')}
- **Work Type**: ${score.analysis.workType}
- **Feature Count**: ${score.analysis.identifiedFeatures.length}
- **Integration Points**: ${score.analysis.integrationPoints.length}

## Complexity Breakdown
- Technical Domains: ${score.breakdown.technicalDomains.reduce((sum, d) => sum + d.score, 0).toFixed(1)}
- Feature Complexity: ${score.breakdown.featureComplexity.toFixed(1)}
- Integration Complexity: ${score.breakdown.integrationComplexity.toFixed(1)}
- Dependency Complexity: ${score.breakdown.dependencyComplexity.toFixed(1)}
- Testing Requirements: ${score.breakdown.testingComplexity.toFixed(1)}
- Documentation Needs: ${score.breakdown.documentationComplexity.toFixed(1)}

## Recommendations
${score.recommendations.map(r => `- ${r}`).join('\n')}
`;
    
    return report.trim();
  }
}

// Export convenience function
export function estimateTaskComplexity(taskDescription: string): ComplexityScore {
  return TaskComplexityEstimator.estimateComplexity(taskDescription);
}

// Export report generator
export function generateComplexityReport(taskDescription: string): string {
  const score = TaskComplexityEstimator.estimateComplexity(taskDescription);
  return TaskComplexityEstimator.generateReport(score);
}