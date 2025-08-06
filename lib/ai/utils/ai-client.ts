import { AI_CONFIG, AI_ERRORS } from '../config';

// AI API client with retry and caching
export class AIClient {
  private cache = new Map<string, { data: any; expires: number }>();
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  constructor(private apiType: keyof typeof AI_CONFIG.apis) {}

  // Generic API call with retry logic
  async call(endpoint: string, options: RequestInit = {}): Promise<any> {
    const cacheKey = `${this.apiType}:${endpoint}:${JSON.stringify(options.body)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Check rate limits
    if (this.isRateLimited(this.apiType)) {
      throw new Error(AI_ERRORS.RATE_LIMIT);
    }

    const config = AI_CONFIG.apis[this.apiType];
    const url = `${config.baseUrl}/${endpoint}`;

    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          this.updateRateLimit(this.apiType);
          throw new Error(AI_ERRORS.RATE_LIMIT);
        }
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful responses
      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + (AI_CONFIG.limits.cacheExpiry * 1000),
      });

      return data;
    } catch (error) {
      console.error(`AI API error (${this.apiType}):`, error);
      throw error;
    }
  }

  // Fetch with exponential backoff retry
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    delay = 1000
  ): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // Get auth headers based on API type
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.apiType) {
      case 'huggingFace':
        if (process.env.HUGGINGFACE_API_KEY) {
          headers['Authorization'] = `Bearer ${process.env.HUGGINGFACE_API_KEY}`;
        }
        break;
      case 'replicate':
        if (process.env.REPLICATE_API_TOKEN) {
          headers['Authorization'] = `Token ${process.env.REPLICATE_API_TOKEN}`;
        }
        break;
      case 'cohere':
        if (process.env.COHERE_API_KEY) {
          headers['Authorization'] = `Bearer ${process.env.COHERE_API_KEY}`;
        }
        break;
      case 'cloudflare':
        if (AI_CONFIG.apis.cloudflare.apiToken) {
          headers['Authorization'] = `Bearer ${AI_CONFIG.apis.cloudflare.apiToken}`;
        }
        break;
    }

    return headers;
  }

  // Rate limiting
  private isRateLimited(apiType: string): boolean {
    const limit = this.rateLimits.get(apiType);
    if (!limit) return false;
    
    if (Date.now() > limit.resetTime) {
      this.rateLimits.delete(apiType);
      return false;
    }
    
    return limit.count >= 10; // Max 10 requests per minute
  }

  private updateRateLimit(apiType: string): void {
    const limit = this.rateLimits.get(apiType) || { count: 0, resetTime: Date.now() + 60000 };
    limit.count++;
    this.rateLimits.set(apiType, limit);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Factory for creating AI clients
export function createAIClient(apiType: keyof typeof AI_CONFIG.apis): AIClient {
  return new AIClient(apiType);
}