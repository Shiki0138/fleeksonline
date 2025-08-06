import Brain from 'brain.js';
import EventEmitter from 'events';
import crypto from 'crypto';

/**
 * AI-Driven Gamification Engine
 * Creates dynamic challenges and rewards based on community behavior
 */
export class AIGamificationEngine extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      challengeGenerationInterval: config.challengeGenerationInterval || 86400000, // 24 hours
      difficultyAdjustmentRate: config.difficultyAdjustmentRate || 0.1,
      rewardMultiplier: config.rewardMultiplier || 1,
      minParticipants: config.minParticipants || 3,
      ...config
    };
    
    // Neural network for difficulty adjustment
    this.difficultyPredictor = new Brain.NeuralNetwork({
      hiddenLayers: [8, 6],
      activation: 'sigmoid'
    });
    
    // Storage
    this.activeChallenges = new Map();
    this.completedChallenges = new Map();
    this.userProfiles = new Map();
    this.leaderboards = new Map();
    this.achievements = new Map();
    this.rewards = new Map();
    
    // Challenge templates
    this.challengeTemplates = this.initializeChallengeTemplates();
    this.achievementTemplates = this.initializeAchievementTemplates();
    
    // Analytics
    this.analytics = {
      totalChallenges: 0,
      completionRate: 0,
      averageParticipation: 0,
      popularChallengeTypes: new Map()
    };
  }

  /**
   * Create AI-generated challenge
   */
  async createChallenge(context = {}) {
    const challengeType = await this.selectOptimalChallengeType(context);
    const difficulty = await this.calculateOptimalDifficulty(context);
    const rewards = await this.generateDynamicRewards(challengeType, difficulty);
    
    const challenge = {
      id: this.generateChallengeId(),
      type: challengeType,
      title: await this.generateChallengeTitle(challengeType, context),
      description: await this.generateChallengeDescription(challengeType, context),
      difficulty,
      requirements: await this.generateRequirements(challengeType, difficulty),
      rewards,
      metadata: {
        createdAt: Date.now(),
        createdBy: 'AI',
        context,
        predictedCompletionRate: await this.predictCompletionRate(challengeType, difficulty),
        targetAudience: await this.identifyTargetAudience(challengeType, context)
      },
      participants: new Set(),
      progress: new Map(),
      status: 'active',
      startTime: Date.now(),
      endTime: this.calculateEndTime(challengeType),
      leaderboard: []
    };
    
    // Store challenge
    this.activeChallenges.set(challenge.id, challenge);
    
    // Emit event
    this.emit('challengeCreated', challenge);
    
    // Schedule notifications
    this.scheduleNotifications(challenge);
    
    return challenge;
  }

  /**
   * Track user progress
   */
  async trackProgress(userId, challengeId, action, data = {}) {
    const challenge = this.activeChallenges.get(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    // Get or create user profile
    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = await this.createUserProfile(userId);
    }
    
    // Add to participants if new
    if (!challenge.participants.has(userId)) {
      challenge.participants.add(userId);
      this.emit('userJoinedChallenge', { userId, challengeId });
    }
    
    // Get current progress
    let progress = challenge.progress.get(userId) || {
      userId,
      startTime: Date.now(),
      actions: [],
      score: 0,
      completed: false
    };
    
    // Process action
    const actionResult = await this.processAction(
      challenge,
      action,
      data,
      userProfile
    );
    
    // Update progress
    progress.actions.push({
      type: action,
      data,
      timestamp: Date.now(),
      points: actionResult.points
    });
    progress.score += actionResult.points;
    
    // Check completion
    if (this.checkCompletion(challenge, progress)) {
      progress.completed = true;
      progress.completedAt = Date.now();
      await this.handleCompletion(userId, challenge, progress);
    }
    
    // Store progress
    challenge.progress.set(userId, progress);
    
    // Update leaderboard
    this.updateLeaderboard(challenge);
    
    // Emit progress event
    this.emit('progressTracked', {
      userId,
      challengeId,
      progress,
      actionResult
    });
    
    // AI adjustments
    await this.adjustChallengeDynamically(challenge);
    
    return {
      progress,
      actionResult,
      leaderboard: challenge.leaderboard.slice(0, 10)
    };
  }

  /**
   * Generate personalized challenges for user
   */
  async generatePersonalizedChallenges(userId, count = 3) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const challenges = [];
    
    // Analyze user behavior
    const behaviorAnalysis = await this.analyzeUserBehavior(userProfile);
    
    // Generate challenges based on analysis
    for (let i = 0; i < count; i++) {
      const challengeContext = {
        userId,
        interests: behaviorAnalysis.interests,
        skillLevel: behaviorAnalysis.skillLevel,
        preferredDifficulty: behaviorAnalysis.preferredDifficulty,
        availableTime: behaviorAnalysis.availableTime,
        socialPreference: behaviorAnalysis.socialPreference
      };
      
      const challenge = await this.createChallenge(challengeContext);
      challenges.push(challenge);
    }
    
    return challenges;
  }

  /**
   * Award achievement
   */
  async awardAchievement(userId, achievementType, data = {}) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return;
    
    const achievement = {
      id: crypto.randomBytes(16).toString('hex'),
      type: achievementType,
      userId,
      title: this.achievementTemplates[achievementType]?.title || achievementType,
      description: this.achievementTemplates[achievementType]?.description || '',
      icon: this.achievementTemplates[achievementType]?.icon || '🏆',
      rarity: this.calculateAchievementRarity(achievementType),
      unlockedAt: Date.now(),
      data
    };
    
    // Add to user achievements
    if (!userProfile.achievements) {
      userProfile.achievements = [];
    }
    userProfile.achievements.push(achievement);
    
    // Calculate rewards
    const rewards = await this.calculateAchievementRewards(achievement);
    await this.grantRewards(userId, rewards);
    
    // Store achievement
    const userAchievements = this.achievements.get(userId) || [];
    userAchievements.push(achievement);
    this.achievements.set(userId, userAchievements);
    
    // Emit event
    this.emit('achievementUnlocked', {
      userId,
      achievement,
      rewards
    });
    
    return achievement;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type = 'global', timeframe = 'all', limit = 100) {
    const leaderboardKey = `${type}-${timeframe}`;
    let leaderboard = this.leaderboards.get(leaderboardKey);
    
    if (!leaderboard || this.shouldRefreshLeaderboard(leaderboard)) {
      leaderboard = await this.calculateLeaderboard(type, timeframe);
      this.leaderboards.set(leaderboardKey, {
        data: leaderboard,
        updatedAt: Date.now()
      });
    }
    
    return leaderboard.data.slice(0, limit);
  }

  /**
   * Create team challenge
   */
  async createTeamChallenge(teams, challengeType = 'collaboration') {
    const challenge = await this.createChallenge({
      type: 'team',
      teams,
      subType: challengeType
    });
    
    // Initialize team tracking
    challenge.teamProgress = new Map();
    for (const team of teams) {
      challenge.teamProgress.set(team.id, {
        teamId: team.id,
        members: team.members,
        score: 0,
        contributions: new Map()
      });
    }
    
    return challenge;
  }

  /**
   * AI-powered challenge selection
   */
  async selectOptimalChallengeType(context) {
    const availableTypes = Object.keys(this.challengeTemplates);
    
    if (context.userId) {
      // Personalized selection
      const userProfile = this.userProfiles.get(context.userId);
      if (userProfile) {
        const preferences = this.analyzePreferences(userProfile);
        return this.weightedRandomSelection(availableTypes, preferences);
      }
    }
    
    // Community-wide selection
    const communityTrends = await this.analyzeCommunityTrends();
    const typeScores = {};
    
    for (const type of availableTypes) {
      typeScores[type] = this.scoreChallengetype(type, communityTrends, context);
    }
    
    // Select type with highest score with some randomness
    return this.probabilisticSelection(typeScores);
  }

  /**
   * Calculate optimal difficulty
   */
  async calculateOptimalDifficulty(context) {
    const factors = {
      communitySkillLevel: await this.getAverageCommunitySkill(),
      recentCompletionRates: this.getRecentCompletionRates(),
      timeOfDay: this.getTimeOfDayFactor(),
      dayOfWeek: this.getDayOfWeekFactor(),
      userSkillLevel: context.skillLevel || 0.5
    };
    
    // Use neural network if trained
    if (this.difficultyPredictor.trained) {
      const input = Object.values(factors);
      const prediction = this.difficultyPredictor.run(input);
      return prediction[0];
    }
    
    // Fallback calculation
    const baseDifficulty = 
      factors.communitySkillLevel * 0.3 +
      (1 - factors.recentCompletionRates) * 0.3 +
      factors.timeOfDay * 0.1 +
      factors.dayOfWeek * 0.1 +
      factors.userSkillLevel * 0.2;
    
    return Math.max(0.1, Math.min(1, baseDifficulty));
  }

  /**
   * Generate dynamic rewards
   */
  async generateDynamicRewards(challengeType, difficulty) {
    const baseRewards = this.challengeTemplates[challengeType]?.baseRewards || {
      points: 100,
      experience: 50
    };
    
    // Scale rewards based on difficulty
    const difficultyMultiplier = 1 + (difficulty * 2);
    
    // Add special rewards based on context
    const rewards = {
      points: Math.floor(baseRewards.points * difficultyMultiplier * this.config.rewardMultiplier),
      experience: Math.floor(baseRewards.experience * difficultyMultiplier),
      badges: []
    };
    
    // Chance for special rewards
    if (Math.random() < difficulty * 0.3) {
      rewards.badges.push(this.generateSpecialBadge(challengeType, difficulty));
    }
    
    // Bonus rewards for streaks
    if (this.checkForStreak(challengeType)) {
      rewards.streakBonus = Math.floor(rewards.points * 0.2);
      rewards.points += rewards.streakBonus;
    }
    
    return rewards;
  }

  /**
   * Process user action
   */
  async processAction(challenge, action, data, userProfile) {
    const actionHandler = this.getActionHandler(challenge.type, action);
    if (!actionHandler) {
      throw new Error(`Unknown action: ${action} for challenge type: ${challenge.type}`);
    }
    
    // Validate action
    const validation = await actionHandler.validate(data, challenge, userProfile);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        points: 0
      };
    }
    
    // Calculate points
    const points = await actionHandler.calculatePoints(data, challenge, userProfile);
    
    // Apply modifiers
    const modifiedPoints = this.applyPointModifiers(points, {
      userLevel: userProfile.level || 1,
      streak: userProfile.currentStreak || 0,
      firstTime: !userProfile.completedChallengeTypes?.includes(challenge.type),
      teamBonus: challenge.type === 'team' ? 1.2 : 1
    });
    
    return {
      success: true,
      points: modifiedPoints,
      feedback: await this.generateActionFeedback(action, modifiedPoints)
    };
  }

  /**
   * Check challenge completion
   */
  checkCompletion(challenge, progress) {
    const requirements = challenge.requirements;
    
    switch (challenge.type) {
      case 'score':
        return progress.score >= requirements.targetScore;
      
      case 'collection':
        return progress.actions.filter(a => a.type === 'collect').length >= requirements.itemCount;
      
      case 'streak':
        return this.checkStreakCompletion(progress.actions, requirements.streakLength);
      
      case 'social':
        return this.checkSocialCompletion(progress.actions, requirements);
      
      case 'learning':
        return this.checkLearningCompletion(progress.actions, requirements);
      
      case 'creative':
        return this.checkCreativeCompletion(progress.actions, requirements);
      
      default:
        return progress.score >= (requirements.targetScore || 100);
    }
  }

  /**
   * Handle challenge completion
   */
  async handleCompletion(userId, challenge, progress) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return;
    
    // Calculate final rewards
    const timeBonus = this.calculateTimeBonus(progress);
    const rankBonus = this.calculateRankBonus(challenge, userId);
    
    const finalRewards = {
      ...challenge.rewards,
      points: challenge.rewards.points + timeBonus + rankBonus
    };
    
    // Grant rewards
    await this.grantRewards(userId, finalRewards);
    
    // Update user stats
    userProfile.completedChallenges = (userProfile.completedChallenges || 0) + 1;
    userProfile.totalPoints = (userProfile.totalPoints || 0) + finalRewards.points;
    
    // Check for achievements
    await this.checkAchievements(userId, challenge, progress);
    
    // Move to completed
    if (this.allParticipantsComplete(challenge)) {
      this.completedChallenges.set(challenge.id, {
        ...challenge,
        completedAt: Date.now()
      });
      this.activeChallenges.delete(challenge.id);
    }
    
    // Emit completion event
    this.emit('challengeCompleted', {
      userId,
      challengeId: challenge.id,
      progress,
      rewards: finalRewards,
      rank: this.getUserRank(challenge, userId)
    });
  }

  /**
   * Adjust challenge difficulty dynamically
   */
  async adjustChallengeDynamically(challenge) {
    const participationRate = challenge.participants.size / this.userProfiles.size;
    const completionRate = this.calculateCurrentCompletionRate(challenge);
    
    // Too easy - increase difficulty
    if (completionRate > 0.8 && challenge.difficulty < 0.9) {
      challenge.difficulty = Math.min(0.9, challenge.difficulty + this.config.difficultyAdjustmentRate);
      challenge.requirements = await this.generateRequirements(challenge.type, challenge.difficulty);
    }
    
    // Too hard - decrease difficulty
    if (completionRate < 0.2 && challenge.difficulty > 0.2) {
      challenge.difficulty = Math.max(0.2, challenge.difficulty - this.config.difficultyAdjustmentRate);
      challenge.requirements = await this.generateRequirements(challenge.type, challenge.difficulty);
    }
    
    // Low participation - add incentives
    if (participationRate < 0.1) {
      challenge.rewards.points = Math.floor(challenge.rewards.points * 1.5);
      this.emit('challengeIncentiveAdded', {
        challengeId: challenge.id,
        newRewards: challenge.rewards
      });
    }
  }

  /**
   * Initialize challenge templates
   */
  initializeChallengeTemplates() {
    return {
      daily_activity: {
        name: 'Daily Activity',
        description: 'Complete daily community activities',
        baseRewards: { points: 50, experience: 25 },
        duration: 24 * 60 * 60 * 1000
      },
      
      knowledge_sharing: {
        name: 'Knowledge Sharing',
        description: 'Share your expertise with the community',
        baseRewards: { points: 100, experience: 50 },
        duration: 7 * 24 * 60 * 60 * 1000
      },
      
      collaboration: {
        name: 'Collaboration Challenge',
        description: 'Work together to achieve a common goal',
        baseRewards: { points: 200, experience: 100 },
        duration: 3 * 24 * 60 * 60 * 1000
      },
      
      creativity: {
        name: 'Creative Expression',
        description: 'Show your creative side',
        baseRewards: { points: 150, experience: 75 },
        duration: 5 * 24 * 60 * 60 * 1000
      },
      
      learning_streak: {
        name: 'Learning Streak',
        description: 'Maintain a learning streak',
        baseRewards: { points: 75, experience: 40 },
        duration: 7 * 24 * 60 * 60 * 1000
      },
      
      community_helper: {
        name: 'Community Helper',
        description: 'Help other community members',
        baseRewards: { points: 120, experience: 60 },
        duration: 7 * 24 * 60 * 60 * 1000
      },
      
      trend_setter: {
        name: 'Trend Setter',
        description: 'Start a new trend in the community',
        baseRewards: { points: 300, experience: 150 },
        duration: 14 * 24 * 60 * 60 * 1000
      }
    };
  }

  /**
   * Initialize achievement templates
   */
  initializeAchievementTemplates() {
    return {
      first_challenge: {
        title: 'First Steps',
        description: 'Complete your first challenge',
        icon: '🎯',
        rarity: 'common'
      },
      
      streak_master: {
        title: 'Streak Master',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        rarity: 'rare'
      },
      
      helper_hero: {
        title: 'Helper Hero',
        description: 'Help 50 community members',
        icon: '🦸',
        rarity: 'epic'
      },
      
      knowledge_sage: {
        title: 'Knowledge Sage',
        description: 'Share 100 pieces of valuable content',
        icon: '🧙',
        rarity: 'legendary'
      },
      
      community_pillar: {
        title: 'Community Pillar',
        description: 'Be active for 365 consecutive days',
        icon: '🏛️',
        rarity: 'mythic'
      }
    };
  }

  /**
   * Helper methods
   */
  generateChallengeId() {
    return `challenge_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  async generateChallengeTitle(type, context) {
    const template = this.challengeTemplates[type];
    const variations = [
      `${template.name} Challenge`,
      `Master the ${template.name}`,
      `${template.name} Quest`,
      `The Great ${template.name}`
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  }

  async generateChallengeDescription(type, context) {
    const template = this.challengeTemplates[type];
    return template.description;
  }

  async generateRequirements(type, difficulty) {
    const baseRequirements = {
      score: { targetScore: Math.floor(100 * (1 + difficulty * 2)) },
      collection: { itemCount: Math.floor(5 + difficulty * 10) },
      streak: { streakLength: Math.floor(3 + difficulty * 4) },
      social: { interactions: Math.floor(5 + difficulty * 5) },
      learning: { lessonsCompleted: Math.floor(3 + difficulty * 5) },
      creative: { creationsShared: Math.floor(2 + difficulty * 3) }
    };
    
    return baseRequirements[type] || baseRequirements.score;
  }

  calculateEndTime(type) {
    const template = this.challengeTemplates[type];
    return Date.now() + (template?.duration || 7 * 24 * 60 * 60 * 1000);
  }

  async predictCompletionRate(type, difficulty) {
    // Use historical data to predict
    const historicalRates = this.getHistoricalCompletionRates(type, difficulty);
    if (historicalRates.length > 0) {
      return historicalRates.reduce((a, b) => a + b) / historicalRates.length;
    }
    
    // Default prediction based on difficulty
    return 1 - (difficulty * 0.6);
  }

  async identifyTargetAudience(type, context) {
    const audience = {
      skillLevel: 'all',
      interests: [],
      activityLevel: 'moderate'
    };
    
    // Customize based on challenge type
    switch (type) {
      case 'learning_streak':
        audience.interests = ['learning', 'self-improvement'];
        audience.activityLevel = 'high';
        break;
      
      case 'creativity':
        audience.interests = ['art', 'design', 'creativity'];
        break;
      
      case 'collaboration':
        audience.skillLevel = 'intermediate';
        audience.interests = ['teamwork', 'social'];
        break;
    }
    
    return audience;
  }

  scheduleNotifications(challenge) {
    // Schedule start notification
    setTimeout(() => {
      this.emit('notification', {
        type: 'challenge_start',
        challenge,
        message: `New challenge available: ${challenge.title}`
      });
    }, 1000);
    
    // Schedule midpoint reminder
    const midpoint = (challenge.endTime - challenge.startTime) / 2;
    setTimeout(() => {
      this.emit('notification', {
        type: 'challenge_reminder',
        challenge,
        message: `Challenge "${challenge.title}" is halfway done!`
      });
    }, midpoint);
    
    // Schedule ending soon notification
    const warningTime = challenge.endTime - (2 * 60 * 60 * 1000); // 2 hours before end
    setTimeout(() => {
      this.emit('notification', {
        type: 'challenge_ending',
        challenge,
        message: `Challenge "${challenge.title}" ends in 2 hours!`
      });
    }, warningTime - Date.now());
  }

  async createUserProfile(userId) {
    const profile = {
      userId,
      level: 1,
      experience: 0,
      totalPoints: 0,
      completedChallenges: 0,
      achievements: [],
      currentStreak: 0,
      longestStreak: 0,
      preferences: {},
      stats: {
        favoriteChallenge: null,
        averageScore: 0,
        participationRate: 0
      },
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    this.userProfiles.set(userId, profile);
    return profile;
  }

  async analyzeUserBehavior(userProfile) {
    return {
      interests: this.inferInterests(userProfile),
      skillLevel: this.calculateSkillLevel(userProfile),
      preferredDifficulty: this.inferPreferredDifficulty(userProfile),
      availableTime: this.estimateAvailableTime(userProfile),
      socialPreference: this.analyzeSocialPreference(userProfile)
    };
  }

  inferInterests(userProfile) {
    // Analyze completed challenges and actions
    const interests = new Map();
    
    // This would analyze user history
    return ['learning', 'collaboration', 'creativity'];
  }

  calculateSkillLevel(userProfile) {
    if (!userProfile.completedChallenges) return 0.3;
    
    const level = Math.min(userProfile.completedChallenges / 50, 1);
    const avgScore = userProfile.stats?.averageScore || 0.5;
    
    return (level + avgScore) / 2;
  }

  inferPreferredDifficulty(userProfile) {
    // Analyze completion rates at different difficulties
    return 0.5; // Default to medium
  }

  estimateAvailableTime(userProfile) {
    // Analyze activity patterns
    return 'moderate';
  }

  analyzeSocialPreference(userProfile) {
    // Analyze participation in team vs solo challenges
    return 'balanced';
  }

  calculateAchievementRarity(type) {
    const template = this.achievementTemplates[type];
    return template?.rarity || 'common';
  }

  async calculateAchievementRewards(achievement) {
    const rarityMultipliers = {
      common: 1,
      rare: 2,
      epic: 5,
      legendary: 10,
      mythic: 25
    };
    
    const multiplier = rarityMultipliers[achievement.rarity] || 1;
    
    return {
      points: 100 * multiplier,
      experience: 50 * multiplier,
      badge: achievement.icon
    };
  }

  async grantRewards(userId, rewards) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return;
    
    // Add points
    userProfile.totalPoints = (userProfile.totalPoints || 0) + (rewards.points || 0);
    
    // Add experience
    userProfile.experience = (userProfile.experience || 0) + (rewards.experience || 0);
    
    // Check for level up
    const newLevel = Math.floor(userProfile.experience / 1000) + 1;
    if (newLevel > userProfile.level) {
      userProfile.level = newLevel;
      this.emit('levelUp', { userId, newLevel });
    }
    
    // Add badges
    if (rewards.badges) {
      userProfile.badges = [...(userProfile.badges || []), ...rewards.badges];
    }
    
    // Store rewards history
    const userRewards = this.rewards.get(userId) || [];
    userRewards.push({
      ...rewards,
      grantedAt: Date.now()
    });
    this.rewards.set(userId, userRewards);
  }

  updateLeaderboard(challenge) {
    const scores = [];
    
    for (const [userId, progress] of challenge.progress) {
      scores.push({
        userId,
        score: progress.score,
        completed: progress.completed,
        completedAt: progress.completedAt
      });
    }
    
    // Sort by score (and completion time for ties)
    challenge.leaderboard = scores.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.completed && b.completed) return a.completedAt - b.completedAt;
      if (a.completed) return -1;
      if (b.completed) return 1;
      return 0;
    });
  }

  analyzePreferences(userProfile) {
    // Analyze user's challenge history
    const preferences = {};
    
    for (const type of Object.keys(this.challengeTemplates)) {
      preferences[type] = 0.5; // Default weight
    }
    
    // Adjust based on history
    if (userProfile.favoriteTypes) {
      for (const type of userProfile.favoriteTypes) {
        preferences[type] = 0.8;
      }
    }
    
    return preferences;
  }

  weightedRandomSelection(items, weights) {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= weights[item] || 0.5;
      if (random <= 0) return item;
    }
    
    return items[Math.floor(Math.random() * items.length)];
  }

  async analyzeCommunityTrends() {
    return {
      activeUsers: this.userProfiles.size,
      popularTypes: Array.from(this.analytics.popularChallengeTypes.entries()),
      completionRate: this.analytics.completionRate,
      timeOfDay: new Date().getHours()
    };
  }

  scoreChallengetype(type, trends, context) {
    let score = 0.5; // Base score
    
    // Boost based on popularity
    const popularity = this.analytics.popularChallengeTypes.get(type) || 0;
    score += popularity * 0.2;
    
    // Time-based adjustments
    if (type === 'daily_activity' && trends.timeOfDay < 12) {
      score += 0.3; // Morning boost for daily challenges
    }
    
    // Context-based adjustments
    if (context.interests?.includes(type)) {
      score += 0.4;
    }
    
    return Math.min(score, 1);
  }

  probabilisticSelection(scores) {
    const items = Object.entries(scores);
    const totalScore = items.reduce((sum, [_, score]) => sum + score, 0);
    
    let random = Math.random() * totalScore;
    for (const [type, score] of items) {
      random -= score;
      if (random <= 0) return type;
    }
    
    return items[0][0]; // Fallback
  }

  async getAverageCommunitySkill() {
    if (this.userProfiles.size === 0) return 0.5;
    
    let totalSkill = 0;
    for (const profile of this.userProfiles.values()) {
      totalSkill += this.calculateSkillLevel(profile);
    }
    
    return totalSkill / this.userProfiles.size;
  }

  getRecentCompletionRates() {
    const recentChallenges = Array.from(this.completedChallenges.values())
      .filter(c => Date.now() - c.completedAt < 7 * 24 * 60 * 60 * 1000);
    
    if (recentChallenges.length === 0) return 0.5;
    
    const totalRate = recentChallenges.reduce((sum, challenge) => {
      const completionRate = challenge.participants.size > 0
        ? Array.from(challenge.progress.values()).filter(p => p.completed).length / challenge.participants.size
        : 0;
      return sum + completionRate;
    }, 0);
    
    return totalRate / recentChallenges.length;
  }

  getTimeOfDayFactor() {
    const hour = new Date().getHours();
    
    // Peak activity hours (evening)
    if (hour >= 18 && hour <= 22) return 0.8;
    
    // Morning
    if (hour >= 6 && hour <= 10) return 0.6;
    
    // Afternoon
    if (hour >= 14 && hour <= 17) return 0.7;
    
    // Night/early morning
    return 0.3;
  }

  getDayOfWeekFactor() {
    const day = new Date().getDay();
    
    // Weekend
    if (day === 0 || day === 6) return 0.8;
    
    // Friday
    if (day === 5) return 0.7;
    
    // Mid-week
    return 0.6;
  }

  generateSpecialBadge(challengeType, difficulty) {
    const badges = {
      easy: { name: 'Starter', icon: '⭐' },
      medium: { name: 'Achiever', icon: '🌟' },
      hard: { name: 'Master', icon: '💫' }
    };
    
    const level = difficulty < 0.3 ? 'easy' : difficulty < 0.7 ? 'medium' : 'hard';
    return {
      ...badges[level],
      type: challengeType,
      earnedAt: Date.now()
    };
  }

  checkForStreak(challengeType) {
    // Check if user has been completing this type of challenge consecutively
    return false; // Simplified
  }

  getActionHandler(challengeType, action) {
    // Return appropriate handler based on challenge type and action
    return {
      validate: async (data) => ({ valid: true }),
      calculatePoints: async (data) => 10
    };
  }

  applyPointModifiers(basePoints, modifiers) {
    let points = basePoints;
    
    // Level bonus
    points *= (1 + (modifiers.userLevel - 1) * 0.05);
    
    // Streak bonus
    if (modifiers.streak > 0) {
      points *= (1 + Math.min(modifiers.streak * 0.02, 0.5));
    }
    
    // First time bonus
    if (modifiers.firstTime) {
      points *= 1.5;
    }
    
    // Team bonus
    points *= modifiers.teamBonus;
    
    return Math.floor(points);
  }

  async generateActionFeedback(action, points) {
    const feedback = [
      `Great ${action}! +${points} points`,
      `Awesome work! You earned ${points} points`,
      `${action} complete! ${points} points added`
    ];
    
    return feedback[Math.floor(Math.random() * feedback.length)];
  }

  checkStreakCompletion(actions, requiredLength) {
    // Check if actions form a streak
    const dailyActions = this.groupActionsByDay(actions);
    let currentStreak = 0;
    let maxStreak = 0;
    
    const sortedDays = Object.keys(dailyActions).sort();
    let lastDay = null;
    
    for (const day of sortedDays) {
      if (!lastDay || this.isConsecutiveDay(lastDay, day)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
      lastDay = day;
    }
    
    return maxStreak >= requiredLength;
  }

  checkSocialCompletion(actions, requirements) {
    const socialActions = actions.filter(a => 
      ['interact', 'help', 'collaborate', 'share'].includes(a.type)
    );
    return socialActions.length >= requirements.interactions;
  }

  checkLearningCompletion(actions, requirements) {
    const learningActions = actions.filter(a => 
      ['complete_lesson', 'quiz_passed', 'skill_acquired'].includes(a.type)
    );
    return learningActions.length >= requirements.lessonsCompleted;
  }

  checkCreativeCompletion(actions, requirements) {
    const creativeActions = actions.filter(a => 
      ['create', 'share_creation', 'remix'].includes(a.type)
    );
    return creativeActions.length >= requirements.creationsShared;
  }

  calculateTimeBonus(progress) {
    const completionTime = progress.completedAt - progress.startTime;
    const expectedTime = 24 * 60 * 60 * 1000; // 24 hours
    
    if (completionTime < expectedTime / 2) {
      return 50; // Fast completion bonus
    } else if (completionTime < expectedTime) {
      return 25;
    }
    
    return 0;
  }

  calculateRankBonus(challenge, userId) {
    const rank = this.getUserRank(challenge, userId);
    
    if (rank === 1) return 100;
    if (rank === 2) return 50;
    if (rank === 3) return 25;
    if (rank <= 10) return 10;
    
    return 0;
  }

  getUserRank(challenge, userId) {
    const index = challenge.leaderboard.findIndex(entry => entry.userId === userId);
    return index === -1 ? challenge.leaderboard.length + 1 : index + 1;
  }

  allParticipantsComplete(challenge) {
    if (challenge.participants.size === 0) return false;
    
    for (const userId of challenge.participants) {
      const progress = challenge.progress.get(userId);
      if (!progress || !progress.completed) return false;
    }
    
    return true;
  }

  calculateCurrentCompletionRate(challenge) {
    if (challenge.participants.size === 0) return 0;
    
    const completed = Array.from(challenge.progress.values())
      .filter(p => p.completed).length;
    
    return completed / challenge.participants.size;
  }

  async checkAchievements(userId, challenge, progress) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return;
    
    // First challenge achievement
    if (userProfile.completedChallenges === 1) {
      await this.awardAchievement(userId, 'first_challenge');
    }
    
    // Streak achievements
    if (userProfile.currentStreak >= 7) {
      await this.awardAchievement(userId, 'streak_master');
    }
    
    // Type-specific achievements
    if (challenge.type === 'community_helper') {
      const helpCount = userProfile.helpCount || 0;
      if (helpCount >= 50) {
        await this.awardAchievement(userId, 'helper_hero');
      }
    }
  }

  getHistoricalCompletionRates(type, difficulty) {
    const rates = [];
    
    for (const challenge of this.completedChallenges.values()) {
      if (challenge.type === type && Math.abs(challenge.difficulty - difficulty) < 0.1) {
        const rate = challenge.participants.size > 0
          ? Array.from(challenge.progress.values()).filter(p => p.completed).length / challenge.participants.size
          : 0;
        rates.push(rate);
      }
    }
    
    return rates;
  }

  async calculateLeaderboard(type, timeframe) {
    const users = [];
    
    for (const [userId, profile] of this.userProfiles) {
      const score = this.calculateUserScore(profile, type, timeframe);
      users.push({
        userId,
        score,
        level: profile.level,
        achievements: profile.achievements?.length || 0
      });
    }
    
    return users.sort((a, b) => b.score - a.score);
  }

  calculateUserScore(profile, type, timeframe) {
    // Calculate score based on type and timeframe
    if (type === 'global') {
      return profile.totalPoints || 0;
    }
    
    // Type-specific scoring
    return profile.stats?.[type] || 0;
  }

  shouldRefreshLeaderboard(leaderboard) {
    const refreshInterval = 5 * 60 * 1000; // 5 minutes
    return Date.now() - leaderboard.updatedAt > refreshInterval;
  }

  groupActionsByDay(actions) {
    const grouped = {};
    
    for (const action of actions) {
      const day = new Date(action.timestamp).toDateString();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(action);
    }
    
    return grouped;
  }

  isConsecutiveDay(day1, day2) {
    const date1 = new Date(day1);
    const date2 = new Date(day2);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  }

  /**
   * Start automatic challenge generation
   */
  startChallengeGeneration() {
    if (this.generationInterval) return;
    
    this.generationInterval = setInterval(async () => {
      try {
        // Generate community-wide challenge
        await this.createChallenge();
        
        // Generate personalized challenges for active users
        const activeUsers = this.getActiveUsers();
        for (const userId of activeUsers) {
          await this.generatePersonalizedChallenges(userId, 1);
        }
      } catch (error) {
        console.error('Challenge generation error:', error);
      }
    }, this.config.challengeGenerationInterval);
  }

  /**
   * Stop challenge generation
   */
  stopChallengeGeneration() {
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
      this.generationInterval = null;
    }
  }

  getActiveUsers() {
    const activeThreshold = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();
    
    return Array.from(this.userProfiles.entries())
      .filter(([_, profile]) => now - profile.lastActive < activeThreshold)
      .map(([userId]) => userId);
  }
}