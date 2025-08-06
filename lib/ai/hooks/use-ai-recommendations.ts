import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';

interface Recommendation {
  id: string;
  type: string;
  score: number;
  reason: string;
  metadata: any;
}

interface UseAIRecommendationsOptions {
  type?: 'videos' | 'creators' | 'playlists' | 'mixed';
  limit?: number;
  autoFetch?: boolean;
  context?: {
    currentVideoId?: string;
    mood?: string;
    timeOfDay?: string;
    device?: string;
  };
}

export function useAIRecommendations(options: UseAIRecommendationsOptions = {}) {
  const { user } = useUser();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [strategy, setStrategy] = useState<string>('');

  const fetchRecommendations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('ai-recommendations', {
        body: {
          userId: user.id,
          type: options.type || 'mixed',
          limit: options.limit || 20,
          context: options.context,
        },
      });

      if (fetchError) throw fetchError;

      setRecommendations(data.recommendations);
      setStrategy(data.strategy);
      
      return data.recommendations;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.id, options.type, options.limit, options.context]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (options.autoFetch && user?.id) {
      fetchRecommendations();
    }
  }, [options.autoFetch, user?.id]);

  const trackInteraction = useCallback(async (
    recommendationId: string,
    interactionType: 'view' | 'like' | 'share' | 'skip'
  ) => {
    if (!user?.id) return;

    try {
      await supabase.from('recommendation_interactions').insert({
        user_id: user.id,
        recommendation_id: recommendationId,
        interaction_type: interactionType,
        strategy,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  }, [user?.id, strategy]);

  const refreshRecommendations = useCallback(() => {
    return fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    strategy,
    fetchRecommendations,
    refreshRecommendations,
    trackInteraction,
  };
}