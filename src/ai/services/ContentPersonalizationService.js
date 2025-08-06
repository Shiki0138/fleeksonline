/**
 * AI-Driven Content Personalization Service
 * Uses vector embeddings and semantic search for personalized content
 */

const tf = require('@tensorflow/tfjs-node');
const { pipeline } = require('@xenova/transformers');

class ContentPersonalizationService {
  constructor() {
    this.embedder = null;
    this.vectorIndex = new Map(); // In-memory vector store for demo
    this.contentCache = new Map();
    this.userProfiles = new Map();
    this.initialized = false;
  }

  /**
   * Initialize personalization models
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize CLIP-like embedder for multimodal content
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      // Initialize content categories
      this.initializeContentCategories();
      
      this.initialized = true;
      console.log('Content personalization service initialized');
    } catch (error) {
      console.error('Failed to initialize content personalization:', error);
      throw error;
    }
  }

  /**
   * Generate personalized content feed
   * @param {string} userId - User identifier
   * @param {Object} context - Current context (device, time, location)
   * @returns {Object} Personalized content feed
   */
  async generatePersonalizedFeed(userId, context = {}) {
    await this.initialize();

    // Get or create user profile
    const userProfile = await this.getUserProfile(userId);
    
    // Generate user preference embedding
    const userVector = await this.generateUserEmbedding(userProfile);
    
    // Find similar content using vector search
    const relevantContent = await this.semanticContentSearch(userVector, context);
    
    // Apply collaborative filtering
    const collaborativeItems = await this.getCollaborativeRecommendations(userId);
    
    // Mix content sources with AI
    const personalizedFeed = await this.mixContentSources({
      semantic: relevantContent,
      collaborative: collaborativeItems,
      trending: await this.getTrendingContent(),
      userProfile: userProfile
    });
    
    // Apply real-time personalization
    const finalFeed = await this.applyRealtimePersonalization(
      personalizedFeed,
      context
    );
    
    return {
      items: finalFeed,
      metadata: {
        personalizationScore: this.calculatePersonalizationScore(finalFeed, userProfile),
        diversityScore: this.calculateDiversityScore(finalFeed),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Update user profile based on interactions
   * @param {string} userId - User identifier
   * @param {Object} interaction - User interaction data
   */
  async updateUserProfile(userId, interaction) {
    const profile = await this.getUserProfile(userId);
    
    // Update interaction history
    profile.interactions.push({
      ...interaction,
      timestamp: new Date().toISOString()
    });
    
    // Recalculate preferences using ML
    profile.preferences = await this.recalculatePreferences(profile.interactions);
    
    // Update embeddings
    profile.embedding = await this.generateUserEmbedding(profile);
    
    this.userProfiles.set(userId, profile);
    
    // Trigger async profile optimization
    this.optimizeUserProfile(userId);
  }

  /**
   * Add content to the personalization system
   * @param {Object} content - Content item to add
   */
  async addContent(content) {
    await this.initialize();
    
    // Generate content embedding
    const embedding = await this.generateContentEmbedding(content);
    
    // Extract features
    const features = this.extractContentFeatures(content);
    
    // Store in vector index
    const contentId = content.id || this.generateContentId();
    this.vectorIndex.set(contentId, {
      embedding: embedding,
      features: features,
      content: content,
      metadata: {
        added: new Date().toISOString(),
        popularity: 0,
        qualityScore: await this.assessContentQuality(content)
      }
    });
    
    // Update content cache
    this.updateContentCache(contentId, content);
    
    return contentId;
  }

  /**
   * Generate user embedding from profile
   */
  async generateUserEmbedding(profile) {
    // Create text representation of user preferences
    const preferenceText = this.createPreferenceText(profile);
    
    // Generate embedding
    const output = await this.embedder(preferenceText);
    const embedding = Array.from(output.data);
    
    // Enhance with behavioral features
    const behavioralFeatures = this.extractBehavioralFeatures(profile);
    const enhancedEmbedding = this.combineEmbeddings(embedding, behavioralFeatures);
    
    return enhancedEmbedding;
  }

  /**
   * Generate content embedding
   */
  async generateContentEmbedding(content) {
    // Combine multiple content aspects
    const contentText = [
      content.title,
      content.description,
      content.tags?.join(' '),
      content.category
    ].filter(Boolean).join(' ');
    
    // Generate base embedding
    const output = await this.embedder(contentText);
    const textEmbedding = Array.from(output.data);
    
    // Add visual features if available
    if (content.image) {
      const visualFeatures = await this.extractVisualFeatures(content.image);
      return this.combineEmbeddings(textEmbedding, visualFeatures);
    }
    
    return textEmbedding;
  }

  /**
   * Semantic content search using vector similarity
   */
  async semanticContentSearch(userVector, context, limit = 50) {
    const results = [];
    
    // Calculate similarity scores
    for (const [contentId, item] of this.vectorIndex.entries()) {
      const similarity = this.cosineSimilarity(userVector, item.embedding);
      
      // Apply context boosting
      const contextBoost = this.calculateContextBoost(item.content, context);
      const finalScore = similarity * (1 + contextBoost);
      
      results.push({
        contentId,
        content: item.content,
        score: finalScore,
        similarity: similarity,
        contextBoost: contextBoost
      });
    }
    
    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Mix content from different sources
   */
  async mixContentSources({ semantic, collaborative, trending, userProfile }) {
    const mixed = [];
    const seen = new Set();
    
    // Determine mixing weights based on user profile
    const weights = this.calculateMixingWeights(userProfile);
    
    // Add semantic recommendations
    const semanticCount = Math.floor(weights.semantic * 20);
    for (let i = 0; i < Math.min(semanticCount, semantic.length); i++) {
      if (!seen.has(semantic[i].contentId)) {
        mixed.push({
          ...semantic[i],
          source: 'semantic',
          rank: mixed.length
        });
        seen.add(semantic[i].contentId);
      }
    }
    
    // Add collaborative recommendations
    const collabCount = Math.floor(weights.collaborative * 20);
    for (let i = 0; i < Math.min(collabCount, collaborative.length); i++) {
      if (!seen.has(collaborative[i].contentId)) {
        mixed.push({
          ...collaborative[i],
          source: 'collaborative',
          rank: mixed.length
        });
        seen.add(collaborative[i].contentId);
      }
    }
    
    // Add trending content for diversity
    const trendingCount = Math.floor(weights.trending * 20);
    for (let i = 0; i < Math.min(trendingCount, trending.length); i++) {
      if (!seen.has(trending[i].contentId)) {
        mixed.push({
          ...trending[i],
          source: 'trending',
          rank: mixed.length
        });
        seen.add(trending[i].contentId);
      }
    }
    
    // Apply final ranking algorithm
    return this.applyFinalRanking(mixed, userProfile);
  }

  /**
   * Apply real-time personalization adjustments
   */
  async applyRealtimePersonalization(feed, context) {
    const personalized = [];
    
    for (const item of feed) {
      // Time-based adjustments
      const timeRelevance = this.calculateTimeRelevance(item.content, context.time);
      
      // Location-based adjustments
      const locationRelevance = context.location 
        ? this.calculateLocationRelevance(item.content, context.location)
        : 1.0;
      
      // Device-based adjustments
      const deviceOptimization = this.optimizeForDevice(item.content, context.device);
      
      personalized.push({
        ...item,
        adjustedScore: item.score * timeRelevance * locationRelevance,
        presentation: deviceOptimization
      });
    }
    
    // Re-sort based on adjusted scores
    return personalized.sort((a, b) => b.adjustedScore - a.adjustedScore);
  }

  /**
   * Collaborative filtering recommendations
   */
  async getCollaborativeRecommendations(userId) {
    // Simplified collaborative filtering
    const userInteractions = await this.getUserInteractions(userId);
    const similarUsers = await this.findSimilarUsers(userId);
    
    const recommendations = new Map();
    
    // Aggregate content from similar users
    for (const similarUser of similarUsers) {
      const theirInteractions = await this.getUserInteractions(similarUser.userId);
      
      for (const interaction of theirInteractions) {
        if (!userInteractions.has(interaction.contentId)) {
          const score = recommendations.get(interaction.contentId) || 0;
          recommendations.set(
            interaction.contentId,
            score + (similarUser.similarity * interaction.score)
          );
        }
      }
    }
    
    // Convert to array and sort
    return Array.from(recommendations.entries())
      .map(([contentId, score]) => ({
        contentId,
        content: this.contentCache.get(contentId),
        score,
        source: 'collaborative'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  /**
   * Get trending content
   */
  async getTrendingContent() {
    const trending = [];
    const now = Date.now();
    const trendWindow = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [contentId, item] of this.vectorIndex.entries()) {
      const metadata = item.metadata;
      const age = now - new Date(metadata.added).getTime();
      
      if (age < trendWindow) {
        const trendScore = this.calculateTrendScore(metadata);
        trending.push({
          contentId,
          content: item.content,
          score: trendScore,
          source: 'trending'
        });
      }
    }
    
    return trending
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Helper methods
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  calculateContextBoost(content, context) {
    let boost = 0;
    
    // Time of day boost
    if (context.time) {
      const hour = new Date(context.time).getHours();
      if (content.category === 'evening' && hour >= 17) boost += 0.2;
      if (content.category === 'morning' && hour < 12) boost += 0.2;
    }
    
    // Device type boost
    if (context.device === 'mobile' && content.mobileOptimized) {
      boost += 0.15;
    }
    
    // Location relevance
    if (context.location && content.location) {
      const distance = this.calculateDistance(context.location, content.location);
      if (distance < 5) boost += 0.25; // Within 5km
    }
    
    return boost;
  }

  calculateMixingWeights(userProfile) {
    // Dynamic weight calculation based on user behavior
    const interactionCount = userProfile.interactions.length;
    
    if (interactionCount < 10) {
      // New users: more trending content
      return { semantic: 0.3, collaborative: 0.2, trending: 0.5 };
    } else if (interactionCount < 50) {
      // Growing users: balanced approach
      return { semantic: 0.4, collaborative: 0.3, trending: 0.3 };
    } else {
      // Established users: personalized content
      return { semantic: 0.5, collaborative: 0.35, trending: 0.15 };
    }
  }

  calculatePersonalizationScore(feed, userProfile) {
    // Measure how well the feed matches user preferences
    let score = 0;
    const preferences = new Set(userProfile.preferences.categories);
    
    for (const item of feed) {
      if (preferences.has(item.content.category)) {
        score += 1;
      }
      if (userProfile.preferences.tags.some(tag => 
        item.content.tags?.includes(tag)
      )) {
        score += 0.5;
      }
    }
    
    return score / feed.length;
  }

  calculateDiversityScore(feed) {
    // Measure content diversity
    const categories = new Set();
    const sources = new Set();
    
    for (const item of feed) {
      categories.add(item.content.category);
      sources.add(item.source);
    }
    
    const categoryDiversity = categories.size / feed.length;
    const sourceDiversity = sources.size / 3; // Max 3 sources
    
    return (categoryDiversity + sourceDiversity) / 2;
  }

  /**
   * User profile management
   */
  async getUserProfile(userId) {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        preferences: {
          categories: ['skincare', 'makeup'],
          tags: ['natural', 'organic'],
          priceRange: 'medium'
        },
        interactions: [],
        embedding: null,
        created: new Date().toISOString()
      });
    }
    
    return this.userProfiles.get(userId);
  }

  createPreferenceText(profile) {
    return [
      `User prefers ${profile.preferences.categories.join(', ')}`,
      `Interested in ${profile.preferences.tags.join(', ')}`,
      `Price range: ${profile.preferences.priceRange}`,
      profile.interactions.length > 0 
        ? `Recent: ${profile.interactions.slice(-5).map(i => i.type).join(', ')}`
        : ''
    ].join('. ');
  }

  /**
   * Initialize content categories
   */
  initializeContentCategories() {
    const categories = [
      'skincare', 'makeup', 'haircare', 'nails', 'spa',
      'wellness', 'trending', 'seasonal', 'luxury', 'budget'
    ];
    
    // Pre-generate category embeddings
    categories.forEach(async (category) => {
      const embedding = await this.embedder(`Beauty salon ${category} services`);
      this.contentCache.set(`category_${category}`, {
        embedding: Array.from(embedding.data),
        category
      });
    });
  }

  /**
   * Content quality assessment
   */
  async assessContentQuality(content) {
    let score = 0.5; // Base score
    
    // Text quality
    if (content.description?.length > 100) score += 0.1;
    if (content.title?.length > 10) score += 0.1;
    
    // Media quality
    if (content.image) score += 0.15;
    if (content.video) score += 0.15;
    
    // Metadata completeness
    if (content.tags?.length > 3) score += 0.1;
    if (content.category) score += 0.1;
    if (content.author) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Generate unique content ID
   */
  generateContentId() {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.vectorIndex.clear();
    this.contentCache.clear();
    this.userProfiles.clear();
    this.initialized = false;
  }
}

module.exports = ContentPersonalizationService;