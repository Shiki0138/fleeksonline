import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkloadRequest {
  jobId?: string;
  action: 'submit' | 'status' | 'cancel' | 'retry' | 'metrics';
  job?: {
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    payload: any;
    requiredModels?: string[];
    estimatedDuration?: number;
    deadline?: string;
  };
}

interface WorkloadResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  result?: any;
  error?: string;
  metrics?: {
    queueTime: number;
    processingTime: number;
    totalTime: number;
    resourceUsage: any;
  };
}

// Job queue priorities
const PRIORITY_WEIGHTS = {
  critical: 1000,
  high: 100,
  medium: 10,
  low: 1,
};

// Resource pools
const RESOURCE_POOLS = {
  GPU: { total: 4, available: 4 },
  CPU: { total: 16, available: 16 },
  MEMORY: { total: 32768, available: 32768 }, // MB
};

// Active jobs tracking
const activeJobs = new Map<string, any>();
const jobQueue: any[] = [];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request = await req.json() as WorkloadRequest;
    const { jobId, action, job } = request;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let response: WorkloadResponse;

    switch (action) {
      case 'submit':
        response = await submitJob(supabase, job!);
        break;
      
      case 'status':
        response = await getJobStatus(supabase, jobId!);
        break;
      
      case 'cancel':
        response = await cancelJob(supabase, jobId!);
        break;
      
      case 'retry':
        response = await retryJob(supabase, jobId!);
        break;
      
      case 'metrics':
        response = await getSystemMetrics(supabase);
        break;
      
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Workload manager error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Submit new AI job
async function submitJob(supabase: any, job: any): Promise<WorkloadResponse> {
  const jobId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // Estimate resource requirements
  const resources = estimateResources(job);

  // Check if resources are available
  const canSchedule = checkResourceAvailability(resources);

  // Create job record
  const jobRecord = {
    id: jobId,
    type: job.type,
    priority: job.priority,
    payload: job.payload,
    required_models: job.requiredModels || [],
    estimated_duration: job.estimatedDuration || 60,
    deadline: job.deadline,
    status: canSchedule ? 'processing' : 'queued',
    resources,
    created_at: timestamp,
    queue_entered_at: canSchedule ? null : timestamp,
  };

  await supabase.from('ai_jobs').insert(jobRecord);

  if (canSchedule) {
    // Process immediately
    allocateResources(resources);
    processJob(supabase, jobRecord);
  } else {
    // Add to queue
    jobQueue.push(jobRecord);
    jobQueue.sort((a, b) => calculatePriority(b) - calculatePriority(a));
  }

  return {
    jobId,
    status: jobRecord.status,
    progress: 0,
  };
}

// Process AI job
async function processJob(supabase: any, job: any): Promise<void> {
  const startTime = Date.now();
  activeJobs.set(job.id, { job, startTime });

  try {
    // Update job status
    await supabase
      .from('ai_jobs')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Route to appropriate processor
    let result;
    switch (job.type) {
      case 'video_analysis':
        result = await processVideoAnalysis(job.payload);
        break;
      
      case 'recommendation_batch':
        result = await processRecommendationBatch(job.payload);
        break;
      
      case 'content_moderation':
        result = await processContentModeration(job.payload);
        break;
      
      case 'analytics_aggregation':
        result = await processAnalytics(job.payload);
        break;
      
      case 'model_training':
        result = await processModelTraining(job.payload);
        break;
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Update job with results
    const processingTime = Date.now() - startTime;
    await supabase
      .from('ai_jobs')
      .update({
        status: 'completed',
        result,
        processing_time: processingTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Release resources
    releaseResources(job.resources);
    activeJobs.delete(job.id);

    // Process next job in queue
    scheduleNextJob(supabase);
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    
    // Update job with error
    await supabase
      .from('ai_jobs')
      .update({
        status: 'failed',
        error: error.message,
        failed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Release resources
    releaseResources(job.resources);
    activeJobs.delete(job.id);

    // Process next job
    scheduleNextJob(supabase);
  }
}

// Job processors
async function processVideoAnalysis(payload: any): Promise<any> {
  // Simulate video processing workload
  const { videoId, operations } = payload;
  
  // Call video processing edge function
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-video-processor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoId, operations }),
  });

  return await response.json();
}

async function processRecommendationBatch(payload: any): Promise<any> {
  const { userIds, type, limit } = payload;
  const results = [];

  // Process recommendations for multiple users
  for (const userId of userIds) {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-recommendations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, type, limit }),
    });

    results.push(await response.json());
  }

  return results;
}

