// AI Service Configuration
export const AI_CONFIG = {
  // Free AI API endpoints
  apis: {
    huggingFace: {
      baseUrl: 'https://api-inference.huggingface.co/models',
      // No API key needed for public models
    },
    replicate: {
      baseUrl: 'https://api.replicate.com/v1',
      // Free tier available
    },
    openAI: {
      // GPT-3.5 turbo for cost-effective processing
      model: 'gpt-3.5-turbo',
      maxTokens: 2000,
    },
    cloudflare: {
      // Workers AI for edge inference
      accountId: process.env.CF_ACCOUNT_ID,
      apiToken: process.env.CF_API_TOKEN,
    },
    cohere: {
      // Free tier for embeddings
      baseUrl: 'https://api.cohere.ai/v1',
    },
  },

  // Model configurations
  models: {
    // Video processing
    video: {
      thumbnail: 'openai/clip-vit-base-patch32',
      classification: 'microsoft/resnet-50',
      analysis: 'facebook/detr-resnet-50',
    },
    // Text processing
    text: {
      moderation: 'unitary/toxic-bert',
      sentiment: 'distilbert-base-uncased-finetuned-sst-2-english',
      embeddings: 'sentence-transformers/all-MiniLM-L6-v2',
    },
    // Recommendation models
    recommendation: {
      collaborative: 'microsoft/lightfm',
      content: 'sentence-transformers/msmarco-MiniLM-L-6-v3',
    },
  },

  // Processing limits
  limits: {
    maxVideoSize: 100 * 1024 * 1024, // 100MB
    maxBatchSize: 50,
    maxConcurrentJobs: 10,
    cacheExpiry: 3600, // 1 hour
  },

  // Edge function configurations
  edge: {
    timeout: 60000, // 60 seconds
    memory: 512, // MB
    region: 'auto',
  },
};

// AI service endpoints
export const AI_ENDPOINTS = {
  video: '/ai-video-processor',
  recommendations: '/ai-recommendations',
  moderation: '/ai-moderation',
  workload: '/ai-workload-manager',
  analytics: '/ai-analytics',
  optimizer: '/ai-optimizer',
};

// Error codes
export const AI_ERRORS = {
  RATE_LIMIT: 'AI_RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'AI_INVALID_INPUT',
  MODEL_ERROR: 'AI_MODEL_ERROR',
  TIMEOUT: 'AI_PROCESSING_TIMEOUT',
  CAPACITY: 'AI_CAPACITY_EXCEEDED',
};