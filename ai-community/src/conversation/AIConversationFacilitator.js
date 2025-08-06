import { Configuration, OpenAIApi } from 'openai';
import natural from 'natural';
import EventEmitter from 'events';

/**
 * AI-Powered Conversation Facilitator
 * Enhances community discussions with intelligent moderation and engagement
 */
export class AIConversationFacilitator extends EventEmitter {
  constructor(config) {
    super();
    this.openai = new OpenAIApi(new Configuration({
      apiKey: config.openaiApiKey
    }));
    
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
    
    this.config = {
      toxicityThreshold: config.toxicityThreshold || 0.7,
      engagementBoostThreshold: config.engagementBoostThreshold || 0.3,
      topicDetectionConfidence: config.topicDetectionConfidence || 0.6,
      ...config
    };
    
    this.conversationContext = new Map();
    this.topicModels = new Map();
  }

  /**
   * Analyze and enhance a conversation message
   */
  async processMessage(message, conversationId, userId) {
    const context = this.getConversationContext(conversationId);
    
    // Parallel analysis
    const [
      sentiment,
      topics,
      toxicity,
      suggestions,
      engagement
    ] = await Promise.all([
      this.analyzeSentiment(message.content),
      this.detectTopics(message.content, context),
      this.checkToxicity(message.content),
      this.generateSuggestions(message, context),
      this.calculateEngagement(conversationId)
    ]);
    
    // Update context
    this.updateContext(conversationId, {
      message,
      sentiment,
      topics,
      userId,
      timestamp: Date.now()
    });
    
    // Emit analysis results
    this.emit('messageAnalyzed', {
      conversationId,
      userId,
      sentiment,
      topics,
      toxicity,
      suggestions,
      engagement
    });
    
    return {
      shouldModerate: toxicity.score > this.config.toxicityThreshold,
      shouldBoost: engagement.needsBoost && sentiment.score > 0,
      suggestions,
      topics,
      sentiment,
      enhancedMessage: await this.enhanceMessage(message, context, suggestions)
    };
  }

  /**
   * Analyze sentiment of the message
   */
  analyzeSentiment(text) {
    const tokens = this.tokenizer.tokenize(text);
    const score = this.sentimentAnalyzer.getSentiment(tokens);
    
    return {
      score,
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(score)
    };
  }

  /**
   * Detect topics using AI
   */
  async detectTopics(text, context) {
    try {
      const response = await this.openai.createCompletion({
        model: "gpt-3.5-turbo",
        prompt: `Analyze this message and extract main topics (max 5):
        
        Message: "${text}"
        Context: ${JSON.stringify(context.recentTopics || [])}
        
        Return JSON array of topics with confidence scores.`,
        temperature: 0.3,
        max_tokens: 100
      });
      
      const topics = JSON.parse(response.data.choices[0].text);
      return topics.filter(t => t.confidence > this.config.topicDetectionConfidence);
    } catch (error) {
      console.error('Topic detection error:', error);
      return this.fallbackTopicDetection(text);
    }
  }

  /**
   * Check for toxic content
   */
  async checkToxicity(text) {
    try {
      const response = await this.openai.createModeration({
        input: text
      });
      
      const results = response.data.results[0];
      return {
        score: Math.max(...Object.values(results.category_scores)),
        categories: Object.entries(results.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category),
        flagged: results.flagged
      };
    } catch (error) {
      console.error('Toxicity check error:', error);
      return { score: 0, categories: [], flagged: false };
    }
  }

  /**
   * Generate conversation suggestions
   */
  async generateSuggestions(message, context) {
    const suggestions = {
      responses: [],
      questions: [],
      resources: [],
      icebreakers: []
    };
    
    // Generate contextual responses
    if (context.sentiment?.score < -0.3) {
      suggestions.responses.push({
        type: 'empathy',
        text: await this.generateEmpathyResponse(message, context)
      });
    }
    
    // Generate engaging questions
    if (context.engagementDropping) {
      suggestions.questions = await this.generateEngagingQuestions(context);
    }
    
    // Suggest relevant resources
    suggestions.resources = await this.findRelevantResources(context.topics);
    
    // Add icebreakers for new conversations
    if (context.messageCount < 5) {
      suggestions.icebreakers = await this.generateIcebreakers(context);
    }
    
    return suggestions;
  }

  /**
   * Calculate conversation engagement metrics
   */
  calculateEngagement(conversationId) {
    const context = this.conversationContext.get(conversationId) || {};
    const messages = context.messages || [];
    
    if (messages.length < 2) {
      return { score: 1, needsBoost: false };
    }
    
    // Calculate various engagement metrics
    const recentMessages = messages.slice(-10);
    const avgTimeBetween = this.calculateAvgTimeBetween(recentMessages);
    const participationRate = this.calculateParticipationRate(recentMessages);
    const sentimentTrend = this.calculateSentimentTrend(recentMessages);
    
    const score = (
      (1 / (avgTimeBetween / 60000 + 1)) * 0.4 + // Time factor
      participationRate * 0.3 +                   // Participation
      (sentimentTrend + 1) / 2 * 0.3            // Sentiment
    );
    
    return {
      score,
      needsBoost: score < this.config.engagementBoostThreshold,
      metrics: {
        avgTimeBetween,
        participationRate,
        sentimentTrend
      }
    };
  }

