import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecommendationRequest {
  userId: string;
  type: 'videos' | 'creators' | 'playlists' | 'mixed';
  limit?: number;
  context?: {
    currentVideoId?: string;
    mood?: string;
    timeOfDay?: string;
    device?: string;
  };
}

interface RecommendationResponse {
  userId: string;
  recommendations: Array<{
    id: string;
    type: string;
    score: number;
    reason: string;
    metadata: any;
  }>;
  strategy: string;
  timestamp: string;
}

// Recommendation strategies
const STRATEGIES = {
  COLLABORATIVE: 'collaborative_filtering',
  CONTENT_BASED: 'content_based',
  HYBRID: 'hybrid',
  TRENDING: 'trending',
  PERSONALIZED: 'personalized',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, type, limit = 20, context = {} } = await req.json() as RecommendationRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile and preferences
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*, preferences:user_preferences(*)')
      .eq('id', userId)
      .single();

    // Get user interaction history
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Choose recommendation strategy
    const strategy = selectStrategy(userProfile, interactions, context);

    // Generate recommendations based on strategy
    let recommendations: any[] = [];

    switch (strategy) {
      case STRATEGIES.COLLABORATIVE:
        recommendations = await collaborativeFiltering(supabase, userId, type, limit);
        break;
      
      case STRATEGIES.CONTENT_BASED:
        recommendations = await contentBasedFiltering(supabase, userId, userProfile, type, limit);
        break;
      
      case STRATEGIES.HYBRID:
        recommendations = await hybridRecommendations(supabase, userId, userProfile, type, limit);
        break;
      
      case STRATEGIES.TRENDING:
        recommendations = await trendingRecommendations(supabase, type, limit, context);
        break;
      
      case STRATEGIES.PERSONALIZED:
        recommendations = await personalizedRecommendations(supabase, userId, userProfile, context, type, limit);
        break;
    }

    // Apply real-time adjustments
    recommendations = await applyRealTimeAdjustments(recommendations, context);

    // Store recommendations for analytics
    await supabase.from('recommendation_logs').insert({
      user_id: userId,
      recommendations: recommendations.map(r => r.id),
      strategy,
      context,
      created_at: new Date().toISOString(),
    });

    const response: RecommendationResponse = {
      userId,
      recommendations,
      strategy,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Select best recommendation strategy
function selectStrategy(userProfile: any, interactions: any[], context: any): string {
  // New users with few interactions
  if (!interactions || interactions.length < 10) {
    return STRATEGIES.TRENDING;
  }

  // Users with strong preferences
  if (userProfile?.preferences?.categories?.length > 3) {
    return STRATEGIES.CONTENT_BASED;
  }

  // Context-aware recommendations
  if (context.currentVideoId || context.mood) {
    return STRATEGIES.PERSONALIZED;
  }

  // Default to hybrid for best results
  return STRATEGIES.HYBRID;
}

// Collaborative filtering using user similarity
async function collaborativeFiltering(
  supabase: any,
  userId: string,
  type: string,
  limit: number
): Promise<any[]> {
  try {
    // Find similar users based on interaction patterns
    const { data: similarUsers } = await supabase.rpc('find_similar_users', {
      target_user_id: userId,
      limit: 50,
    });

    if (!similarUsers || similarUsers.length === 0) {
      return [];
    }

    // Get items liked by similar users
    const similarUserIds = similarUsers.map((u: any) => u.user_id);
    
    const { data: recommendations } = await supabase
      .from(`${type}_interactions`)
      .select(`
        ${type.slice(0, -1)}_id,
        count,
        avg_rating,
        ${type}!inner(*)
      `)
      .in('user_id', similarUserIds)
      .order('avg_rating', { ascending: false })
      .limit(limit * 2);

    // Calculate recommendation scores
    return recommendations
      .map((item: any) => ({
        id: item[`${type.slice(0, -1)}_id`],
        type: type.slice(0, -1),
        score: calculateCollaborativeScore(item, similarUsers),
        reason: 'Users with similar taste enjoyed this',
        metadata: item[type],
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Collaborative filtering error:', error);
    return [];
  }
}

// Content-based filtering using embeddings
async function contentBasedFiltering(
  supabase: any,
  userId: string,
  userProfile: any,
  type: string,
  limit: number
): Promise<any[]> {
  try {
    // Get user's content preferences
    const preferredCategories = userProfile?.preferences?.categories || [];
    const preferredTags = userProfile?.preferences?.tags || [];

    // Generate embedding for user preferences
    const userEmbedding = await generateUserEmbedding(preferredCategories, preferredTags);

    // Find similar content using vector similarity
    const { data: similarContent } = await supabase.rpc('match_content_embeddings', {
      query_embedding: userEmbedding,
      match_threshold: 0.7,
      match_count: limit * 2,
      content_type: type,
    });

    return similarContent
      .map((item: any) => ({
        id: item.id,
        type: type.slice(0, -1),
        score: item.similarity,
        reason: `Matches your interest in ${preferredCategories.join(', ')}`,
        metadata: item,
      }))
      .slice(0, limit);
  } catch (error) {
    console.error('Content-based filtering error:', error);
    return [];
  }
}

// Hybrid recommendations combining multiple strategies
async function hybridRecommendations(
  supabase: any,
  userId: string,
  userProfile: any,
  type: string,
  limit: number
): Promise<any[]> {
  const [collaborative, contentBased, trending] = await Promise.all([
    collaborativeFiltering(supabase, userId, type, Math.floor(limit * 0.4)),
    contentBasedFiltering(supabase, userId, userProfile, type, Math.floor(limit * 0.4)),
    trendingRecommendations(supabase, type, Math.floor(limit * 0.2), {}),
  ]);

  // Merge and deduplicate recommendations
  const merged = new Map();
  
  [...collaborative, ...contentBased, ...trending].forEach(rec => {
    if (!merged.has(rec.id)) {
      merged.set(rec.id, rec);
    } else {
      // Combine scores if duplicate
      const existing = merged.get(rec.id);
      existing.score = (existing.score + rec.score) / 2;
    }
  });

  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Trending recommendations
async function trendingRecommendations(
  supabase: any,
  type: string,
  limit: number,
  context: any
): Promise<any[]> {
  const timeWindow = context.timeOfDay === 'morning' ? '6 hours' : '24 hours';
  
  const { data: trending } = await supabase.rpc('get_trending_content', {
    content_type: type,
    time_window: timeWindow,
    limit: limit,
  });

  return trending.map((item: any) => ({
    id: item.id,
    type: type.slice(0, -1),
    score: item.trend_score,
    reason: 'Trending now',
    metadata: item,
  }));
}

// Personalized recommendations with context
async function personalizedRecommendations(
  supabase: any,
  userId: string,
  userProfile: any,
  context: any,
  type: string,
  limit: number
): Promise<any[]> {
  try {
    // Use AI to generate personalized recommendations
    const prompt = buildPersonalizationPrompt(userProfile, context);
    
    // Call Cohere for semantic understanding
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('COHERE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-light',
        prompt,
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const { generations } = await response.json();
    const preferences = parseAIPreferences(generations[0].text);

    // Query based on AI-generated preferences
    const { data: personalized } = await supabase
      .from(type)
      .select('*')
      .or(buildPreferenceQuery(preferences))
      .limit(limit);

    return personalized.map((item: any) => ({
      id: item.id,
      type: type.slice(0, -1),
      score: calculatePersonalizationScore(item, preferences, context),
      reason: `Perfect for your ${context.mood || 'current'} mood`,
      metadata: item,
    }));
  } catch (error) {
    console.error('Personalization error:', error);
    return [];
  }
}

// Helper functions
function calculateCollaborativeScore(item: any, similarUsers: any[]): number {
  const avgRating = item.avg_rating || 0;
  const popularity = Math.min(item.count / 100, 1);
  const userSimilarity = similarUsers[0]?.similarity || 0.5;
  
  return (avgRating * 0.5) + (popularity * 0.3) + (userSimilarity * 0.2);
}

async function generateUserEmbedding(categories: string[], tags: string[]): Promise<number[]> {
  const text = [...categories, ...tags].join(' ');
  
  // Use sentence transformers for embedding
  const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
    }),
  });

  return await response.json();
}

function buildPersonalizationPrompt(userProfile: any, context: any): string {
  return `Generate content preferences for a user with the following profile:
    - Interests: ${userProfile?.preferences?.categories?.join(', ') || 'general'}
    - Current mood: ${context.mood || 'neutral'}
    - Time of day: ${context.timeOfDay || 'anytime'}
    - Device: ${context.device || 'any'}
    
    Suggest 3-5 specific content attributes they would enjoy.`;
}

function parseAIPreferences(text: string): string[] {
  // Simple extraction of preferences from AI response
  return text.split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .slice(0, 5);
}

function buildPreferenceQuery(preferences: string[]): string {
  return preferences
    .map(pref => `tags.cs.{${pref}},description.ilike.%${pref}%`)
    .join(',');
}

function calculatePersonalizationScore(item: any, preferences: string[], context: any): number {
  let score = 0.5; // Base score
  
  // Check preference matches
  preferences.forEach(pref => {
    if (item.tags?.includes(pref) || item.description?.includes(pref)) {
      score += 0.1;
    }
  });
  
  // Context bonuses
  if (context.mood && item.mood_tags?.includes(context.mood)) {
    score += 0.2;
  }
  
  return Math.min(score, 1);
}

async function applyRealTimeAdjustments(
  recommendations: any[],
  context: any
): Promise<any[]> {
  // Apply time-based adjustments
  if (context.timeOfDay === 'morning') {
    // Boost energetic content
    recommendations.forEach(rec => {
      if (rec.metadata?.energy_level === 'high') {
        rec.score *= 1.2;
      }
    });
  }
  
  // Device-based adjustments
  if (context.device === 'mobile') {
    // Prefer shorter content
    recommendations.forEach(rec => {
      if (rec.metadata?.duration && rec.metadata.duration < 300) {
        rec.score *= 1.1;
      }
    });
  }
  
  return recommendations.sort((a, b) => b.score - a.score);
}