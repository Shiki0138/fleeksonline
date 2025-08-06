import natural from 'natural';
import Brain from 'brain.js';
import EventEmitter from 'events';

/**
 * AI-Powered Community Health Analyzer
 * Monitors and predicts community sentiment and health metrics
 */
export class CommunityHealthAnalyzer extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      analysisInterval: config.analysisInterval || 300000, // 5 minutes
      healthThresholds: {
        critical: 0.3,
        warning: 0.5,
        healthy: 0.7,
        thriving: 0.85
      },
      ...config
    };
    
    // Initialize sentiment analysis
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
    
    // Initialize neural network for pattern prediction
    this.healthPredictor = new Brain.NeuralNetwork({
      hiddenLayers: [10, 6],
      activation: 'sigmoid'
    });
    
    // Health metrics storage
    this.healthMetrics = {
      overall: 0.7,
      sentiment: 0.7,
      engagement: 0.7,
      growth: 0.7,
      retention: 0.7,
      diversity: 0.7,
      toxicity: 0.1
    };
    
    this.historicalData = [];
    this.alertThresholds = new Map();
    this.interventions = new Map();
  }

  /**
   * Analyze community health in real-time
   */
  async analyzeHealth(communityData) {
    const startTime = Date.now();
    
    // Parallel analysis of different health aspects
    const [
      sentimentScore,
      engagementScore,
      growthScore,
      retentionScore,
      diversityScore,
      toxicityScore,
      predictions
    ] = await Promise.all([
      this.analyzeSentiment(communityData.messages),
      this.analyzeEngagement(communityData.activities),
      this.analyzeGrowth(communityData.members),
      this.analyzeRetention(communityData.members),
      this.analyzeDiversity(communityData.demographics),
      this.analyzeToxicity(communityData.reports),
      this.predictTrends(communityData)
    ]);
    
    // Calculate overall health score
    const overallHealth = this.calculateOverallHealth({
      sentiment: sentimentScore,
      engagement: engagementScore,
      growth: growthScore,
      retention: retentionScore,
      diversity: diversityScore,
      toxicity: toxicityScore
    });
    
    // Update metrics
    this.healthMetrics = {
      overall: overallHealth,
      sentiment: sentimentScore,
      engagement: engagementScore,
      growth: growthScore,
      retention: retentionScore,
      diversity: diversityScore,
      toxicity: toxicityScore,
      timestamp: Date.now(),
      analysisTime: Date.now() - startTime
    };
    
    // Store historical data
    this.updateHistory(this.healthMetrics);
    
    // Check for alerts
    const alerts = this.checkAlerts(this.healthMetrics);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      this.healthMetrics,
      predictions
    );
    
    // Emit health update
    this.emit('healthUpdate', {
      metrics: this.healthMetrics,
      predictions,
      alerts,
      recommendations,
      status: this.getHealthStatus(overallHealth)
    });
    
    return {
      health: this.healthMetrics,
      predictions,
      alerts,
      recommendations,
      status: this.getHealthStatus(overallHealth)
    };
  }

  /**
   * Analyze community sentiment
   */
  async analyzeSentiment(messages) {
    if (!messages || messages.length === 0) return 0.5;
    
    const sentiments = messages.map(msg => {
      const tokens = this.tokenizer.tokenize(msg.content || '');
      return this.sentimentAnalyzer.getSentiment(tokens);
    });
    
    // Calculate weighted average (recent messages have more weight)
    const weightedSum = sentiments.reduce((sum, sentiment, index) => {
      const weight = (index + 1) / sentiments.length;
      return sum + (sentiment * weight);
    }, 0);
    
    const weightSum = sentiments.reduce((sum, _, index) => {
      return sum + ((index + 1) / sentiments.length);
    }, 0);
    
    // Normalize to 0-1 scale
    const avgSentiment = weightedSum / weightSum;
    return (avgSentiment + 1) / 2;
  }

  /**
   * Analyze engagement metrics
   */
  async analyzeEngagement(activities) {
    const metrics = {
      messageFrequency: 0,
      reactionRate: 0,
      threadDepth: 0,
      userParticipation: 0,
      contentQuality: 0
    };
    
    if (!activities || activities.length === 0) return 0.5;
    
    // Message frequency (messages per hour)
    const timeRange = activities[activities.length - 1].timestamp - activities[0].timestamp;
    metrics.messageFrequency = Math.min(
      (activities.length / (timeRange / 3600000)) / 10,
      1
    );
    
    // Reaction rate
    const reactedMessages = activities.filter(a => a.reactions && a.reactions.length > 0);
    metrics.reactionRate = reactedMessages.length / activities.length;
    
    // Thread depth (average replies per thread)
    const threads = this.groupIntoThreads(activities);
    metrics.threadDepth = Math.min(
      threads.reduce((sum, t) => sum + t.length, 0) / threads.length / 5,
      1
    );
    
    // User participation
    const uniqueUsers = new Set(activities.map(a => a.userId));
    metrics.userParticipation = Math.min(uniqueUsers.size / 50, 1);
    
    // Content quality (based on message length and structure)
    metrics.contentQuality = this.assessContentQuality(activities);
    
    // Weighted average
    return (
      metrics.messageFrequency * 0.2 +
      metrics.reactionRate * 0.2 +
      metrics.threadDepth * 0.2 +
      metrics.userParticipation * 0.25 +
      metrics.contentQuality * 0.15
    );
  }

  /**
   * Analyze growth patterns
   */
  async analyzeGrowth(members) {
    if (!members || members.length === 0) return 0.5;
    
    // Sort members by join date
    const sortedMembers = [...members].sort((a, b) => a.joinDate - b.joinDate);
    
    // Calculate growth rate
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const weeklyNewMembers = sortedMembers.filter(m => m.joinDate > oneWeekAgo).length;
    const monthlyNewMembers = sortedMembers.filter(m => m.joinDate > oneMonthAgo).length;
    
    // Growth acceleration
    const weeklyRate = weeklyNewMembers / 7;
    const monthlyRate = monthlyNewMembers / 30;
    const acceleration = weeklyRate > monthlyRate ? 1 : weeklyRate / monthlyRate;
    
    // Quality of new members (based on their initial engagement)
    const newMemberQuality = this.assessNewMemberQuality(
      sortedMembers.filter(m => m.joinDate > oneWeekAgo)
    );
    
    return (acceleration * 0.6 + newMemberQuality * 0.4);
  }

  /**
   * Analyze retention metrics
   */
  async analyzeRetention(members) {
    if (!members || members.length === 0) return 0.5;
    
    const now = Date.now();
    const activeThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Calculate retention rates
    const cohorts = this.groupIntoCohorts(members);
    const retentionRates = {};
    
    for (const [cohortDate, cohortMembers] of Object.entries(cohorts)) {
      const activeMembers = cohortMembers.filter(
        m => (now - m.lastActive) < activeThreshold
      );
      retentionRates[cohortDate] = activeMembers.length / cohortMembers.length;
    }
    
    // Calculate average retention with recent cohorts weighted more
    const sortedCohorts = Object.entries(retentionRates).sort(
      ([a], [b]) => new Date(b) - new Date(a)
    );
    
    let weightedSum = 0;
    let weightTotal = 0;
    
    sortedCohorts.forEach(([_, rate], index) => {
      const weight = 1 / (index + 1);
      weightedSum += rate * weight;
      weightTotal += weight;
    });
    
    return weightedSum / weightTotal;
  }

  /**
   * Analyze community diversity
   */
  async analyzeDiversity(demographics) {
    if (!demographics) return 0.5;
    
    const diversityMetrics = {
      geographic: 0,
      interests: 0,
      experience: 0,
      activity: 0
    };
    
    // Geographic diversity (Shannon entropy)
    if (demographics.locations) {
      diversityMetrics.geographic = this.calculateEntropy(demographics.locations);
    }
    
    // Interest diversity
    if (demographics.interests) {
      diversityMetrics.interests = this.calculateEntropy(demographics.interests);
    }
    
    // Experience level diversity
    if (demographics.experience) {
      diversityMetrics.experience = this.calculateEntropy(demographics.experience);
    }
    
    // Activity pattern diversity
    if (demographics.activityPatterns) {
      diversityMetrics.activity = this.calculateEntropy(demographics.activityPatterns);
    }
    
    // Weighted average
    return (
      diversityMetrics.geographic * 0.2 +
      diversityMetrics.interests * 0.4 +
      diversityMetrics.experience * 0.2 +
      diversityMetrics.activity * 0.2
    );
  }

  /**
   * Analyze toxicity levels
   */
  async analyzeToxicity(reports) {
    if (!reports || reports.length === 0) return 0;
    
    // Calculate toxicity score (inverted for health score)
    const recentReports = reports.filter(
      r => (Date.now() - r.timestamp) < (7 * 24 * 60 * 60 * 1000)
    );
    
    const severityScore = recentReports.reduce((sum, report) => {
      return sum + (report.severity || 0.5);
    }, 0) / Math.max(recentReports.length, 1);
    
    // Consider report resolution rate
    const resolvedReports = recentReports.filter(r => r.resolved);
    const resolutionRate = resolvedReports.length / Math.max(recentReports.length, 1);
    
    // Lower toxicity score is better for health
    return Math.max(0, Math.min(1, severityScore * (1 - resolutionRate * 0.5)));
  }

  /**
   * Predict future trends using neural network
   */
  async predictTrends(communityData) {
    if (this.historicalData.length < 10) {
      return { confidence: 0, predictions: {} };
    }
    
    // Prepare training data
    const trainingData = this.prepareTrainingData();
    
    // Train the network if we have enough data
    if (trainingData.length > 20) {
      this.healthPredictor.train(trainingData, {
        iterations: 1000,
        errorThresh: 0.005
      });
    }
    
    // Make predictions
    const currentInput = this.normalizeMetrics(this.healthMetrics);
    const prediction = this.healthPredictor.run(currentInput);
    
    return {
      confidence: Math.min(this.historicalData.length / 100, 1),
      predictions: {
        sentiment: prediction[0],
        engagement: prediction[1],
        growth: prediction[2],
        retention: prediction[3],
        timeframe: '7 days'
      },
      risks: this.identifyRisks(prediction),
      opportunities: this.identifyOpportunities(prediction)
    };
  }

  /**
   * Generate AI-powered recommendations
   */
  async generateRecommendations(metrics, predictions) {
    const recommendations = [];
    
    // Sentiment recommendations
    if (metrics.sentiment < 0.6) {
      recommendations.push({
        category: 'sentiment',
        priority: 'high',
        action: 'Organize positive community events',
        details: 'Consider hosting appreciation events, success story sharing, or fun challenges',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    // Engagement recommendations
    if (metrics.engagement < 0.5) {
      recommendations.push({
        category: 'engagement',
        priority: 'high',
        action: 'Implement gamification elements',
        details: 'Add points, badges, and leaderboards to encourage participation',
        impact: 'high',
        effort: 'medium'
      });
      
      recommendations.push({
        category: 'engagement',
        priority: 'medium',
        action: 'Create discussion prompts',
        details: 'Post daily conversation starters and thought-provoking questions',
        impact: 'medium',
        effort: 'low'
      });
    }
    
    // Growth recommendations
    if (metrics.growth < 0.5 && predictions.predictions.growth < 0.6) {
      recommendations.push({
        category: 'growth',
        priority: 'high',
        action: 'Launch referral program',
        details: 'Incentivize members to invite friends with rewards',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    // Retention recommendations
    if (metrics.retention < 0.6) {
      recommendations.push({
        category: 'retention',
        priority: 'critical',
        action: 'Implement re-engagement campaigns',
        details: 'Send personalized messages to inactive members with relevant content',
        impact: 'high',
        effort: 'low'
      });
    }
    
    // Diversity recommendations
    if (metrics.diversity < 0.5) {
      recommendations.push({
        category: 'diversity',
        priority: 'medium',
        action: 'Create interest-based sub-communities',
        details: 'Allow members to join specialized groups based on their interests',
        impact: 'medium',
        effort: 'high'
      });
    }
    
    // Toxicity recommendations
    if (metrics.toxicity > 0.3) {
      recommendations.push({
        category: 'safety',
        priority: 'critical',
        action: 'Strengthen moderation',
        details: 'Implement AI-assisted moderation and clear community guidelines',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth(metrics) {
    // Weighted calculation with toxicity having negative impact
    return (
      metrics.sentiment * 0.25 +
      metrics.engagement * 0.25 +
      metrics.growth * 0.15 +
      metrics.retention * 0.20 +
      metrics.diversity * 0.15 -
      metrics.toxicity * 0.5
    );
  }

  /**
   * Get health status label
   */
  getHealthStatus(score) {
    if (score >= this.config.healthThresholds.thriving) return 'thriving';
    if (score >= this.config.healthThresholds.healthy) return 'healthy';
    if (score >= this.config.healthThresholds.warning) return 'warning';
    if (score >= this.config.healthThresholds.critical) return 'critical';
    return 'emergency';
  }

  /**
   * Check for alerts
   */
  checkAlerts(metrics) {
    const alerts = [];
    
    // Check each metric against thresholds
    for (const [metric, value] of Object.entries(metrics)) {
      if (metric === 'timestamp' || metric === 'analysisTime') continue;
      
      const threshold = this.alertThresholds.get(metric);
      if (threshold && value < threshold.min) {
        alerts.push({
          type: 'metric_low',
          metric,
          value,
          threshold: threshold.min,
          severity: value < threshold.critical ? 'critical' : 'warning',
          message: `${metric} has dropped below threshold`
        });
      }
      
      if (metric === 'toxicity' && value > 0.3) {
        alerts.push({
          type: 'toxicity_high',
          metric: 'toxicity',
          value,
          severity: value > 0.5 ? 'critical' : 'warning',
          message: 'Toxicity levels are concerning'
        });
      }
    }
    
    // Check for rapid changes
    if (this.historicalData.length > 1) {
      const previous = this.historicalData[this.historicalData.length - 2];
      for (const [metric, value] of Object.entries(metrics)) {
        if (metric === 'timestamp' || metric === 'analysisTime') continue;
        
        const change = Math.abs(value - (previous[metric] || value));
        if (change > 0.2) {
          alerts.push({
            type: 'rapid_change',
            metric,
            change,
            direction: value > previous[metric] ? 'increase' : 'decrease',
            severity: 'warning',
            message: `Rapid ${value > previous[metric] ? 'increase' : 'decrease'} in ${metric}`
          });
        }
      }
    }
    
    return alerts;
  }

  /**
   * Helper methods
   */
  updateHistory(metrics) {
    this.historicalData.push(metrics);
    
    // Keep only last 1000 data points
    if (this.historicalData.length > 1000) {
      this.historicalData = this.historicalData.slice(-1000);
    }
  }

  groupIntoThreads(activities) {
    const threads = new Map();
    
    activities.forEach(activity => {
      const threadId = activity.threadId || activity.id;
      if (!threads.has(threadId)) {
        threads.set(threadId, []);
      }
      threads.get(threadId).push(activity);
    });
    
    return Array.from(threads.values());
  }

  assessContentQuality(activities) {
    if (!activities || activities.length === 0) return 0.5;
    
    const qualityScores = activities.map(activity => {
      const content = activity.content || '';
      const words = content.split(/\s+/).length;
      const sentences = content.split(/[.!?]+/).length;
      const hasMedia = activity.media && activity.media.length > 0;
      
      // Score based on content richness
      let score = 0;
      if (words > 10) score += 0.3;
      if (words > 50) score += 0.2;
      if (sentences > 2) score += 0.2;
      if (hasMedia) score += 0.3;
      
      return Math.min(score, 1);
    });
    
    return qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  }

  assessNewMemberQuality(newMembers) {
    if (!newMembers || newMembers.length === 0) return 0.5;
    
    const qualityScores = newMembers.map(member => {
      let score = 0;
      
      if (member.profileComplete) score += 0.3;
      if (member.firstPostWithin24Hours) score += 0.3;
      if (member.introductionPost) score += 0.2;
      if (member.engagementScore > 0) score += 0.2;
      
      return score;
    });
    
    return qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  }

  groupIntoCohorts(members) {
    const cohorts = {};
    
    members.forEach(member => {
      const cohortKey = new Date(member.joinDate).toISOString().split('T')[0];
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = [];
      }
      cohorts[cohortKey].push(member);
    });
    
    return cohorts;
  }

  calculateEntropy(distribution) {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    let entropy = 0;
    for (const count of Object.values(distribution)) {
      if (count > 0) {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
      }
    }
    
    // Normalize to 0-1 scale
    const maxEntropy = Math.log2(Object.keys(distribution).length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  prepareTrainingData() {
    const trainingData = [];
    
    for (let i = 1; i < this.historicalData.length; i++) {
      const input = this.normalizeMetrics(this.historicalData[i - 1]);
      const output = [
        this.historicalData[i].sentiment,
        this.historicalData[i].engagement,
        this.historicalData[i].growth,
        this.historicalData[i].retention
      ];
      
      trainingData.push({ input, output });
    }
    
    return trainingData;
  }

  normalizeMetrics(metrics) {
    return [
      metrics.sentiment,
      metrics.engagement,
      metrics.growth,
      metrics.retention,
      metrics.diversity,
      1 - metrics.toxicity // Invert toxicity for training
    ];
  }

  identifyRisks(prediction) {
    const risks = [];
    
    if (prediction[0] < 0.4) { // Sentiment
      risks.push({
        type: 'sentiment_decline',
        severity: 'high',
        description: 'Community sentiment is predicted to decline'
      });
    }
    
    if (prediction[1] < 0.3) { // Engagement
      risks.push({
        type: 'engagement_drop',
        severity: 'critical',
        description: 'Significant engagement drop expected'
      });
    }
    
    if (prediction[3] < 0.5) { // Retention
      risks.push({
        type: 'member_churn',
        severity: 'high',
        description: 'Increased member churn likely'
      });
    }
    
    return risks;
  }

  identifyOpportunities(prediction) {
    const opportunities = [];
    
    if (prediction[2] > 0.7) { // Growth
      opportunities.push({
        type: 'growth_momentum',
        description: 'Strong growth momentum detected - good time for expansion'
      });
    }
    
    if (prediction[0] > 0.8 && prediction[1] > 0.7) { // Sentiment & Engagement
      opportunities.push({
        type: 'community_activation',
        description: 'High sentiment and engagement - perfect for launching new initiatives'
      });
    }
    
    return opportunities;
  }

  /**
   * Set alert threshold for a metric
   */
  setAlertThreshold(metric, min, critical = null) {
    this.alertThresholds.set(metric, {
      min,
      critical: critical || min * 0.5
    });
  }

  /**
   * Register intervention for specific conditions
   */
  registerIntervention(condition, action) {
    this.interventions.set(condition, action);
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.emit('monitoringTick', {
        timestamp: Date.now(),
        metrics: this.healthMetrics
      });
    }, this.config.analysisInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}