async function processContentModeration(payload: any): Promise<any> {
  const { contentIds, contentType } = payload;
  const results = [];

  // Batch moderation
  for (const contentId of contentIds) {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-moderation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contentId, contentType }),
    });

    results.push(await response.json());
  }

  return results;
}

async function processAnalytics(payload: any): Promise<any> {
  // Aggregate analytics data
  const { metric, timeRange, groupBy } = payload;
  
  // Simulate analytics processing
  return {
    metric,
    timeRange,
    data: Array.from({ length: 10 }, (_, i) => ({
      group: `Group ${i}`,
      value: Math.random() * 1000,
    })),
  };
}

async function processModelTraining(payload: any): Promise<any> {
  // Simulate model training
  const { modelType, trainingData, hyperparameters } = payload;
  
  // In production, this would trigger actual model training
  return {
    modelId: crypto.randomUUID(),
    modelType,
    accuracy: 0.85 + Math.random() * 0.1,
    trainingTime: Math.floor(Math.random() * 3600),
  };
}

// Resource management
function estimateResources(job: any): any {
  const baseResources = {
    cpu: 1,
    memory: 512,
    gpu: 0,
  };

  // Adjust based on job type
  switch (job.type) {
    case 'video_analysis':
      return { cpu: 2, memory: 2048, gpu: 1 };
    
    case 'model_training':
      return { cpu: 4, memory: 8192, gpu: 2 };
    
    case 'recommendation_batch':
      return { cpu: 2, memory: 1024, gpu: 0 };
    
    default:
      return baseResources;
  }
}

function checkResourceAvailability(required: any): boolean {
  return (
    RESOURCE_POOLS.CPU.available >= required.cpu &&
    RESOURCE_POOLS.MEMORY.available >= required.memory &&
    RESOURCE_POOLS.GPU.available >= required.gpu
  );
}

function allocateResources(resources: any): void {
  RESOURCE_POOLS.CPU.available -= resources.cpu;
  RESOURCE_POOLS.MEMORY.available -= resources.memory;
  RESOURCE_POOLS.GPU.available -= resources.gpu;
}

function releaseResources(resources: any): void {
  RESOURCE_POOLS.CPU.available += resources.cpu;
  RESOURCE_POOLS.MEMORY.available += resources.memory;
  RESOURCE_POOLS.GPU.available += resources.gpu;
}

// Queue management
function calculatePriority(job: any): number {
  let priority = PRIORITY_WEIGHTS[job.priority as keyof typeof PRIORITY_WEIGHTS];
  
  // Boost priority for jobs near deadline
  if (job.deadline) {
    const timeToDeadline = new Date(job.deadline).getTime() - Date.now();
    if (timeToDeadline < 300000) { // 5 minutes
      priority *= 10;
    }
  }
  
  // Consider queue time
  if (job.queue_entered_at) {
    const queueTime = Date.now() - new Date(job.queue_entered_at).getTime();
    priority += queueTime / 60000; // Add 1 point per minute in queue
  }
  
  return priority;
}

async function scheduleNextJob(supabase: any): Promise<void> {
  // Check if there are queued jobs
  if (jobQueue.length === 0) return;

  // Find next job that can be scheduled
  for (let i = 0; i < jobQueue.length; i++) {
    const job = jobQueue[i];
    if (checkResourceAvailability(job.resources)) {
      // Remove from queue and process
      jobQueue.splice(i, 1);
      allocateResources(job.resources);
      processJob(supabase, job);
      break;
    }
  }
}

// Job status and control
async function getJobStatus(supabase: any, jobId: string): Promise<WorkloadResponse> {
  const { data: job, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !job) {
    throw new Error('Job not found');
  }

  // Calculate progress for active jobs
  let progress = 0;
  if (job.status === 'processing') {
    const activeJob = activeJobs.get(jobId);
    if (activeJob) {
      const elapsed = Date.now() - activeJob.startTime;
      progress = Math.min(elapsed / (job.estimated_duration * 1000), 0.99);
    }
  } else if (job.status === 'completed') {
    progress = 1;
  }

  return {
    jobId,
    status: job.status,
    progress,
    result: job.result,
    error: job.error,
    metrics: job.status === 'completed' ? {
      queueTime: job.queue_entered_at ? 
        new Date(job.processing_started_at).getTime() - new Date(job.queue_entered_at).getTime() : 0,
      processingTime: job.processing_time,
      totalTime: new Date(job.completed_at || job.failed_at).getTime() - new Date(job.created_at).getTime(),
      resourceUsage: job.resources,
    } : undefined,
  };
}

