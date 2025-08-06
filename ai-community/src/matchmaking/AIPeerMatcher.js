import kmeans from 'ml-kmeans';
import Brain from 'brain.js';
import EventEmitter from 'events';

/**
 * AI-Powered Peer Learning Matchmaker
 * Intelligently matches community members for optimal learning experiences
 */
export class AIPeerMatcher extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      matchingInterval: config.matchingInterval || 86400000, // 24 hours
      minCompatibility: config.minCompatibility || 0.7,
      maxMatchesPerUser: config.maxMatchesPerUser || 5,
      learningGoalWeight: 0.3,
      skillLevelWeight: 0.2,
      interestWeight: 0.2,
      availabilityWeight: 0.15,
      personalityWeight: 0.15,
      ...config
    };
    
    // Initialize neural network for compatibility prediction
    this.compatibilityPredictor = new Brain.NeuralNetwork({
      hiddenLayers: [12, 8, 4],
      activation: 'sigmoid'
    });
    
    // Storage for user profiles and matches
    this.userProfiles = new Map();
    this.activeMatches = new Map();
    this.matchHistory = new Map();
    this.feedbackData = [];
    
    // Clustering for interest groups
    this.interestClusters = null;
    this.skillClusters = null;
  }

  /**
   * Create or update user profile for matching
   */
  async createUserProfile(userId, profileData) {
    const enrichedProfile = await this.enrichProfile(profileData);
    
    const profile = {
      userId,
      skills: enrichedProfile.skills || [],
      interests: enrichedProfile.interests || [],
      learningGoals: enrichedProfile.learningGoals || [],
      availability: enrichedProfile.availability || {},
      timezone: enrichedProfile.timezone || 'UTC',
      personality: await this.analyzePersonality(profileData),
      learningStyle: await this.identifyLearningStyle(profileData),
      experience: this.calculateExperience(profileData),
      language: enrichedProfile.language || 'en',
      preferences: {
        sessionLength: enrichedProfile.preferences?.sessionLength || 60,
        communicationStyle: enrichedProfile.preferences?.communicationStyle || 'mixed',
        matchFrequency: enrichedProfile.preferences?.matchFrequency || 'weekly'
      },
      stats: {
        totalMatches: 0,
        successfulMatches: 0,
        averageRating: 0,
        responseRate: 1
      },
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    // Generate skill embeddings
    profile.skillEmbeddings = await this.generateSkillEmbeddings(profile.skills);
    profile.interestEmbeddings = await this.generateInterestEmbeddings(profile.interests);
    
    this.userProfiles.set(userId, profile);
    
    // Update clusters if needed
    if (this.userProfiles.size % 10 === 0) {
      await this.updateClusters();
    }
    
    this.emit('profileCreated', { userId, profile });
    
    return profile;
  }

  /**
   * Find optimal matches for a user
   */
  async findMatches(userId, options = {}) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    // Get potential candidates
    const candidates = await this.getCandidates(userId, options);
    
    // Calculate compatibility scores in parallel
    const compatibilityScores = await Promise.all(
      candidates.map(async candidateId => {
        const score = await this.calculateCompatibility(userId, candidateId);
        return { candidateId, score };
      })
    );
    
    // Sort by compatibility and filter
    const matches = compatibilityScores
      .filter(m => m.score >= this.config.minCompatibility)
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || this.config.maxMatchesPerUser);
    
    // Enhance matches with reasoning
    const enhancedMatches = await Promise.all(
      matches.map(async match => {
        const candidate = this.userProfiles.get(match.candidateId);
        const reasoning = await this.generateMatchReasoning(
          userProfile,
          candidate,
          match.score
        );
        
        return {
          userId: match.candidateId,
          compatibility: match.score,
          reasoning,
          profile: this.sanitizeProfile(candidate),
          suggestedActivities: await this.suggestActivities(userProfile, candidate),
          estimatedLearningOutcome: await this.predictLearningOutcome(userProfile, candidate)
        };
      })
    );
    
    // Store matches
    this.storeMatches(userId, enhancedMatches);
    
    // Emit match event
    this.emit('matchesFound', {
      userId,
      matches: enhancedMatches,
      timestamp: Date.now()
    });
    
    return enhancedMatches;
  }

  /**
   * Calculate compatibility between two users
   */
  async calculateCompatibility(userId1, userId2) {
    const user1 = this.userProfiles.get(userId1);
    const user2 = this.userProfiles.get(userId2);
    
    if (!user1 || !user2) return 0;
    
    // Calculate individual compatibility factors
    const factors = {
      learningGoals: this.calculateLearningGoalAlignment(user1, user2),
      skillLevel: this.calculateSkillLevelCompatibility(user1, user2),
      interests: this.calculateInterestSimilarity(user1, user2),
      availability: this.calculateAvailabilityOverlap(user1, user2),
      personality: this.calculatePersonalityCompatibility(user1, user2),
      learningStyle: this.calculateLearningStyleMatch(user1, user2),
      language: user1.language === user2.language ? 1 : 0.5,
      timezone: this.calculateTimezoneCompatibility(user1, user2)
    };
    
    // Use neural network for final compatibility prediction
    const neuralInput = Object.values(factors);
    let neuralScore = 0.5;
    
    if (this.feedbackData.length > 50) {
      try {
        const prediction = this.compatibilityPredictor.run(neuralInput);
        neuralScore = prediction[0];
      } catch (error) {
        console.error('Neural prediction error:', error);
      }
    }
    
    // Weighted average with neural prediction
    const weightedScore = 
      factors.learningGoals * this.config.learningGoalWeight +
      factors.skillLevel * this.config.skillLevelWeight +
      factors.interests * this.config.interestWeight +
      factors.availability * this.config.availabilityWeight +
      factors.personality * this.config.personalityWeight +
      factors.learningStyle * 0.1 +
      factors.language * 0.05 +
      factors.timezone * 0.05;
    
    // Combine weighted and neural scores
    const finalScore = this.feedbackData.length > 50 
      ? (weightedScore * 0.7 + neuralScore * 0.3)
      : weightedScore;
    
    return Math.min(Math.max(finalScore, 0), 1);
  }

  /**
   * Calculate learning goal alignment
   */
  calculateLearningGoalAlignment(user1, user2) {
    const goals1 = new Set(user1.learningGoals.map(g => g.toLowerCase()));
    const goals2 = new Set(user2.learningGoals.map(g => g.toLowerCase()));
    
    // Check for complementary goals (one can teach what other wants to learn)
    let complementaryScore = 0;
    for (const goal of goals1) {
      for (const skill of user2.skills) {
        if (skill.name.toLowerCase().includes(goal)) {
          complementaryScore += skill.level / 5;
        }
      }
    }
    
    for (const goal of goals2) {
      for (const skill of user1.skills) {
        if (skill.name.toLowerCase().includes(goal)) {
          complementaryScore += skill.level / 5;
        }
      }
    }
    
    // Check for shared goals
    const sharedGoals = [...goals1].filter(g => goals2.has(g));
    const sharedScore = sharedGoals.length / Math.max(goals1.size, goals2.size);
    
    return Math.min((complementaryScore + sharedScore) / 2, 1);
  }

  /**
   * Calculate skill level compatibility
   */
  calculateSkillLevelCompatibility(user1, user2) {
    // Find overlapping skills
    const skills1Map = new Map(user1.skills.map(s => [s.name.toLowerCase(), s.level]));
    const skills2Map = new Map(user2.skills.map(s => [s.name.toLowerCase(), s.level]));
    
    let compatibilitySum = 0;
    let skillCount = 0;
    
    // Check each skill pair
    for (const [skill, level1] of skills1Map) {
      if (skills2Map.has(skill)) {
        const level2 = skills2Map.get(skill);
        const diff = Math.abs(level1 - level2);
        
        // Ideal difference is 1-2 levels (one can help the other)
        if (diff >= 1 && diff <= 2) {
          compatibilitySum += 1;
        } else if (diff === 0) {
          compatibilitySum += 0.7; // Same level - can practice together
        } else if (diff > 3) {
          compatibilitySum += 0.3; // Too large gap
        } else {
          compatibilitySum += 0.5;
        }
        skillCount++;
      }
    }
    
    // Also consider complementary skills
    const complementaryBonus = this.calculateComplementarySkills(user1, user2);
    
    return skillCount > 0 
      ? (compatibilitySum / skillCount) * 0.7 + complementaryBonus * 0.3
      : complementaryBonus;
  }

  /**
   * Calculate interest similarity using embeddings
   */
  calculateInterestSimilarity(user1, user2) {
    if (!user1.interestEmbeddings || !user2.interestEmbeddings) {
      // Fallback to simple set intersection
      const interests1 = new Set(user1.interests.map(i => i.toLowerCase()));
      const interests2 = new Set(user2.interests.map(i => i.toLowerCase()));
      const intersection = [...interests1].filter(i => interests2.has(i));
      
      return intersection.length / Math.max(interests1.size, interests2.size);
    }
    
    // Calculate cosine similarity between embeddings
    return this.cosineSimilarity(user1.interestEmbeddings, user2.interestEmbeddings);
  }

  /**
   * Calculate availability overlap
   */
  calculateAvailabilityOverlap(user1, user2) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let totalOverlap = 0;
    let dayCount = 0;
    
    for (const day of days) {
      const slots1 = user1.availability[day] || [];
      const slots2 = user2.availability[day] || [];
      
      if (slots1.length > 0 && slots2.length > 0) {
        const overlap = this.calculateTimeSlotOverlap(slots1, slots2, user1.timezone, user2.timezone);
        totalOverlap += overlap;
        dayCount++;
      }
    }
    
    return dayCount > 0 ? totalOverlap / dayCount : 0;
  }

  /**
   * Calculate personality compatibility
   */
  calculatePersonalityCompatibility(user1, user2) {
    if (!user1.personality || !user2.personality) return 0.5;
    
    // Using simplified Big Five model
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    let compatibility = 0;
    
    for (const trait of traits) {
      const diff = Math.abs((user1.personality[trait] || 0.5) - (user2.personality[trait] || 0.5));
      
      // Some differences are good (complementary), others should be similar
      if (trait === 'extraversion') {
        // Complementary is good for extraversion
        compatibility += diff > 0.3 && diff < 0.7 ? 1 : 0.5;
      } else {
        // Similar is better for other traits
        compatibility += 1 - diff;
      }
    }
    
    return compatibility / traits.length;
  }

  /**
   * Calculate learning style compatibility
   */
  calculateLearningStyleMatch(user1, user2) {
    if (!user1.learningStyle || !user2.learningStyle) return 0.5;
    
    const styles = ['visual', 'auditory', 'kinesthetic', 'reading'];
    let matchScore = 0;
    
    for (const style of styles) {
      const score1 = user1.learningStyle[style] || 0;
      const score2 = user2.learningStyle[style] || 0;
      
      // Similar learning styles are beneficial
      matchScore += 1 - Math.abs(score1 - score2);
    }
    
    return matchScore / styles.length;
  }

  /**
   * Calculate timezone compatibility
   */
  calculateTimezoneCompatibility(user1, user2) {
    // Get timezone offset difference
    const offset1 = this.getTimezoneOffset(user1.timezone);
    const offset2 = this.getTimezoneOffset(user2.timezone);
    const hourDiff = Math.abs(offset1 - offset2);
    
    // Score based on hour difference
    if (hourDiff <= 3) return 1;
    if (hourDiff <= 6) return 0.7;
    if (hourDiff <= 9) return 0.4;
    return 0.2;
  }

  /**
   * Generate matching reasoning explanation
   */
  async generateMatchReasoning(user1, user2, score) {
    const reasons = [];
    
    // Learning goals
    const goalAlignment = this.calculateLearningGoalAlignment(user1, user2);
    if (goalAlignment > 0.7) {
      reasons.push({
        category: 'goals',
        strength: 'strong',
        description: `Complementary learning goals - ${user2.userId} can help with ${user1.learningGoals[0]}`
      });
    }
    
    // Skills
    const skillMatch = this.findBestSkillMatches(user1, user2);
    if (skillMatch.length > 0) {
      reasons.push({
        category: 'skills',
        strength: 'strong',
        description: `Great skill exchange opportunity in ${skillMatch[0].skill}`
      });
    }
    
    // Interests
    const sharedInterests = user1.interests.filter(i => 
      user2.interests.some(i2 => i2.toLowerCase() === i.toLowerCase())
    );
    if (sharedInterests.length > 0) {
      reasons.push({
        category: 'interests',
        strength: 'medium',
        description: `Shared interests in ${sharedInterests.slice(0, 2).join(', ')}`
      });
    }
    
    // Availability
    const availabilityScore = this.calculateAvailabilityOverlap(user1, user2);
    if (availabilityScore > 0.6) {
      reasons.push({
        category: 'availability',
        strength: 'medium',
        description: 'Good schedule compatibility'
      });
    }
    
    return {
      score,
      topReasons: reasons.slice(0, 3),
      matchType: this.categorizeMatch(user1, user2),
      confidence: this.calculateConfidence(user1, user2)
    };
  }

  /**
   * Suggest activities for matched users
   */
  async suggestActivities(user1, user2) {
    const activities = [];
    
    // Skill exchange activities
    const skillExchanges = this.findBestSkillMatches(user1, user2);
    for (const exchange of skillExchanges.slice(0, 2)) {
      activities.push({
        type: 'skill_exchange',
        title: `${exchange.skill} Knowledge Exchange`,
        description: `${exchange.teacher} shares ${exchange.skill} expertise`,
        duration: 60,
        format: 'video_call'
      });
    }
    
    // Project collaboration
    const sharedInterests = user1.interests.filter(i => 
      user2.interests.some(i2 => i2.toLowerCase() === i.toLowerCase())
    );
    if (sharedInterests.length > 0) {
      activities.push({
        type: 'project',
        title: `Collaborative ${sharedInterests[0]} Project`,
        description: 'Work together on a small project',
        duration: 120,
        format: 'ongoing'
      });
    }
    
    // Study sessions
    const sharedGoals = user1.learningGoals.filter(g =>
      user2.learningGoals.some(g2 => g2.toLowerCase() === g.toLowerCase())
    );
    if (sharedGoals.length > 0) {
      activities.push({
        type: 'study_session',
        title: `${sharedGoals[0]} Study Group`,
        description: 'Learn together with shared resources',
        duration: 90,
        format: 'video_call'
      });
    }
    
    // Peer review
    activities.push({
      type: 'peer_review',
      title: 'Code/Work Review Session',
      description: 'Exchange feedback on recent work',
      duration: 45,
      format: 'async'
    });
    
    return activities;
  }

  /**
   * Predict learning outcome from match
   */
  async predictLearningOutcome(user1, user2) {
    const factors = {
      skillGap: this.calculateOptimalSkillGap(user1, user2),
      engagement: (user1.stats.responseRate + user2.stats.responseRate) / 2,
      experience: (user1.experience + user2.experience) / 2,
      compatibility: await this.calculateCompatibility(user1.userId, user2.userId)
    };
    
    const outcomeScore = 
      factors.skillGap * 0.3 +
      factors.engagement * 0.2 +
      factors.experience * 0.2 +
      factors.compatibility * 0.3;
    
    return {
      score: outcomeScore,
      level: outcomeScore > 0.8 ? 'excellent' : outcomeScore > 0.6 ? 'good' : 'moderate',
      estimatedProgress: {
        user1: this.estimateSkillProgress(user1, user2),
        user2: this.estimateSkillProgress(user2, user1)
      },
      recommendedDuration: outcomeScore > 0.7 ? 'long-term' : 'short-term'
    };
  }

  /**
   * Process feedback on matches
   */
  async processFeedback(userId, matchId, feedback) {
    const match = this.matchHistory.get(`${userId}-${matchId}`);
    if (!match) return;
    
    // Store feedback
    this.feedbackData.push({
      userId,
      matchId,
      compatibility: match.compatibility,
      feedback: feedback.rating,
      success: feedback.success,
      duration: feedback.duration,
      timestamp: Date.now()
    });
    
    // Update user stats
    const userProfile = this.userProfiles.get(userId);
    if (userProfile) {
      userProfile.stats.totalMatches++;
      if (feedback.success) {
        userProfile.stats.successfulMatches++;
      }
      userProfile.stats.averageRating = 
        (userProfile.stats.averageRating * (userProfile.stats.totalMatches - 1) + feedback.rating) / 
        userProfile.stats.totalMatches;
    }
    
    // Retrain neural network if enough feedback
    if (this.feedbackData.length % 50 === 0) {
      await this.retrainCompatibilityModel();
    }
    
    this.emit('feedbackProcessed', {
      userId,
      matchId,
      feedback,
      modelUpdated: this.feedbackData.length % 50 === 0
    });
  }

  /**
   * Helper methods
   */
  async enrichProfile(profileData) {
    // This would connect to external services or AI to enrich profile data
    return {
      ...profileData,
      skills: profileData.skills || [],
      interests: profileData.interests || [],
      learningGoals: profileData.learningGoals || []
    };
  }

  async analyzePersonality(profileData) {
    // Simplified personality analysis based on user data
    return {
      openness: 0.7,
      conscientiousness: 0.6,
      extraversion: 0.5,
      agreeableness: 0.8,
      neuroticism: 0.3
    };
  }

  async identifyLearningStyle(profileData) {
    // Analyze learning style from user behavior
    return {
      visual: 0.4,
      auditory: 0.3,
      kinesthetic: 0.2,
      reading: 0.1
    };
  }

  calculateExperience(profileData) {
    // Calculate overall experience level
    if (!profileData.skills) return 0.5;
    
    const avgSkillLevel = profileData.skills.reduce((sum, skill) => 
      sum + (skill.level || 0), 0) / Math.max(profileData.skills.length, 1);
    
    return avgSkillLevel / 5; // Normalize to 0-1
  }

  async generateSkillEmbeddings(skills) {
    // Generate embeddings for skills (simplified)
    return skills.map(skill => skill.level || 0);
  }

  async generateInterestEmbeddings(interests) {
    // Generate embeddings for interests (simplified)
    return interests.map((_, index) => index / interests.length);
  }

  async getCandidates(userId, options) {
    const candidates = [];
    const userProfile = this.userProfiles.get(userId);
    
    // Get all other users
    for (const [candidateId, profile] of this.userProfiles) {
      if (candidateId === userId) continue;
      
      // Basic filtering
      if (options.mustMatch) {
        let matches = true;
        for (const [key, value] of Object.entries(options.mustMatch)) {
          if (profile[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }
      
      // Check if not recently matched
      const recentMatch = this.checkRecentMatch(userId, candidateId);
      if (recentMatch) continue;
      
      candidates.push(candidateId);
    }
    
    // Use clustering to find similar users if available
    if (this.interestClusters && userProfile.clusterAssignment) {
      const clusterCandidates = this.getClusterCandidates(
        userId,
        userProfile.clusterAssignment
      );
      // Prioritize cluster candidates
      return [...new Set([...clusterCandidates, ...candidates])];
    }
    
    return candidates;
  }

  checkRecentMatch(userId1, userId2) {
    const key1 = `${userId1}-${userId2}`;
    const key2 = `${userId2}-${userId1}`;
    const match1 = this.matchHistory.get(key1);
    const match2 = this.matchHistory.get(key2);
    
    const recentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();
    
    return (match1 && now - match1.timestamp < recentThreshold) ||
           (match2 && now - match2.timestamp < recentThreshold);
  }

  calculateComplementarySkills(user1, user2) {
    let complementaryScore = 0;
    let count = 0;
    
    // Check if user1's goals match user2's skills
    for (const goal of user1.learningGoals) {
      for (const skill of user2.skills) {
        if (skill.name.toLowerCase().includes(goal.toLowerCase()) && skill.level >= 3) {
          complementaryScore += skill.level / 5;
          count++;
        }
      }
    }
    
    // Check if user2's goals match user1's skills
    for (const goal of user2.learningGoals) {
      for (const skill of user1.skills) {
        if (skill.name.toLowerCase().includes(goal.toLowerCase()) && skill.level >= 3) {
          complementaryScore += skill.level / 5;
          count++;
        }
      }
    }
    
    return count > 0 ? complementaryScore / count : 0;
  }

  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
    
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

  calculateTimeSlotOverlap(slots1, slots2, timezone1, timezone2) {
    // Convert slots to common timezone and calculate overlap
    // Simplified version - assumes slots are in format { start: "HH:MM", end: "HH:MM" }
    let totalOverlap = 0;
    
    for (const slot1 of slots1) {
      for (const slot2 of slots2) {
        const overlap = this.getSlotOverlap(slot1, slot2, timezone1, timezone2);
        totalOverlap += overlap;
      }
    }
    
    return Math.min(totalOverlap / Math.max(slots1.length, slots2.length), 1);
  }

  getSlotOverlap(slot1, slot2, timezone1, timezone2) {
    // Simplified overlap calculation
    return 0.5; // Placeholder
  }

  getTimezoneOffset(timezone) {
    // Get timezone offset in hours
    const offsets = {
      'UTC': 0,
      'EST': -5,
      'CST': -6,
      'MST': -7,
      'PST': -8,
      'CET': 1,
      'JST': 9
    };
    
    return offsets[timezone] || 0;
  }

  findBestSkillMatches(user1, user2) {
    const matches = [];
    
    // Find skills user1 can teach user2
    for (const goal of user2.learningGoals) {
      const matchingSkill = user1.skills.find(s => 
        s.name.toLowerCase().includes(goal.toLowerCase()) && s.level >= 3
      );
      if (matchingSkill) {
        matches.push({
          skill: matchingSkill.name,
          teacher: user1.userId,
          learner: user2.userId,
          teacherLevel: matchingSkill.level,
          value: matchingSkill.level / 5
        });
      }
    }
    
    // Find skills user2 can teach user1
    for (const goal of user1.learningGoals) {
      const matchingSkill = user2.skills.find(s => 
        s.name.toLowerCase().includes(goal.toLowerCase()) && s.level >= 3
      );
      if (matchingSkill) {
        matches.push({
          skill: matchingSkill.name,
          teacher: user2.userId,
          learner: user1.userId,
          teacherLevel: matchingSkill.level,
          value: matchingSkill.level / 5
        });
      }
    }
    
    return matches.sort((a, b) => b.value - a.value);
  }

  categorizeMatch(user1, user2) {
    const skillMatches = this.findBestSkillMatches(user1, user2);
    
    if (skillMatches.length >= 2 && 
        skillMatches.some(m => m.teacher === user1.userId) &&
        skillMatches.some(m => m.teacher === user2.userId)) {
      return 'mutual_learning';
    }
    
    if (skillMatches.length > 0 && skillMatches[0].teacherLevel >= 4) {
      return 'mentorship';
    }
    
    const sharedGoals = user1.learningGoals.filter(g =>
      user2.learningGoals.some(g2 => g2.toLowerCase() === g.toLowerCase())
    );
    if (sharedGoals.length > 0) {
      return 'study_buddy';
    }
    
    return 'peer_learning';
  }

  calculateConfidence(user1, user2) {
    // Calculate confidence based on profile completeness and history
    const profileCompleteness = (
      (user1.skills.length > 0 ? 0.2 : 0) +
      (user1.interests.length > 0 ? 0.2 : 0) +
      (user1.learningGoals.length > 0 ? 0.2 : 0) +
      (user1.personality ? 0.2 : 0) +
      (user1.stats.totalMatches > 0 ? 0.2 : 0)
    );
    
    const historyFactor = Math.min(user1.stats.totalMatches / 10, 1) * 0.5 +
                         Math.min(user2.stats.totalMatches / 10, 1) * 0.5;
    
    return profileCompleteness * 0.6 + historyFactor * 0.4;
  }

  calculateOptimalSkillGap(user1, user2) {
    const skillMatches = this.findBestSkillMatches(user1, user2);
    if (skillMatches.length === 0) return 0;
    
    let optimalGapScore = 0;
    for (const match of skillMatches) {
      const learnerSkill = match.learner === user1.userId
        ? user1.skills.find(s => s.name.toLowerCase() === match.skill.toLowerCase())
        : user2.skills.find(s => s.name.toLowerCase() === match.skill.toLowerCase());
      
      const learnerLevel = learnerSkill ? learnerSkill.level : 0;
      const gap = match.teacherLevel - learnerLevel;
      
      // Optimal gap is 1-2 levels
      if (gap >= 1 && gap <= 2) {
        optimalGapScore += 1;
      } else if (gap === 3) {
        optimalGapScore += 0.7;
      } else {
        optimalGapScore += 0.3;
      }
    }
    
    return optimalGapScore / skillMatches.length;
  }

  estimateSkillProgress(learner, teacher) {
    const relevantSkills = teacher.skills.filter(skill =>
      learner.learningGoals.some(goal => 
        skill.name.toLowerCase().includes(goal.toLowerCase())
      )
    );
    
    if (relevantSkills.length === 0) return { skills: [], overall: 0 };
    
    const progressEstimates = relevantSkills.map(skill => {
      const currentLevel = learner.skills.find(s => 
        s.name.toLowerCase() === skill.name.toLowerCase()
      )?.level || 0;
      
      const potentialGain = Math.min(
        (skill.level - currentLevel) * 0.3,
        1
      );
      
      return {
        skill: skill.name,
        currentLevel,
        potentialLevel: currentLevel + potentialGain,
        gain: potentialGain
      };
    });
    
    const overallGain = progressEstimates.reduce((sum, p) => sum + p.gain, 0) / 
                       progressEstimates.length;
    
    return {
      skills: progressEstimates,
      overall: overallGain
    };
  }

  sanitizeProfile(profile) {
    // Return only public information
    return {
      userId: profile.userId,
      skills: profile.skills,
      interests: profile.interests,
      learningGoals: profile.learningGoals,
      timezone: profile.timezone,
      language: profile.language,
      stats: {
        successfulMatches: profile.stats.successfulMatches,
        averageRating: profile.stats.averageRating
      }
    };
  }

  storeMatches(userId, matches) {
    for (const match of matches) {
      const key = `${userId}-${match.userId}`;
      this.matchHistory.set(key, {
        ...match,
        timestamp: Date.now()
      });
    }
    
    this.activeMatches.set(userId, matches);
  }

  async updateClusters() {
    // Update interest and skill clusters using k-means
    const userArray = Array.from(this.userProfiles.values());
    
    if (userArray.length < 10) return;
    
    // Cluster by interests
    const interestVectors = userArray.map(u => u.interestEmbeddings || []);
    if (interestVectors[0]?.length > 0) {
      const interestClustering = kmeans(interestVectors, Math.min(5, Math.floor(userArray.length / 10)));
      this.interestClusters = interestClustering;
      
      // Assign clusters to users
      userArray.forEach((user, index) => {
        user.clusterAssignment = interestClustering.clusters[index];
      });
    }
  }

  getClusterCandidates(userId, clusterAssignment) {
    const candidates = [];
    
    for (const [candidateId, profile] of this.userProfiles) {
      if (candidateId === userId) continue;
      if (profile.clusterAssignment === clusterAssignment) {
        candidates.push(candidateId);
      }
    }
    
    return candidates;
  }

  async retrainCompatibilityModel() {
    if (this.feedbackData.length < 50) return;
    
    // Prepare training data
    const trainingData = this.feedbackData.map(feedback => {
      const user1 = this.userProfiles.get(feedback.userId);
      const user2 = this.userProfiles.get(feedback.matchId);
      
      if (!user1 || !user2) return null;
      
      const input = [
        this.calculateLearningGoalAlignment(user1, user2),
        this.calculateSkillLevelCompatibility(user1, user2),
        this.calculateInterestSimilarity(user1, user2),
        this.calculateAvailabilityOverlap(user1, user2),
        this.calculatePersonalityCompatibility(user1, user2),
        this.calculateLearningStyleMatch(user1, user2),
        user1.language === user2.language ? 1 : 0.5,
        this.calculateTimezoneCompatibility(user1, user2)
      ];
      
      const output = [feedback.success ? feedback.rating / 5 : 0];
      
      return { input, output };
    }).filter(data => data !== null);
    
    // Train the neural network
    this.compatibilityPredictor.train(trainingData, {
      iterations: 2000,
      errorThresh: 0.005
    });
    
    console.log('Compatibility model retrained with', trainingData.length, 'samples');
  }

  /**
   * Start automatic matching cycle
   */
  startMatchingCycle() {
    if (this.matchingInterval) return;
    
    this.matchingInterval = setInterval(async () => {
      const users = Array.from(this.userProfiles.keys());
      
      for (const userId of users) {
        try {
          await this.findMatches(userId, { limit: 3 });
        } catch (error) {
          console.error(`Matching error for user ${userId}:`, error);
        }
      }
      
      this.emit('matchingCycleComplete', {
        usersProcessed: users.length,
        timestamp: Date.now()
      });
    }, this.config.matchingInterval);
  }

  /**
   * Stop matching cycle
   */
  stopMatchingCycle() {
    if (this.matchingInterval) {
      clearInterval(this.matchingInterval);
      this.matchingInterval = null;
    }
  }
}