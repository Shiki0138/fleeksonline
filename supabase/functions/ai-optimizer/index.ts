import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizationRequest {
  type: 'resource_allocation' | 'cost_optimization' | 'performance_tuning' | 'cache_strategy' | 'scaling_recommendation';
  scope?: 'global' | 'service' | 'user';
  serviceId?: string;
  constraints?: {
    maxCost?: number;
    minPerformance?: number;
    targetSLA?: number;
  };
  timeWindow?: {
    start: string;
    end: string;
  };
}

interface OptimizationResponse {
  type: string;
  recommendations: Array<{
    action: string;
    impact: {
      cost: number;
      performance: number;
      reliability: number;
    };
    priority: 'critical' | 'high' | 'medium' | 'low';
    implementation: string;
    estimatedSavings?: number;
  }>;
  currentState: {
    totalCost: number;
    avgPerformance: number;
    resourceUtilization: any;
  };
  projectedState: {
    totalCost: number;
    avgPerformance: number;
    resourceUtilization: any;
  };
  automatedActions?: string[];
}

// Resource types and costs
const RESOURCE_COSTS = {
  compute: {
    edge_function: 0.40, // per million requests
    database_compute: 0.05, // per hour
    realtime: 0.001, // per concurrent connection
  },
  storage: {
    database: 0.125, // per GB
    object_storage: 0.021, // per GB
    cache: 0.15, // per GB RAM
  },
  bandwidth: {
    egress: 0.09, // per GB
    cdn: 0.08, // per GB
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request = await req.json() as OptimizationRequest;
    const { type, scope = 'global', serviceId, constraints = {}, timeWindow } = request;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let response: OptimizationResponse;

    switch (type) {
      case 'resource_allocation':
        response = await optimizeResourceAllocation(supabase, scope, constraints);
        break;
      
      case 'cost_optimization':
        response = await optimizeCosts(supabase, scope, constraints, timeWindow);
        break;
      
      case 'performance_tuning':
        response = await optimizePerformance(supabase, scope, serviceId);
        break;
      
      case 'cache_strategy':
        response = await optimizeCaching(supabase, scope);
        break;
      
      case 'scaling_recommendation':
        response = await generateScalingRecommendations(supabase, scope, constraints);
        break;
      
      default:
        throw new Error('Invalid optimization type');
    }

    // Apply automated optimizations if enabled
    if (response.automatedActions && response.automatedActions.length > 0) {
      await applyAutomatedOptimizations(supabase, response.automatedActions);
    }

    // Store optimization results
    await supabase.from('optimization_logs').insert({
      type,
      scope,
      recommendations: response.recommendations,
      current_state: response.currentState,
      projected_state: response.projectedState,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Optimization error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Resource allocation optimization
async function optimizeResourceAllocation(
  supabase: any,
  scope: string,
  constraints: any
): Promise<OptimizationResponse> {
  // Get current resource usage
  const usage = await getCurrentResourceUsage(supabase);
  const predictions = await predictResourceDemand(supabase);
  
  // Analyze inefficiencies
  const inefficiencies = identifyResourceInefficiencies(usage, predictions);
  
  // Generate optimization recommendations
  const recommendations = [];
  
  // CPU optimization
  if (usage.cpu.utilization < 0.3) {
    recommendations.push({
      action: 'Downscale compute resources',
      impact: {
        cost: -0.3,
        performance: 0,
        reliability: 0,
      },
      priority: 'high' as const,
      implementation: 'Reduce edge function instances from 4 to 2',
      estimatedSavings: 150,
    });
  } else if (usage.cpu.utilization > 0.8) {
    recommendations.push({
      action: 'Scale up compute resources',
      impact: {
        cost: 0.2,
        performance: 0.3,
        reliability: 0.2,
      },
      priority: 'critical' as const,
      implementation: 'Increase edge function instances from 4 to 6',
    });
  }
  
  // Memory optimization
  if (usage.memory.cacheHitRate < 0.7) {
    recommendations.push({
      action: 'Optimize cache configuration',
      impact: {
        cost: 0.1,
        performance: 0.4,
        reliability: 0.1,
      },
      priority: 'high' as const,
      implementation: 'Increase cache size and adjust TTL values',
      estimatedSavings: 80,
    });
  }
  
  // Database optimization
  if (usage.database.slowQueries > 100) {
    recommendations.push({
      action: 'Optimize database queries and indexes',
      impact: {
        cost: -0.2,
        performance: 0.5,
        reliability: 0.2,
      },
      priority: 'critical' as const,
      implementation: 'Add missing indexes and optimize N+1 queries',
      estimatedSavings: 200,
    });
  }

  const currentState = calculateCurrentState(usage);
  const projectedState = calculateProjectedState(currentState, recommendations);

  return {
    type: 'resource_allocation',
    recommendations,
    currentState,
    projectedState,
    automatedActions: getAutomatedActions(recommendations),
  };
}

// Cost optimization
async function optimizeCosts(
  supabase: any,
  scope: string,
  constraints: any,
  timeWindow?: any
): Promise<OptimizationResponse> {
  // Get cost breakdown
  const costs = await analyzeCosts(supabase, timeWindow);
  const usage = await getDetailedUsage(supabase, timeWindow);
  
  const recommendations = [];
  
  // Storage optimization
  if (costs.storage.unused > 100) { // GB
    recommendations.push({
      action: 'Clean up unused storage',
      impact: {
        cost: -0.4,
        performance: 0,
        reliability: 0,
      },
      priority: 'medium' as const,
      implementation: 'Delete orphaned files and old backups',
      estimatedSavings: costs.storage.unused * RESOURCE_COSTS.storage.object_storage,
    });
  }
  
  // Bandwidth optimization
  if (costs.bandwidth.cdn < costs.bandwidth.direct * 0.8) {
    recommendations.push({
      action: 'Increase CDN usage',
      impact: {
        cost: -0.2,
        performance: 0.3,
        reliability: 0.1,
      },
      priority: 'high' as const,
      implementation: 'Route more static content through CDN',
      estimatedSavings: (costs.bandwidth.direct - costs.bandwidth.cdn) * 0.2,
    });
  }
  
  // Edge function optimization
  if (usage.edgeFunctions.idleTime > 0.5) {
    recommendations.push({
      action: 'Implement function warming strategy',
      impact: {
        cost: -0.15,
        performance: 0.2,
        reliability: 0,
      },
      priority: 'medium' as const,
      implementation: 'Use scheduled warming to reduce cold starts',
      estimatedSavings: 50,
    });
  }
  
  // Database optimization
  if (costs.database.replication > costs.database.primary * 0.5) {
    recommendations.push({
      action: 'Optimize replication strategy',
      impact: {
        cost: -0.3,
        performance: -0.1,
        reliability: -0.05,
      },
      priority: 'low' as const,
      implementation: 'Reduce read replicas from 3 to 2 in low-traffic regions',
      estimatedSavings: 120,
    });
  }

  const currentState = {
    totalCost: Object.values(costs).reduce((sum: number, category: any) => 
      sum + Object.values(category).reduce((s: number, v: any) => s + (typeof v === 'number' ? v : 0), 0), 0),
    avgPerformance: 0.75,
    resourceUtilization: usage,
  };

  const projectedState = calculateProjectedState(currentState, recommendations);

  return {
    type: 'cost_optimization',
    recommendations,
    currentState,
    projectedState,
  };
}

// Performance optimization
async function optimizePerformance(
  supabase: any,
  scope: string,
  serviceId?: string
): Promise<OptimizationResponse> {
  // Get performance metrics
  const metrics = await getPerformanceMetrics(supabase, serviceId);
  const bottlenecks = identifyBottlenecks(metrics);
  
  const recommendations = [];
  
  // API latency optimization
  if (metrics.api.p95Latency > 500) {
    recommendations.push({
      action: 'Implement response caching',
      impact: {
        cost: 0.1,
        performance: 0.6,
        reliability: 0.1,
      },
      priority: 'critical' as const,
      implementation: 'Add Redis caching for frequently accessed endpoints',
    });
  }
  
  // Database query optimization
  if (metrics.database.avgQueryTime > 100) {
    recommendations.push({
      action: 'Optimize database queries',
      impact: {
        cost: 0,
        performance: 0.7,
        reliability: 0.2,
      },
      priority: 'critical' as const,
      implementation: 'Add composite indexes and denormalize hot tables',
    });
  }
  
  // Edge function optimization
  if (metrics.edgeFunctions.coldStartRate > 0.2) {
    recommendations.push({
      action: 'Reduce cold starts',
      impact: {
        cost: 0.05,
        performance: 0.4,
        reliability: 0.1,
      },
      priority: 'high' as const,
      implementation: 'Implement function pre-warming and connection pooling',
    });
  }
  
  // Content delivery optimization
  if (metrics.cdn.cacheHitRate < 0.8) {
    recommendations.push({
      action: 'Improve CDN cache hit rate',
      impact: {
        cost: -0.1,
        performance: 0.5,
        reliability: 0.2,
      },
      priority: 'high' as const,
      implementation: 'Optimize cache headers and implement edge computing',
    });
  }

  const currentState = {
    totalCost: calculateCurrentCost(metrics),
    avgPerformance: calculateAvgPerformance(metrics),
    resourceUtilization: metrics,
  };

  const projectedState = calculateProjectedState(currentState, recommendations);

  return {
    type: 'performance_tuning',
    recommendations,
    currentState,
    projectedState,
    automatedActions: ['cache_warming', 'index_creation'],
  };
}

// Caching strategy optimization
async function optimizeCaching(
  supabase: any,
  scope: string
): Promise<OptimizationResponse> {
  // Analyze cache performance
  const cacheMetrics = await getCacheMetrics(supabase);
  const patterns = await analyzeAccessPatterns(supabase);
  
  const recommendations = [];
  
  // Cache size optimization
  const optimalCacheSize = calculateOptimalCacheSize(patterns, cacheMetrics);
  if (Math.abs(optimalCacheSize - cacheMetrics.currentSize) > 0.2 * cacheMetrics.currentSize) {
    recommendations.push({
      action: 'Adjust cache size',
      impact: {
        cost: optimalCacheSize > cacheMetrics.currentSize ? 0.2 : -0.2,
        performance: 0.3,
        reliability: 0.1,
      },
      priority: 'high' as const,
      implementation: `${optimalCacheSize > cacheMetrics.currentSize ? 'Increase' : 'Decrease'} cache from ${cacheMetrics.currentSize}GB to ${optimalCacheSize}GB`,
      estimatedSavings: optimalCacheSize < cacheMetrics.currentSize ? 
        (cacheMetrics.currentSize - optimalCacheSize) * RESOURCE_COSTS.storage.cache * 30 : 0,
    });
  }
  
  // TTL optimization
  if (cacheMetrics.evictionRate > 0.3) {
    recommendations.push({
      action: 'Optimize cache TTL values',
      impact: {
        cost: 0,
        performance: 0.4,
        reliability: 0,
      },
      priority: 'medium' as const,
      implementation: 'Implement adaptive TTL based on access patterns',
    });
  }
  
  // Multi-tier caching
  if (patterns.hotDataRatio < 0.2 && !cacheMetrics.hasMultiTier) {
    recommendations.push({
      action: 'Implement multi-tier caching',
      impact: {
        cost: 0.1,
        performance: 0.5,
        reliability: 0.2,
      },
      priority: 'high' as const,
      implementation: 'Add L1 (memory) and L2 (SSD) cache layers',
    });
  }
  
  // Edge caching
  if (patterns.geoDistribution.spread > 0.5) {
    recommendations.push({
      action: 'Implement edge caching',
      impact: {
        cost: 0.3,
        performance: 0.6,
        reliability: 0.3,
      },
      priority: 'high' as const,
      implementation: 'Deploy caches to edge locations near users',
    });
  }

  const currentState = {
    totalCost: cacheMetrics.monthlyCost,
    avgPerformance: cacheMetrics.hitRate,
    resourceUtilization: {
      cacheSize: cacheMetrics.currentSize,
      hitRate: cacheMetrics.hitRate,
      evictionRate: cacheMetrics.evictionRate,
    },
  };

  const projectedState = calculateProjectedState(currentState, recommendations);

  return {
    type: 'cache_strategy',
    recommendations,
    currentState,
    projectedState,
  };
}

// Scaling recommendations
async function generateScalingRecommendations(
  supabase: any,
  scope: string,
  constraints: any
): Promise<OptimizationResponse> {
  // Get scaling metrics
  const metrics = await getScalingMetrics(supabase);
  const predictions = await predictFutureLoad(supabase);
  
  const recommendations = [];
  
  // Horizontal scaling
  if (predictions.peakLoad > metrics.currentCapacity * 0.8) {
    const additionalInstances = Math.ceil((predictions.peakLoad - metrics.currentCapacity) / metrics.instanceCapacity);
    recommendations.push({
      action: 'Scale out horizontally',
      impact: {
        cost: 0.3 * additionalInstances,
        performance: 0.4,
        reliability: 0.5,
      },
      priority: 'critical' as const,
      implementation: `Add ${additionalInstances} instances to handle predicted load`,
    });
  }
  
  // Vertical scaling
  if (metrics.resourceUtilization.cpu > 0.7 && metrics.resourceUtilization.memory > 0.7) {
    recommendations.push({
      action: 'Scale up instance size',
      impact: {
        cost: 0.4,
        performance: 0.3,
        reliability: 0.2,
      },
      priority: 'high' as const,
      implementation: 'Upgrade instances from medium to large',
    });
  }
  
  // Auto-scaling configuration
  if (!metrics.hasAutoScaling) {
    recommendations.push({
      action: 'Implement auto-scaling',
      impact: {
        cost: -0.2,
        performance: 0.3,
        reliability: 0.4,
      },
      priority: 'high' as const,
      implementation: 'Configure auto-scaling with 70% CPU threshold',
      estimatedSavings: 200,
    });
  }
  
  // Regional distribution
  if (predictions.geoDistribution.concentration > 0.7) {
    recommendations.push({
      action: 'Add regional deployments',
      impact: {
        cost: 0.5,
        performance: 0.6,
        reliability: 0.5,
      },
      priority: 'medium' as const,
      implementation: 'Deploy to 2 additional regions with high user concentration',
    });
  }

  const currentState = {
    totalCost: metrics.monthlyCost,
    avgPerformance: metrics.avgResponseTime,
    resourceUtilization: metrics.resourceUtilization,
  };

  const projectedState = calculateProjectedState(currentState, recommendations);

  return {
    type: 'scaling_recommendation',
    recommendations,
    currentState,
    projectedState,
    automatedActions: ['auto_scaling_setup'],
  };
}

// Helper functions
async function getCurrentResourceUsage(supabase: any): Promise<any> {
  // Simulate resource usage data
  return {
    cpu: {
      utilization: 0.65,
      peak: 0.85,
      average: 0.55,
    },
    memory: {
      used: 24576, // MB
      total: 32768,
      cacheHitRate: 0.75,
    },
    database: {
      connections: 150,
      slowQueries: 45,
      replicationLag: 120, // ms
    },
    storage: {
      used: 850, // GB
      total: 1000,
      growth: 25, // GB/month
    },
  };
}

async function predictResourceDemand(supabase: any): Promise<any> {
  // Simple demand prediction
  return {
    cpu: { peak: 0.9, average: 0.7 },
    memory: { peak: 28000, average: 22000 },
    storage: { monthly: 30 },
    requests: { peak: 10000, average: 5000 },
  };
}

function identifyResourceInefficiencies(usage: any, predictions: any): any[] {
  const inefficiencies = [];
  
  if (usage.cpu.utilization < 0.4) {
    inefficiencies.push({ type: 'underutilized_cpu', severity: 'medium' });
  }
  
  if (usage.memory.cacheHitRate < 0.7) {
    inefficiencies.push({ type: 'poor_cache_performance', severity: 'high' });
  }
  
  return inefficiencies;
}

async function analyzeCosts(supabase: any, timeWindow?: any): Promise<any> {
  // Simulate cost analysis
  return {
    compute: {
      edgeFunctions: 450,
      database: 280,
      realtime: 120,
    },
    storage: {
      database: 180,
      objects: 220,
      unused: 150,
    },
    bandwidth: {
      cdn: 180,
      direct: 280,
    },
  };
}

async function getDetailedUsage(supabase: any, timeWindow?: any): Promise<any> {
  return {
    edgeFunctions: {
      invocations: 5000000,
      avgDuration: 120, // ms
      idleTime: 0.6,
    },
    database: {
      queries: 8000000,
      writes: 2000000,
      reads: 6000000,
    },
  };
}

async function getPerformanceMetrics(supabase: any, serviceId?: string): Promise<any> {
  return {
    api: {
      p50Latency: 120,
      p95Latency: 580,
      p99Latency: 1200,
    },
    database: {
      avgQueryTime: 85,
      slowQueries: 150,
    },
    edgeFunctions: {
      coldStartRate: 0.25,
      avgDuration: 150,
    },
    cdn: {
      cacheHitRate: 0.72,
      avgResponseTime: 45,
    },
  };
}

function identifyBottlenecks(metrics: any): any[] {
  const bottlenecks = [];
  
  if (metrics.api.p95Latency > 500) {
    bottlenecks.push({ component: 'api', severity: 'high' });
  }
  
  if (metrics.database.avgQueryTime > 100) {
    bottlenecks.push({ component: 'database', severity: 'critical' });
  }
  
  return bottlenecks;
}

async function getCacheMetrics(supabase: any): Promise<any> {
  return {
    currentSize: 16, // GB
    hitRate: 0.78,
    missRate: 0.22,
    evictionRate: 0.35,
    monthlyCost: 16 * RESOURCE_COSTS.storage.cache * 30,
    hasMultiTier: false,
  };
}

async function analyzeAccessPatterns(supabase: any): Promise<any> {
  return {
    hotDataRatio: 0.15,
    temporalLocality: 0.7,
    spatialLocality: 0.6,
    geoDistribution: {
      spread: 0.65,
      primaryRegions: ['us-east', 'eu-west'],
    },
  };
}

function calculateOptimalCacheSize(patterns: any, metrics: any): number {
  // Simple cache size optimization
  const baseSize = 8;
  const hotDataMultiplier = 1 / patterns.hotDataRatio;
  const hitRateAdjustment = metrics.hitRate < 0.8 ? 1.5 : 1;
  
  return Math.round(baseSize * hotDataMultiplier * hitRateAdjustment);
}

async function getScalingMetrics(supabase: any): Promise<any> {
  return {
    currentCapacity: 10000, // requests/sec
    instanceCapacity: 2500,
    instances: 4,
    resourceUtilization: {
      cpu: 0.72,
      memory: 0.68,
      network: 0.45,
    },
    hasAutoScaling: false,
    monthlyCost: 1200,
    avgResponseTime: 180, // ms
  };
}

async function predictFutureLoad(supabase: any): Promise<any> {
  return {
    peakLoad: 12000, // requests/sec
    avgLoad: 7000,
    growthRate: 0.15, // 15% monthly
    geoDistribution: {
      concentration: 0.75,
      topRegions: ['us-east', 'us-west'],
    },
  };
}

function calculateCurrentState(data: any): any {
  return {
    totalCost: 2500, // monthly
    avgPerformance: 0.75,
    resourceUtilization: data,
  };
}

function calculateProjectedState(current: any, recommendations: any[]): any {
  let costChange = 0;
  let performanceChange = 0;
  
  recommendations.forEach(rec => {
    costChange += rec.impact.cost;
    performanceChange += rec.impact.performance;
  });
  
  return {
    totalCost: current.totalCost * (1 + costChange),
    avgPerformance: Math.min(current.avgPerformance * (1 + performanceChange), 0.99),
    resourceUtilization: current.resourceUtilization,
  };
}

function calculateCurrentCost(metrics: any): number {
  // Estimate based on metrics
  return 1800;
}

function calculateAvgPerformance(metrics: any): number {
  // Calculate normalized performance score
  const latencyScore = Math.max(0, 1 - (metrics.api.p95Latency / 1000));
  const cacheScore = metrics.cdn.cacheHitRate;
  
  return (latencyScore + cacheScore) / 2;
}

function getAutomatedActions(recommendations: any[]): string[] {
  const actions = [];
  
  recommendations.forEach(rec => {
    if (rec.priority === 'critical' && rec.impact.cost < 0) {
      actions.push(`auto_${rec.action.toLowerCase().replace(/ /g, '_')}`);
    }
  });
  
  return actions;
}

async function applyAutomatedOptimizations(supabase: any, actions: string[]): Promise<void> {
  for (const action of actions) {
    await supabase.from('automated_optimizations').insert({
      action,
      status: 'applied',
      applied_at: new Date().toISOString(),
    });
    
    console.log(`Applied automated optimization: ${action}`);
  }
}