async function cancelJob(supabase: any, jobId: string): Promise<WorkloadResponse> {
  // Check if job is active
  if (activeJobs.has(jobId)) {
    // In production, would send cancellation signal to processor
    const activeJob = activeJobs.get(jobId);
    releaseResources(activeJob.job.resources);
    activeJobs.delete(jobId);
  }

  // Remove from queue if present
  const queueIndex = jobQueue.findIndex(j => j.id === jobId);
  if (queueIndex !== -1) {
    jobQueue.splice(queueIndex, 1);
  }

  // Update database
  await supabase
    .from('ai_jobs')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  return {
    jobId,
    status: 'cancelled',
  };
}

async function retryJob(supabase: any, jobId: string): Promise<WorkloadResponse> {
  // Get original job
  const { data: originalJob } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!originalJob || originalJob.status !== 'failed') {
    throw new Error('Job cannot be retried');
  }

  // Create new job with same parameters
  return submitJob(supabase, {
    type: originalJob.type,
    priority: originalJob.priority,
    payload: originalJob.payload,
    requiredModels: originalJob.required_models,
    estimatedDuration: originalJob.estimated_duration,
    deadline: originalJob.deadline,
  });
}

async function getSystemMetrics(supabase: any): Promise<any> {
  // Get current system state
  const metrics = {
    resources: {
      cpu: {
        total: RESOURCE_POOLS.CPU.total,
        available: RESOURCE_POOLS.CPU.available,
        utilization: (RESOURCE_POOLS.CPU.total - RESOURCE_POOLS.CPU.available) / RESOURCE_POOLS.CPU.total,
      },
      memory: {
        total: RESOURCE_POOLS.MEMORY.total,
        available: RESOURCE_POOLS.MEMORY.available,
        utilization: (RESOURCE_POOLS.MEMORY.total - RESOURCE_POOLS.MEMORY.available) / RESOURCE_POOLS.MEMORY.total,
      },
      gpu: {
        total: RESOURCE_POOLS.GPU.total,
        available: RESOURCE_POOLS.GPU.available,
        utilization: (RESOURCE_POOLS.GPU.total - RESOURCE_POOLS.GPU.available) / RESOURCE_POOLS.GPU.total,
      },
    },
    jobs: {
      active: activeJobs.size,
      queued: jobQueue.length,
      queuedByPriority: {
        critical: jobQueue.filter(j => j.priority === 'critical').length,
        high: jobQueue.filter(j => j.priority === 'high').length,
        medium: jobQueue.filter(j => j.priority === 'medium').length,
        low: jobQueue.filter(j => j.priority === 'low').length,
      },
    },
    performance: {
      avgQueueTime: await calculateAvgQueueTime(supabase),
      avgProcessingTime: await calculateAvgProcessingTime(supabase),
      successRate: await calculateSuccessRate(supabase),
    },
  };

  return metrics;
}

async function calculateAvgQueueTime(supabase: any): Promise<number> {
  const { data } = await supabase
    .from('ai_jobs')
    .select('queue_entered_at, processing_started_at')
    .not('queue_entered_at', 'is', null)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  if (!data || data.length === 0) return 0;

  const totalQueueTime = data.reduce((sum, job) => {
    const queueTime = new Date(job.processing_started_at).getTime() - new Date(job.queue_entered_at).getTime();
    return sum + queueTime;
  }, 0);

  return totalQueueTime / data.length;
}

async function calculateAvgProcessingTime(supabase: any): Promise<number> {
  const { data } = await supabase
    .from('ai_jobs')
    .select('processing_time')
    .eq('status', 'completed')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  if (!data || data.length === 0) return 0;

  const totalTime = data.reduce((sum, job) => sum + job.processing_time, 0);
  return totalTime / data.length;
}

async function calculateSuccessRate(supabase: any): Promise<number> {
  const { data } = await supabase
    .from('ai_jobs')
    .select('status')
    .in('status', ['completed', 'failed'])
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  if (!data || data.length === 0) return 1;

  const successful = data.filter(job => job.status === 'completed').length;
  return successful / data.length;
}