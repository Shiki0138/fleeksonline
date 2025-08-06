import { createAIClient } from '../utils/ai-client';
import { AI_CONFIG } from '../config';

export class EmbeddingService {
  private client = createAIClient('huggingFace');
  private cache = new Map<string, number[]>();

  // Generate embeddings for text
  async generateEmbedding(text: string, model?: string): Promise<number[]> {
    const cacheKey = `${model || 'default'}:${text}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const modelName = model || AI_CONFIG.models.text.embeddings;
      const response = await this.client.call(modelName, {
        method: 'POST',
        body: JSON.stringify({
          inputs: text,
          options: {
            wait_for_model: true,
          },
        }),
      });

      const embedding = Array.isArray(response) ? response : response.embedding;
      
      // Cache result
      this.cache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  // Generate embeddings for multiple texts
  async generateBatchEmbeddings(texts: string[], model?: string): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text, model))
    );
    
    return embeddings;
  }

  // Calculate similarity between two embeddings
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  // Find most similar items
  async findSimilar(
    query: string,
    items: Array<{ id: string; text: string; embedding?: number[] }>,
    topK: number = 10
  ): Promise<Array<{ id: string; text: string; similarity: number }>> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate similarities
    const similarities = await Promise.all(
      items.map(async (item) => {
        const itemEmbedding = item.embedding || await this.generateEmbedding(item.text);
        const similarity = this.cosineSimilarity(queryEmbedding, itemEmbedding);
        
        return {
          id: item.id,
          text: item.text,
          similarity,
        };
      })
    );

    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();