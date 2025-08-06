import { AI_CONFIG } from '../config';

interface ModelInfo {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'multimodal';
  provider: 'huggingface' | 'replicate' | 'cloudflare' | 'openai' | 'cohere';
  capabilities: string[];
  costPerRequest: number;
  avgLatency: number;
  maxInputSize: number;
  rateLimit?: number;
}

export class ModelManager {
  private models: Map<string, ModelInfo> = new Map();
  private modelUsage: Map<string, { count: number; cost: number }> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels(): void {
    // Text models
    this.registerModel({
      id: 'unitary/toxic-bert',
      type: 'text',
      provider: 'huggingface',
      capabilities: ['toxicity_detection', 'moderation'],
      costPerRequest: 0,
      avgLatency: 200,
      maxInputSize: 512,
    });

    this.registerModel({
      id: 'sentence-transformers/all-MiniLM-L6-v2',
      type: 'text',
      provider: 'huggingface',
      capabilities: ['embeddings', 'semantic_search'],
      costPerRequest: 0,
      avgLatency: 150,
      maxInputSize: 256,
    });

    // Image models
    this.registerModel({
      id: 'openai/clip-vit-base-patch32',
      type: 'image',
      provider: 'huggingface',
      capabilities: ['image_classification', 'image_text_matching'],
      costPerRequest: 0,
      avgLatency: 300,
      maxInputSize: 10 * 1024 * 1024, // 10MB
    });

    this.registerModel({
      id: 'microsoft/resnet-50',
      type: 'image',
      provider: 'huggingface',
      capabilities: ['image_classification'],
      costPerRequest: 0,
      avgLatency: 250,
      maxInputSize: 10 * 1024 * 1024,
    });

    // Video models
    this.registerModel({
      id: 'facebook/detr-resnet-50',
      type: 'video',
      provider: 'huggingface',
      capabilities: ['object_detection', 'scene_analysis'],
      costPerRequest: 0,
      avgLatency: 500,
      maxInputSize: 50 * 1024 * 1024, // 50MB
    });

    // Multimodal models
    this.registerModel({
      id: '@cf/openai/clip-vit-base-patch32',
      type: 'multimodal',
      provider: 'cloudflare',
      capabilities: ['image_text_matching', 'zero_shot_classification'],
      costPerRequest: 0.001,
      avgLatency: 100,
      maxInputSize: 10 * 1024 * 1024,
      rateLimit: 1000, // per minute
    });
  }

  registerModel(model: ModelInfo): void {
    this.models.set(model.id, model);
    this.modelUsage.set(model.id, { count: 0, cost: 0 });
  }

  // Get best model for a specific task
  getBestModel(
    task: string,
    constraints?: {
      maxLatency?: number;
      maxCost?: number;
      requiredCapabilities?: string[];
    }
  ): ModelInfo | null {
    const candidates = Array.from(this.models.values()).filter(model => {
      // Check capabilities
      if (constraints?.requiredCapabilities) {
        const hasAllCapabilities = constraints.requiredCapabilities.every(cap =>
          model.capabilities.includes(cap)
        );
        if (!hasAllCapabilities) return false;
      }

      // Check latency constraint
      if (constraints?.maxLatency && model.avgLatency > constraints.maxLatency) {
        return false;
      }

      // Check cost constraint
      if (constraints?.maxCost && model.costPerRequest > constraints.maxCost) {
        return false;
      }

      // Check if model has the required capability
      return model.capabilities.some(cap => cap.includes(task.toLowerCase()));
    });

    if (candidates.length === 0) return null;

    // Sort by performance (latency) and cost
    candidates.sort((a, b) => {
      const scoreA = a.avgLatency + (a.costPerRequest * 1000);
      const scoreB = b.avgLatency + (b.costPerRequest * 1000);
      return scoreA - scoreB;
    });

    return candidates[0];
  }

  // Track model usage
  trackUsage(modelId: string, success: boolean = true): void {
    const model = this.models.get(modelId);
    if (!model) return;

    const usage = this.modelUsage.get(modelId) || { count: 0, cost: 0 };
    usage.count++;
    if (success) {
      usage.cost += model.costPerRequest;
    }
    this.modelUsage.set(modelId, usage);
  }

  // Get usage statistics
  getUsageStats(): Array<{
    modelId: string;
    count: number;
    cost: number;
    avgCost: number;
  }> {
    return Array.from(this.modelUsage.entries()).map(([modelId, usage]) => ({
      modelId,
      count: usage.count,
      cost: usage.cost,
      avgCost: usage.count > 0 ? usage.cost / usage.count : 0,
    }));
  }

  // Check if model is available
  isModelAvailable(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (!model) return false;

    // Check rate limits
    if (model.rateLimit) {
      const usage = this.modelUsage.get(modelId);
      // Simple rate limit check (in production, use time-windowed counting)
      if (usage && usage.count > model.rateLimit) {
        return false;
      }
    }

    return true;
  }

  // Get model info
  getModel(modelId: string): ModelInfo | undefined {
    return this.models.get(modelId);
  }

  // Get all models for a type
  getModelsByType(type: ModelInfo['type']): ModelInfo[] {
    return Array.from(this.models.values()).filter(model => model.type === type);
  }

  // Estimate cost for batch processing
  estimateBatchCost(modelId: string, batchSize: number): number {
    const model = this.models.get(modelId);
    if (!model) return 0;

    return model.costPerRequest * batchSize;
  }

  // Get optimal batch size for a model
  getOptimalBatchSize(modelId: string, maxLatency: number): number {
    const model = this.models.get(modelId);
    if (!model) return 1;

    // Simple calculation based on latency
    const batchesPerLatencyWindow = Math.floor(maxLatency / model.avgLatency);
    return Math.max(1, Math.min(batchesPerLatencyWindow, 50)); // Cap at 50
  }
}

// Singleton instance
export const modelManager = new ModelManager();