  /**
   * Enhance message with AI suggestions
   */
  async enhanceMessage(message, context, suggestions) {
    if (!suggestions.responses.length && !suggestions.questions.length) {
      return message;
    }
    
    return {
      ...message,
      enhancements: {
        suggestedResponses: suggestions.responses.slice(0, 3),
        followUpQuestions: suggestions.questions.slice(0, 2),
        relatedTopics: context.topics?.slice(0, 3),
        tone: context.sentiment?.label
      }
    };
  }

  /**
   * Generate empathetic response
   */
  async generateEmpathyResponse(message, context) {
    const prompt = `Generate a brief, empathetic response to this message:
    Message: "${message.content}"
    Sentiment: ${context.sentiment?.label}
    Keep it under 50 words and genuine.`;
    
    try {
      const response = await this.openai.createCompletion({
        model: "gpt-3.5-turbo",
        prompt,
        temperature: 0.7,
        max_tokens: 60
      });
      
      return response.data.choices[0].text.trim();
    } catch (error) {
      return "I understand how you feel. Would you like to talk more about it?";
    }
  }

  /**
   * Generate engaging questions
   */
  async generateEngagingQuestions(context) {
    const topics = context.topics || [];
    const questions = [];
    
    // Topic-based questions
    for (const topic of topics.slice(0, 2)) {
      const question = await this.generateTopicQuestion(topic);
      if (question) questions.push(question);
    }
    
    // Open-ended questions
    questions.push({
      type: 'open',
      text: "What's been the most interesting part of this discussion for you?"
    });
    
    return questions;
  }

  /**
   * Find relevant resources
   */
  async findRelevantResources(topics) {
    const resources = [];
    
    for (const topic of topics || []) {
      // This would connect to your resource database
      const topicResources = await this.searchResources(topic);
      resources.push(...topicResources);
    }
    
    return resources.slice(0, 5);
  }

  /**
   * Generate conversation icebreakers
   */
  async generateIcebreakers(context) {
    const icebreakers = [
      {
        type: 'question',
        text: "What brought you to this community today?"
      },
      {
        type: 'prompt',
        text: "Share something interesting you learned recently!"
      },
      {
        type: 'game',
        text: "Two truths and a lie - who wants to start?"
      }
    ];
    
    // Add context-specific icebreakers
    if (context.topics?.length > 0) {
      const topicIcebreaker = await this.generateTopicIcebreaker(context.topics[0]);
      if (topicIcebreaker) icebreakers.unshift(topicIcebreaker);
    }
    
    return icebreakers;
  }

  /**
   * Update conversation context
   */
  updateContext(conversationId, data) {
    const context = this.conversationContext.get(conversationId) || {
      messages: [],
      participants: new Set(),
      topics: [],
      startTime: Date.now()
    };
    
    context.messages.push(data);
    context.participants.add(data.userId);
    context.lastActivity = Date.now();
    context.sentiment = data.sentiment;
    
    // Update topic history
    if (data.topics?.length > 0) {
      context.recentTopics = [...(context.recentTopics || []), ...data.topics]
        .slice(-20);
    }
    
    this.conversationContext.set(conversationId, context);
  }

  /**
   * Get conversation context
   */
  getConversationContext(conversationId) {
    return this.conversationContext.get(conversationId) || {
      messages: [],
      participants: new Set(),
      topics: []
    };
  }

  /**
   * Helper methods
   */
  calculateAvgTimeBetween(messages) {
    if (messages.length < 2) return 0;
    
    let totalTime = 0;
    for (let i = 1; i < messages.length; i++) {
      totalTime += messages[i].timestamp - messages[i-1].timestamp;
    }
    
    return totalTime / (messages.length - 1);
  }

  calculateParticipationRate(messages) {
    const uniqueUsers = new Set(messages.map(m => m.userId));
    return Math.min(uniqueUsers.size / messages.length, 1);
  }

  calculateSentimentTrend(messages) {
    const sentiments = messages
      .map(m => m.sentiment?.score || 0)
      .filter(s => s !== 0);
    
    if (sentiments.length < 2) return 0;
    
    // Calculate trend
    const firstHalf = sentiments.slice(0, Math.floor(sentiments.length / 2));
    const secondHalf = sentiments.slice(Math.floor(sentiments.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  fallbackTopicDetection(text) {
    // Simple keyword-based topic detection
    const keywords = this.tokenizer.tokenize(text.toLowerCase());
    const topics = [];
    
    // Common topic patterns
    const topicPatterns = {
      'technology': ['ai', 'software', 'code', 'tech', 'computer'],
      'health': ['health', 'fitness', 'wellness', 'medical', 'exercise'],
      'education': ['learn', 'study', 'course', 'tutorial', 'teach'],
      'business': ['business', 'startup', 'company', 'entrepreneur', 'market']
    };
    
    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      const matches = keywords.filter(k => patterns.includes(k)).length;
      if (matches > 0) {
        topics.push({
          name: topic,
          confidence: Math.min(matches / keywords.length, 1)
        });
      }
    }
    
    return topics;
  }

  async generateTopicQuestion(topic) {
    return {
      type: 'topic',
      text: `What's your experience with ${topic.name}?`,
      topic: topic.name
    };
  }

  async generateTopicIcebreaker(topic) {
    return {
      type: 'topic',
      text: `Let's talk about ${topic.name} - who has an interesting story to share?`
    };
  }

  async searchResources(topic) {
    // Placeholder for resource search
    return [{
      type: 'article',
      title: `Understanding ${topic.name}`,
      url: `#resource-${topic.name}`,
      relevance: 0.8
    }];
  }
}