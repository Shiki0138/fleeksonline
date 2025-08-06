'use client';

import { useEffect, useState } from 'react';
import { useAIStore } from '@/store/aiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, Heart, ShoppingBag, Star } from 'lucide-react';

interface UISection {
  id: string;
  name: string;
  icon: any;
  priority: number;
  interactions: number;
  lastInteraction: number;
}

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  confidence: number;
  action: () => void;
}

export default function AdaptiveUI({ children }: { children: React.ReactNode }) {
  const { 
    preferences, 
    learnUserBehavior, 
    predictUserIntent,
    updatePreferences 
  } = useAIStore();

  const [uiSections, setUiSections] = useState<UISection[]>([
    { id: 'trending', name: 'Trending', icon: TrendingUp, priority: 1, interactions: 0, lastInteraction: 0 },
    { id: 'favorites', name: 'Favorites', icon: Heart, priority: 2, interactions: 0, lastInteraction: 0 },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBag, priority: 3, interactions: 0, lastInteraction: 0 },
    { id: 'reviews', name: 'Reviews', icon: Star, priority: 4, interactions: 0, lastInteraction: 0 },
  ]);

  const [recommendations, setRecommendations] = useState<RecommendedAction[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(false);

  // Analyze user behavior patterns
  useEffect(() => {
    const analyzePatterns = () => {
      const patterns = localStorage.getItem('userPatterns') || '[]';
      const parsedPatterns = JSON.parse(patterns);
      
      if (parsedPatterns.length < 5) return;

      // Count interactions by section
      const sectionCounts: Record<string, number> = {};
      const recentInteractions: Record<string, number> = {};
      
      parsedPatterns.forEach((pattern: any) => {
        if (pattern.action.includes('section-')) {
          const sectionId = pattern.action.replace('section-', '');
          sectionCounts[sectionId] = (sectionCounts[sectionId] || 0) + 1;
          recentInteractions[sectionId] = pattern.timestamp;
        }
      });

      // Update UI sections based on usage
      setUiSections(prev => {
        const updated = prev.map(section => ({
          ...section,
          interactions: sectionCounts[section.id] || 0,
          lastInteraction: recentInteractions[section.id] || 0,
        }));

        // Sort by interactions (most used first)
        return updated.sort((a, b) => b.interactions - a.interactions);
      });

      // Generate recommendations
      generateRecommendations(parsedPatterns);
    };

    const interval = setInterval(analyzePatterns, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateRecommendations = (patterns: any[]) => {
    const newRecommendations: RecommendedAction[] = [];
    
    // Time-based recommendations
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';
    
    // Analyze recent actions
    const recentActions = patterns.slice(-20);
    const actionTypes = recentActions.map(p => p.action);
    
    // Product viewing pattern
    const productViews = actionTypes.filter(a => a.includes('product-view')).length;
    if (productViews > 5) {
      newRecommendations.push({
        id: 'checkout-reminder',
        title: 'Ready to checkout?',
        description: `You've viewed ${productViews} products. Would you like to see your cart?`,
        confidence: 0.85,
        action: () => learnUserBehavior('recommendation-click', { type: 'checkout' })
      });
    }

    // Time-based skincare recommendation
    if (timeOfDay === 'morning' || timeOfDay === 'evening') {
      newRecommendations.push({
        id: 'skincare-routine',
        title: `${timeOfDay === 'morning' ? 'Morning' : 'Evening'} Skincare Routine`,
        description: `Perfect time for your ${timeOfDay} skincare routine!`,
        confidence: 0.75,
        action: () => learnUserBehavior('recommendation-click', { type: 'skincare-routine' })
      });
    }

    // Preference-based recommendations
    if (preferences.skinTone && preferences.favoriteProducts.length > 0) {
      newRecommendations.push({
        id: 'personalized-products',
        title: 'Curated for You',
        description: `Products matched to your ${preferences.skinTone} skin tone`,
        confidence: 0.9,
        action: () => learnUserBehavior('recommendation-click', { type: 'personalized' })
      });
    }

    setRecommendations(newRecommendations.slice(0, 3));
  };

  const handleSectionClick = (sectionId: string) => {
    learnUserBehavior(`section-${sectionId}`, { timestamp: Date.now() });
  };

  return (
    <div className="relative min-h-screen">
      {/* AI Insights Toggle */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setShowAIInsights(!showAIInsights)}
        className="fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        <Brain className="w-5 h-5 text-white" />
      </motion.button>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {showAIInsights && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl z-40 p-6 overflow-y-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">AI Insights</h2>
              </div>

              {/* Adaptive Sections */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white/70">Your Most Used Sections</h3>
                {uiSections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/20 transition"
                    onClick={() => handleSectionClick(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <section.icon className="w-5 h-5 text-pink-400" />
                        <span className="text-white">{section.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/50">{section.interactions} visits</p>
                        <div className="w-16 h-1 bg-white/20 rounded-full mt-1">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                            style={{ width: `${Math.min(section.interactions * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-sm font-medium text-white/70">AI Recommendations</h3>
                </div>
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 cursor-pointer hover:from-purple-600/30 hover:to-pink-600/30 transition"
                    onClick={rec.action}
                  >
                    <h4 className="text-white font-medium mb-1">{rec.title}</h4>
                    <p className="text-white/70 text-sm mb-2">{rec.description}</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-1 bg-white/20 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full"
                          style={{ width: `${rec.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/50">{Math.round(rec.confidence * 100)}% match</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* User Preferences */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white/70">Learned Preferences</h3>
                <div className="bg-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Theme</span>
                    <span className="text-white text-sm capitalize">{preferences.theme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Language</span>
                    <span className="text-white text-sm uppercase">{preferences.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Voice Control</span>
                    <span className="text-white text-sm">{preferences.voiceEnabled ? 'On' : 'Off'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70 text-sm">Gestures</span>
                    <span className="text-white text-sm">{preferences.gesturesEnabled ? 'On' : 'Off'}</span>
                  </div>
                  {preferences.skinTone && (
                    <div className="flex justify-between">
                      <span className="text-white/70 text-sm">Skin Tone</span>
                      <span className="text-white text-sm">{preferences.skinTone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content with adaptive layout */}
      <motion.div
        animate={{ marginLeft: showAIInsights ? 320 : 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  );
}