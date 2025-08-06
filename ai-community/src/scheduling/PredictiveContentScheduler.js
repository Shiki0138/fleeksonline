import schedule from 'node-schedule';
import Brain from 'brain.js';
import EventEmitter from 'events';

/**
 * AI-Powered Predictive Content Scheduler
 * Optimizes content timing for maximum community engagement
 */
export class PredictiveContentScheduler extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      analysisWindow: config.analysisWindow || 30 * 24 * 60 * 60 * 1000, // 30 days
      predictionHorizon: config.predictionHorizon || 7 * 24 * 60 * 60 * 1000, // 7 days
      minDataPoints: config.minDataPoints || 100,
      optimizationInterval: config.optimizationInterval || 60 * 60 * 1000, // 1 hour
      ...config
    };
    
    // Neural networks for predictions
    this.engagementPredictor = new Brain.NeuralNetwork({
      hiddenLayers: [20, 15, 10],
      activation: 'sigmoid'
    });
    
    this.viralityPredictor = new Brain.recurrent.LSTM({
      hiddenLayers: [20],
      activation: 'sigmoid'
    });
    
    // Data storage
    this.contentHistory = new Map();
    this.engagementData = new Map();
    this.userActivityPatterns = new Map();
    this.scheduledContent = new Map();
    this.performanceMetrics = new Map();
    
    // Scheduling queues
    this.contentQueue = [];
    this.priorityQueue = [];
    
    // Active jobs
    this.scheduledJobs = new Map();
    
    // Analytics
    this.analytics = {
      totalScheduled: 0,
      totalPublished: 0,
      averageEngagement: 0,
      bestPerformingTimes: new Map(),
      contentTypePerformance: new Map()
    };
  }

  /**
   * Schedule content with AI optimization
   */
  async scheduleContent(content, options = {}) {
    // Analyze content
    const contentAnalysis = await this.analyzeContent(content);
    
    // Predict optimal timing
    const optimalTiming = await this.predictOptimalTiming(
      contentAnalysis,
      options
    );
    
    // Calculate priority score
    const priorityScore = await this.calculatePriority(
      content,
      contentAnalysis,
      optimalTiming
    );
    
    // Create scheduled item
    const scheduledItem = {
      id: this.generateContentId(),
      content,
      analysis: contentAnalysis,
      timing: optimalTiming,
      priority: priorityScore,
      options,
      status: 'scheduled',
      createdAt: Date.now(),
      scheduledFor: optimalTiming.recommendedTime,
      predictions: {
        engagement: optimalTiming.predictedEngagement,
        reach: optimalTiming.predictedReach,
        virality: optimalTiming.viralityScore
      }
    };
    
    // Add to appropriate queue
    if (options.priority === 'high' || priorityScore > 0.8) {
      this.priorityQueue.push(scheduledItem);
      this.priorityQueue.sort((a, b) => b.priority - a.priority);
    } else {
      this.contentQueue.push(scheduledItem);
      this.contentQueue.sort((a, b) => a.scheduledFor - b.scheduledFor);
    }
    
    // Schedule the job
    this.scheduleJob(scheduledItem);
    
    // Store scheduled content
    this.scheduledContent.set(scheduledItem.id, scheduledItem);
    
    // Update analytics
    this.analytics.totalScheduled++;
    
    // Emit event
    this.emit('contentScheduled', scheduledItem);
    
    return scheduledItem;
  }

  /**
   * Predict optimal timing for content
   */
  async predictOptimalTiming(contentAnalysis, options = {}) {
    const constraints = {
      earliest: options.earliest || Date.now() + 60000, // 1 minute from now
      latest: options.latest || Date.now() + this.config.predictionHorizon,
      blackoutPeriods: options.blackoutPeriods || [],
      targetTimezones: options.targetTimezones || ['UTC']
    };
    
    // Get candidate time slots
    const candidateSlots = this.generateCandidateSlots(constraints);
    
    // Score each slot
    const scoredSlots = await Promise.all(
      candidateSlots.map(async slot => {
        const score = await this.scoreTimeSlot(slot, contentAnalysis, constraints);
        return { slot, score };
      })
    );
    
    // Sort by score
    scoredSlots.sort((a, b) => b.score.total - a.score.total);
    
    // Get top slot
    const optimalSlot = scoredSlots[0];
    
    // Generate timing recommendation
    return {
      recommendedTime: optimalSlot.slot.time,
      alternativeTimes: scoredSlots.slice(1, 4).map(s => s.slot.time),
      predictedEngagement: optimalSlot.score.engagement,
      predictedReach: optimalSlot.score.reach,
      viralityScore: optimalSlot.score.virality,
      confidence: optimalSlot.score.confidence,
      reasoning: this.generateTimingReasoning(optimalSlot, contentAnalysis)
    };
  }

  /**
   * Analyze content for scheduling optimization
   */
  async analyzeContent(content) {
    const analysis = {
      type: content.type || this.detectContentType(content),
      topics: await this.extractTopics(content),
      sentiment: await this.analyzeSentiment(content),
      length: this.calculateContentLength(content),
      complexity: this.assessComplexity(content),
      mediaTypes: this.identifyMediaTypes(content),
      targetAudience: await this.identifyTargetAudience(content),
      seasonality: this.checkSeasonality(content),
      urgency: this.assessUrgency(content),
      evergreen: this.isEvergreen(content)
    };
    
    // Add engagement predictions based on content features
    analysis.engagementPotential = await this.predictEngagementPotential(analysis);
    
    return analysis;
  }

  /**
   * Score a time slot for content posting
   */
  async scoreTimeSlot(slot, contentAnalysis, constraints) {
    const scores = {
      historicalEngagement: 0,
      audienceActivity: 0,
      competition: 0,
      virality: 0,
      contextual: 0
    };
    
    // Historical engagement at this time
    scores.historicalEngagement = await this.getHistoricalEngagementScore(
      slot,
      contentAnalysis.type
    );
    
    // Audience activity prediction
    scores.audienceActivity = await this.predictAudienceActivity(
      slot,
      constraints.targetTimezones
    );
    
    // Competition analysis (other content scheduled)
    scores.competition = await this.analyzeCompetition(slot);
    
    // Virality potential
    scores.virality = await this.predictViralityPotential(
      slot,
      contentAnalysis
    );
    
    // Contextual factors (day of week, holidays, events)
    scores.contextual = this.getContextualScore(slot, contentAnalysis);
    
    // Calculate weighted total
    const weights = {
      historicalEngagement: 0.3,
      audienceActivity: 0.25,
      competition: 0.15,
      virality: 0.2,
      contextual: 0.1
    };
    
    const total = Object.entries(scores).reduce(
      (sum, [key, value]) => sum + value * weights[key],
      0
    );
    
    return {
      ...scores,
      total,
      engagement: scores.historicalEngagement * scores.audienceActivity,
      reach: scores.audienceActivity * (1 - scores.competition),
      confidence: this.calculateConfidence(scores)
    };
  }

  /**
   * Auto-optimize scheduled content
   */
  async optimizeSchedule() {
    const now = Date.now();
    const optimizationWindow = now + this.config.predictionHorizon;
    
    // Get content that can be optimized
    const optimizableContent = Array.from(this.scheduledContent.values())
      .filter(item => 
        item.status === 'scheduled' &&
        item.scheduledFor > now &&
        item.scheduledFor < optimizationWindow &&
        !item.options.fixed
      );
    
    // Re-evaluate each content item
    for (const item of optimizableContent) {
      const newTiming = await this.predictOptimalTiming(
        item.analysis,
        item.options
      );
      
      // Check if rescheduling would improve performance
      const improvementThreshold = 0.15; // 15% improvement required
      if (newTiming.predictedEngagement > item.predictions.engagement * (1 + improvementThreshold)) {
        await this.rescheduleContent(item.id, newTiming.recommendedTime);
        
        this.emit('contentOptimized', {
          contentId: item.id,
          oldTime: item.scheduledFor,
          newTime: newTiming.recommendedTime,
          improvement: {
            engagement: newTiming.predictedEngagement - item.predictions.engagement,
            reach: newTiming.predictedReach - item.predictions.reach
          }
        });
      }
    }
  }

  /**
   * Learn from published content performance
   */
  async learnFromPerformance(contentId, performanceData) {
    const scheduledItem = this.scheduledContent.get(contentId);
    if (!scheduledItem) return;
    
    // Store performance data
    this.performanceMetrics.set(contentId, {
      ...performanceData,
      scheduledTime: scheduledItem.scheduledFor,
      contentType: scheduledItem.analysis.type,
      dayOfWeek: new Date(scheduledItem.scheduledFor).getDay(),
      hourOfDay: new Date(scheduledItem.scheduledFor).getHours()
    });
    
    // Update historical data
    this.updateHistoricalData(scheduledItem, performanceData);
    
    // Retrain models if enough data
    if (this.performanceMetrics.size % 50 === 0) {
      await this.retrainPredictionModels();
    }
    
    // Update best performing times
    this.updateBestPerformingTimes(scheduledItem, performanceData);
    
    // Emit learning event
    this.emit('performanceLearned', {
      contentId,
      predictions: scheduledItem.predictions,
      actual: performanceData,
      accuracy: this.calculatePredictionAccuracy(scheduledItem.predictions, performanceData)
    });
  }

  /**
   * Get content calendar
   */
  async getContentCalendar(startDate, endDate, filters = {}) {
    const calendar = new Map();
    
    // Initialize calendar days
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      calendar.set(dateKey, {
        date: new Date(current),
        scheduled: [],
        predictions: {
          totalEngagement: 0,
          totalReach: 0,
          optimalSlots: []
        }
      });
      current.setDate(current.getDate() + 1);
    }
    
    // Add scheduled content
    for (const item of this.scheduledContent.values()) {
      if (item.scheduledFor >= startDate && item.scheduledFor <= endDate) {
        if (this.matchesFilters(item, filters)) {
          const dateKey = new Date(item.scheduledFor).toISOString().split('T')[0];
          const dayEntry = calendar.get(dateKey);
          if (dayEntry) {
            dayEntry.scheduled.push(item);
            dayEntry.predictions.totalEngagement += item.predictions.engagement;
            dayEntry.predictions.totalReach += item.predictions.reach;
          }
        }
      }
    }
    
    // Add optimal slots for each day
    for (const [dateKey, dayEntry] of calendar) {
      dayEntry.predictions.optimalSlots = await this.getOptimalSlotsForDay(
        dayEntry.date
      );
    }
    
    return Array.from(calendar.values());
  }

  /**
   * Batch schedule multiple content items
   */
  async batchSchedule(contentItems, options = {}) {
    const scheduled = [];
    
    // Sort by priority if specified
    if (options.priorityOrder) {
      contentItems.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
    
    // Schedule each item with spacing constraints
    let lastScheduledTime = Date.now();
    const minSpacing = options.minSpacing || 60 * 60 * 1000; // 1 hour default
    
    for (const content of contentItems) {
      const itemOptions = {
        ...options,
        earliest: lastScheduledTime + minSpacing
      };
      
      const scheduledItem = await this.scheduleContent(content, itemOptions);
      scheduled.push(scheduledItem);
      
      lastScheduledTime = scheduledItem.scheduledFor;
    }
    
    // Optimize the batch as a whole
    if (options.optimizeBatch) {
      await this.optimizeBatch(scheduled);
    }
    
    return scheduled;
  }

  /**
   * Get scheduling recommendations
   */
  async getSchedulingRecommendations(timeframe = 'week') {
    const recommendations = {
      bestTimes: [],
      contentGaps: [],
      saturatedPeriods: [],
      contentMix: {},
      predictions: {}
    };
    
    // Analyze current schedule
    const scheduleAnalysis = await this.analyzeCurrentSchedule(timeframe);
    
    // Best times for each content type
    for (const contentType of this.getContentTypes()) {
      const bestTimes = await this.findBestTimesForType(contentType, timeframe);
      recommendations.bestTimes.push({
        contentType,
        times: bestTimes
      });
    }
    
    // Identify content gaps
    recommendations.contentGaps = this.identifyContentGaps(scheduleAnalysis);
    
    // Identify oversaturated periods
    recommendations.saturatedPeriods = this.identifySaturatedPeriods(scheduleAnalysis);
    
    // Recommend content mix
    recommendations.contentMix = await this.recommendContentMix(timeframe);
    
    // Performance predictions
    recommendations.predictions = await this.predictSchedulePerformance(
      scheduleAnalysis
    );
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  generateCandidateSlots(constraints) {
    const slots = [];
    const slotDuration = 30 * 60 * 1000; // 30 minute slots
    
    let current = constraints.earliest;
    while (current <= constraints.latest) {
      // Skip blackout periods
      if (!this.isInBlackoutPeriod(current, constraints.blackoutPeriods)) {
        slots.push({
          time: current,
          dayOfWeek: new Date(current).getDay(),
          hourOfDay: new Date(current).getHours(),
          date: new Date(current)
        });
      }
      current += slotDuration;
    }
    
    return slots;
  }

  detectContentType(content) {
    if (content.video) return 'video';
    if (content.images && content.images.length > 1) return 'gallery';
    if (content.images && content.images.length === 1) return 'image';
    if (content.poll) return 'poll';
    if (content.event) return 'event';
    return 'text';
  }

  async extractTopics(content) {
    // Simplified topic extraction
    const text = content.text || content.title || '';
    const topics = [];
    
    // Common topic patterns
    const topicPatterns = {
      announcement: /announce|launch|release|introducing/i,
      tutorial: /how to|guide|tutorial|learn/i,
      community: /community|together|join us|participate/i,
      promotion: /sale|discount|offer|limited time/i
    };
    
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(text)) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  async analyzeSentiment(content) {
    // Simplified sentiment analysis
    const text = content.text || content.title || '';
    const positiveWords = ['amazing', 'great', 'awesome', 'love', 'excellent'];
    const negativeWords = ['problem', 'issue', 'sorry', 'apologize', 'mistake'];
    
    let score = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (positiveWords.includes(word)) score++;
      if (negativeWords.includes(word)) score--;
    }
    
    return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
  }

  calculateContentLength(content) {
    const text = content.text || '';
    const wordCount = text.split(/\s+/).length;
    
    if (wordCount < 50) return 'short';
    if (wordCount < 200) return 'medium';
    return 'long';
  }

  assessComplexity(content) {
    // Assess based on various factors
    let complexity = 0;
    
    if (content.technical) complexity += 2;
    if (content.requiresAction) complexity += 1;
    if (content.multipart) complexity += 2;
    
    return complexity > 3 ? 'high' : complexity > 1 ? 'medium' : 'low';
  }

  identifyMediaTypes(content) {
    const types = [];
    if (content.text) types.push('text');
    if (content.images) types.push('image');
    if (content.video) types.push('video');
    if (content.audio) types.push('audio');
    if (content.poll) types.push('interactive');
    return types;
  }

  async identifyTargetAudience(content) {
    // Simplified audience identification
    const audiences = [];
    
    if (content.tags) {
      if (content.tags.includes('beginner')) audiences.push('beginners');
      if (content.tags.includes('advanced')) audiences.push('experts');
      if (content.tags.includes('business')) audiences.push('professionals');
    }
    
    return audiences.length > 0 ? audiences : ['general'];
  }

  checkSeasonality(content) {
    const text = (content.text || content.title || '').toLowerCase();
    const seasonalTerms = {
      holiday: ['christmas', 'thanksgiving', 'halloween', 'easter'],
      summer: ['summer', 'vacation', 'beach', 'sunny'],
      winter: ['winter', 'snow', 'cold', 'holiday'],
      event: ['sale', 'blackfriday', 'cybermonday']
    };
    
    for (const [season, terms] of Object.entries(seasonalTerms)) {
      if (terms.some(term => text.includes(term))) {
        return season;
      }
    }
    
    return null;
  }

  assessUrgency(content) {
    if (content.urgent) return 'high';
    if (content.deadline) {
      const hoursUntilDeadline = (content.deadline - Date.now()) / (60 * 60 * 1000);
      if (hoursUntilDeadline < 24) return 'high';
      if (hoursUntilDeadline < 72) return 'medium';
    }
    return 'low';
  }

  isEvergreen(content) {
    return !content.deadline && 
           !content.event && 
           !this.checkSeasonality(content) &&
           content.evergreen !== false;
  }

  async predictEngagementPotential(analysis) {
    // Use historical data to predict
    const features = [
      analysis.type === 'video' ? 1 : 0,
      analysis.type === 'image' ? 0.8 : 0,
      analysis.sentiment === 'positive' ? 1 : 0,
      analysis.complexity === 'low' ? 0.8 : 0.5,
      analysis.mediaTypes.length / 3,
      analysis.evergreen ? 0.7 : 0.5
    ];
    
    if (this.engagementPredictor.trained) {
      const prediction = this.engagementPredictor.run(features);
      return prediction[0];
    }
    
    // Fallback calculation
    return features.reduce((a, b) => a + b) / features.length;
  }

  async getHistoricalEngagementScore(slot, contentType) {
    const key = `${slot.dayOfWeek}-${slot.hourOfDay}-${contentType}`;
    const historical = this.analytics.bestPerformingTimes.get(key);
    
    if (historical && historical.dataPoints > this.config.minDataPoints) {
      return historical.averageEngagement;
    }
    
    // Default scores based on general patterns
    const defaults = {
      morning: { start: 6, end: 10, score: 0.6 },
      lunch: { start: 11, end: 13, score: 0.7 },
      evening: { start: 17, end: 20, score: 0.9 },
      night: { start: 20, end: 22, score: 0.7 }
    };
    
    for (const period of Object.values(defaults)) {
      if (slot.hourOfDay >= period.start && slot.hourOfDay < period.end) {
        return period.score;
      }
    }
    
    return 0.4; // Default low score
  }

  async predictAudienceActivity(slot, targetTimezones) {
    // Aggregate activity predictions across timezones
    let totalActivity = 0;
    
    for (const timezone of targetTimezones) {
      const localHour = this.convertToTimezone(slot.time, timezone).getHours();
      const activity = this.getTimezoneActivity(localHour, slot.dayOfWeek);
      totalActivity += activity;
    }
    
    return totalActivity / targetTimezones.length;
  }

  async analyzeCompetition(slot) {
    // Check how many other items are scheduled near this time
    const window = 2 * 60 * 60 * 1000; // 2 hour window
    const competing = Array.from(this.scheduledContent.values()).filter(item =>
      Math.abs(item.scheduledFor - slot.time) < window &&
      item.status === 'scheduled'
    ).length;
    
    // More competition = lower score
    return Math.max(0, 1 - (competing * 0.2));
  }

  async predictViralityPotential(slot, contentAnalysis) {
    // Time-based virality factors
    const dayFactors = {
      0: 0.6, // Sunday
      1: 0.7, // Monday
      2: 0.8, // Tuesday
      3: 0.8, // Wednesday
      4: 0.9, // Thursday
      5: 0.9, // Friday
      6: 0.7  // Saturday
    };
    
    const timeFactor = dayFactors[slot.dayOfWeek] || 0.7;
    const contentFactor = contentAnalysis.engagementPotential;
    
    // Use LSTM for sequence prediction if trained
    if (this.viralityPredictor.trained) {
      try {
        const prediction = this.viralityPredictor.run([
          timeFactor,
          contentFactor,
          slot.hourOfDay / 24
        ]);
        return prediction;
      } catch (error) {
        console.error('Virality prediction error:', error);
      }
    }
    
    return timeFactor * contentFactor;
  }

  getContextualScore(slot, contentAnalysis) {
    let score = 0.5;
    
    // Day of week adjustments
    const isWeekend = slot.dayOfWeek === 0 || slot.dayOfWeek === 6;
    if (isWeekend && contentAnalysis.type === 'entertainment') {
      score += 0.2;
    }
    
    // Time of day adjustments
    const isMorning = slot.hourOfDay >= 6 && slot.hourOfDay < 10;
    if (isMorning && contentAnalysis.topics.includes('announcement')) {
      score += 0.2;
    }
    
    // Seasonal adjustments
    if (contentAnalysis.seasonality) {
      const currentSeason = this.getCurrentSeason();
      if (contentAnalysis.seasonality === currentSeason) {
        score += 0.3;
      }
    }
    
    return Math.min(score, 1);
  }

  calculateConfidence(scores) {
    // Calculate confidence based on score consistency
    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    
    // Lower variance = higher confidence
    return Math.max(0, 1 - Math.sqrt(variance));
  }

  generateTimingReasoning(optimalSlot, contentAnalysis) {
    const reasons = [];
    
    if (optimalSlot.score.historicalEngagement > 0.7) {
      reasons.push('High historical engagement at this time');
    }
    
    if (optimalSlot.score.audienceActivity > 0.8) {
      reasons.push('Peak audience activity expected');
    }
    
    if (optimalSlot.score.competition < 0.3) {
      reasons.push('Low competition from other content');
    }
    
    if (optimalSlot.score.virality > 0.7) {
      reasons.push('High viral potential for this timing');
    }
    
    return reasons;
  }

  calculatePriority(content, analysis, timing) {
    let priority = 0.5;
    
    // Urgency factor
    if (analysis.urgency === 'high') priority += 0.3;
    else if (analysis.urgency === 'medium') priority += 0.1;
    
    // Engagement potential
    priority += analysis.engagementPotential * 0.2;
    
    // Timing confidence
    priority += timing.confidence * 0.1;
    
    // Content importance
    if (content.important) priority += 0.2;
    
    return Math.min(priority, 1);
  }

  generateContentId() {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  scheduleJob(item) {
    // Cancel existing job if any
    this.cancelJob(item.id);
    
    // Schedule new job
    const job = schedule.scheduleJob(new Date(item.scheduledFor), () => {
      this.publishContent(item);
    });
    
    this.scheduledJobs.set(item.id, job);
  }

  cancelJob(contentId) {
    const job = this.scheduledJobs.get(contentId);
    if (job) {
      job.cancel();
      this.scheduledJobs.delete(contentId);
    }
  }

  async publishContent(item) {
    try {
      // Update status
      item.status = 'publishing';
      
      // Emit publish event
      this.emit('contentPublishing', item);
      
      // Mark as published
      item.status = 'published';
      item.publishedAt = Date.now();
      
      // Update analytics
      this.analytics.totalPublished++;
      
      // Start tracking performance
      this.startPerformanceTracking(item.id);
      
      this.emit('contentPublished', item);
    } catch (error) {
      item.status = 'failed';
      item.error = error.message;
      this.emit('contentFailed', item);
    }
  }

  startPerformanceTracking(contentId) {
    // Set up periodic performance checks
    const intervals = [
      5 * 60 * 1000,     // 5 minutes
      30 * 60 * 1000,    // 30 minutes
      2 * 60 * 60 * 1000, // 2 hours
      24 * 60 * 60 * 1000 // 24 hours
    ];
    
    intervals.forEach((interval, index) => {
      setTimeout(() => {
        this.emit('trackPerformance', {
          contentId,
          checkPoint: index + 1,
          time: interval
        });
      }, interval);
    });
  }

  async rescheduleContent(contentId, newTime) {
    const item = this.scheduledContent.get(contentId);
    if (!item || item.status !== 'scheduled') return;
    
    // Update scheduled time
    const oldTime = item.scheduledFor;
    item.scheduledFor = newTime;
    
    // Reschedule job
    this.scheduleJob(item);
    
    // Update queues
    this.updateQueues();
    
    this.emit('contentRescheduled', {
      contentId,
      oldTime,
      newTime
    });
  }

  updateQueues() {
    // Re-sort queues
    this.contentQueue.sort((a, b) => a.scheduledFor - b.scheduledFor);
    this.priorityQueue.sort((a, b) => b.priority - a.priority);
  }

  updateHistoricalData(item, performance) {
    const key = `${new Date(item.scheduledFor).getDay()}-${new Date(item.scheduledFor).getHours()}-${item.analysis.type}`;
    
    const historical = this.analytics.bestPerformingTimes.get(key) || {
      totalEngagement: 0,
      dataPoints: 0,
      averageEngagement: 0
    };
    
    historical.totalEngagement += performance.engagement;
    historical.dataPoints++;
    historical.averageEngagement = historical.totalEngagement / historical.dataPoints;
    
    this.analytics.bestPerformingTimes.set(key, historical);
  }

  async retrainPredictionModels() {
    // Prepare training data
    const trainingData = [];
    
    for (const [contentId, metrics] of this.performanceMetrics) {
      const item = this.scheduledContent.get(contentId);
      if (!item) continue;
      
      const input = [
        item.analysis.type === 'video' ? 1 : 0,
        item.analysis.sentiment === 'positive' ? 1 : 0,
        metrics.dayOfWeek / 7,
        metrics.hourOfDay / 24,
        item.analysis.engagementPotential
      ];
      
      const output = [metrics.engagement / 1000]; // Normalize
      
      trainingData.push({ input, output });
    }
    
    if (trainingData.length > this.config.minDataPoints) {
      // Train engagement predictor
      this.engagementPredictor.train(trainingData, {
        iterations: 2000,
        errorThresh: 0.005
      });
      
      console.log('Retrained engagement predictor with', trainingData.length, 'samples');
    }
  }

  updateBestPerformingTimes(item, performance) {
    const type = item.analysis.type;
    const time = new Date(item.scheduledFor);
    const key = `${type}-${time.getDay()}-${time.getHours()}`;
    
    const current = this.analytics.contentTypePerformance.get(key) || {
      count: 0,
      totalEngagement: 0,
      avgEngagement: 0
    };
    
    current.count++;
    current.totalEngagement += performance.engagement;
    current.avgEngagement = current.totalEngagement / current.count;
    
    this.analytics.contentTypePerformance.set(key, current);
  }

  calculatePredictionAccuracy(predictions, actual) {
    const engagementAccuracy = 1 - Math.abs(predictions.engagement - actual.engagement) / actual.engagement;
    const reachAccuracy = 1 - Math.abs(predictions.reach - actual.reach) / actual.reach;
    
    return {
      engagement: Math.max(0, engagementAccuracy),
      reach: Math.max(0, reachAccuracy),
      overall: Math.max(0, (engagementAccuracy + reachAccuracy) / 2)
    };
  }

  matchesFilters(item, filters) {
    if (filters.type && item.analysis.type !== filters.type) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.priority && item.priority < filters.priority) return false;
    return true;
  }

  async getOptimalSlotsForDay(date) {
    const slots = [];
    const hours = [9, 12, 15, 18, 20]; // Common posting times
    
    for (const hour of hours) {
      const time = new Date(date);
      time.setHours(hour, 0, 0, 0);
      
      const score = await this.scoreTimeSlot(
        { time: time.getTime(), dayOfWeek: time.getDay(), hourOfDay: hour },
        { type: 'general' },
        {}
      );
      
      slots.push({
        time: time.getTime(),
        score: score.total,
        label: `${hour}:00`
      });
    }
    
    return slots.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  isInBlackoutPeriod(time, blackoutPeriods) {
    for (const period of blackoutPeriods) {
      if (time >= period.start && time <= period.end) {
        return true;
      }
    }
    return false;
  }

  convertToTimezone(time, timezone) {
    // Simplified timezone conversion
    return new Date(time);
  }

  getTimezoneActivity(hour, dayOfWeek) {
    // Activity patterns by hour
    const patterns = {
      0: 0.1, 1: 0.05, 2: 0.05, 3: 0.05, 4: 0.05, 5: 0.1,
      6: 0.3, 7: 0.5, 8: 0.7, 9: 0.8, 10: 0.7, 11: 0.7,
      12: 0.8, 13: 0.7, 14: 0.6, 15: 0.6, 16: 0.7, 17: 0.8,
      18: 0.9, 19: 0.9, 20: 0.8, 21: 0.7, 22: 0.5, 23: 0.3
    };
    
    // Weekend adjustment
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.9 : 1;
    
    return (patterns[hour] || 0.5) * weekendMultiplier;
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  getContentTypes() {
    return ['video', 'image', 'text', 'poll', 'event', 'gallery'];
  }

  async analyzeCurrentSchedule(timeframe) {
    const now = Date.now();
    const endTime = timeframe === 'week' 
      ? now + 7 * 24 * 60 * 60 * 1000
      : now + 30 * 24 * 60 * 60 * 1000;
    
    const scheduled = Array.from(this.scheduledContent.values())
      .filter(item => 
        item.status === 'scheduled' &&
        item.scheduledFor >= now &&
        item.scheduledFor <= endTime
      );
    
    // Group by day and hour
    const distribution = new Map();
    
    for (const item of scheduled) {
      const date = new Date(item.scheduledFor);
      const key = `${date.toISOString().split('T')[0]}-${date.getHours()}`;
      
      const existing = distribution.get(key) || [];
      existing.push(item);
      distribution.set(key, existing);
    }
    
    return {
      total: scheduled.length,
      distribution,
      byType: this.groupByType(scheduled),
      byPriority: this.groupByPriority(scheduled)
    };
  }

  identifyContentGaps(analysis) {
    const gaps = [];
    const idealPostsPerDay = 3;
    const hoursBetwenPosts = 6;
    
    // Check each day
    for (const [key, items] of analysis.distribution) {
      const [date, hour] = key.split('-');
      
      if (items.length === 0) {
        gaps.push({
          date,
          hour: parseInt(hour),
          severity: 'high',
          suggestion: 'No content scheduled'
        });
      }
    }
    
    return gaps;
  }

  identifySaturatedPeriods(analysis) {
    const saturated = [];
    const maxPostsPerHour = 2;
    
    for (const [key, items] of analysis.distribution) {
      if (items.length > maxPostsPerHour) {
        const [date, hour] = key.split('-');
        saturated.push({
          date,
          hour: parseInt(hour),
          count: items.length,
          suggestion: `Consider spreading content (${items.length} posts in one hour)`
        });
      }
    }
    
    return saturated;
  }

  async recommendContentMix(timeframe) {
    // Ideal content mix percentages
    const idealMix = {
      video: 0.3,
      image: 0.4,
      text: 0.15,
      poll: 0.1,
      event: 0.05
    };
    
    const currentMix = {};
    const scheduled = Array.from(this.scheduledContent.values());
    
    // Calculate current mix
    for (const type of this.getContentTypes()) {
      const count = scheduled.filter(item => item.analysis.type === type).length;
      currentMix[type] = scheduled.length > 0 ? count / scheduled.length : 0;
    }
    
    // Generate recommendations
    const recommendations = {};
    for (const [type, ideal] of Object.entries(idealMix)) {
      const current = currentMix[type] || 0;
      const difference = ideal - current;
      
      if (Math.abs(difference) > 0.1) {
        recommendations[type] = {
          current: Math.round(current * 100),
          ideal: Math.round(ideal * 100),
          action: difference > 0 ? 'increase' : 'decrease',
          priority: Math.abs(difference) > 0.2 ? 'high' : 'medium'
        };
      }
    }
    
    return recommendations;
  }

  async predictSchedulePerformance(analysis) {
    let totalPredictedEngagement = 0;
    let totalPredictedReach = 0;
    
    for (const items of analysis.distribution.values()) {
      for (const item of items) {
        totalPredictedEngagement += item.predictions.engagement;
        totalPredictedReach += item.predictions.reach;
      }
    }
    
    return {
      expectedEngagement: totalPredictedEngagement,
      expectedReach: totalPredictedReach,
      postsPerDay: analysis.total / 7,
      engagementPerPost: analysis.total > 0 ? totalPredictedEngagement / analysis.total : 0
    };
  }

  async findBestTimesForType(contentType, timeframe) {
    const times = [];
    const historical = Array.from(this.analytics.contentTypePerformance.entries())
      .filter(([key]) => key.startsWith(contentType))
      .sort(([, a], [, b]) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);
    
    for (const [key, data] of historical) {
      const [, dayOfWeek, hour] = key.split('-');
      times.push({
        dayOfWeek: parseInt(dayOfWeek),
        hour: parseInt(hour),
        avgEngagement: data.avgEngagement,
        confidence: Math.min(data.count / 10, 1)
      });
    }
    
    return times;
  }

  async optimizeBatch(scheduledItems) {
    // Optimize spacing and timing for the batch
    const sorted = scheduledItems.sort((a, b) => a.priority - b.priority);
    
    // Ensure minimum spacing
    for (let i = 1; i < sorted.length; i++) {
      const prevTime = sorted[i - 1].scheduledFor;
      const currentTime = sorted[i].scheduledFor;
      const minSpacing = 60 * 60 * 1000; // 1 hour
      
      if (currentTime - prevTime < minSpacing) {
        await this.rescheduleContent(sorted[i].id, prevTime + minSpacing);
      }
    }
  }

  groupByType(items) {
    const groups = {};
    for (const item of items) {
      const type = item.analysis.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    }
    return groups;
  }

  groupByPriority(items) {
    const groups = {
      high: [],
      medium: [],
      low: []
    };
    
    for (const item of items) {
      if (item.priority > 0.7) groups.high.push(item);
      else if (item.priority > 0.4) groups.medium.push(item);
      else groups.low.push(item);
    }
    
    return groups;
  }

  /**
   * Start auto-optimization
   */
  startAutoOptimization() {
    if (this.optimizationInterval) return;
    
    this.optimizationInterval = setInterval(() => {
      this.optimizeSchedule();
    }, this.config.optimizationInterval);
  }

  /**
   * Stop auto-optimization
   */
  stopAutoOptimization() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
  }
}