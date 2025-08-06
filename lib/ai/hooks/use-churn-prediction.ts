import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/use-user';

interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    impact: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  retentionActions: Array<{
    action: string;
    priority: number;
    expectedImpact: number;
  }>;
  predictedChurnDate?: string;
}

export function useChurnPrediction() {
  const { user } = useUser();
  const [prediction, setPrediction] = useState<ChurnPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchChurnPrediction = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: predictionError } = await supabase.functions.invoke('ai-analytics', {
        body: {
          type: 'churn_prediction',
          userId: targetUserId,
          options: {
            includeRecommendations: true,
          },
        },
      });

      if (predictionError) throw predictionError;

      setPrediction(data);
      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const applyRetentionAction = useCallback(async (action: string) => {
    if (!user?.id || !prediction) return;

    try {
      // Log retention action
      await supabase.from('retention_actions').insert({
        user_id: user.id,
        action,
        churn_probability: prediction.churnProbability,
        risk_level: prediction.riskLevel,
        applied_at: new Date().toISOString(),
      });

      // Trigger specific retention campaigns
      switch (action) {
        case 'Send personalized re-engagement email':
          await supabase.functions.invoke('send-retention-email', {
            body: { userId: user.id, type: 're-engagement' },
          });
          break;
        
        case 'Offer special discount or free month':
          await supabase.functions.invoke('apply-retention-offer', {
            body: { userId: user.id, offerType: 'discount' },
          });
          break;
        
        case 'Send push notifications with trending content':
          await supabase.functions.invoke('send-content-notifications', {
            body: { userId: user.id, contentType: 'trending' },
          });
          break;
      }

      return true;
    } catch (err) {
      console.error('Failed to apply retention action:', err);
      return false;
    }
  }, [user?.id, prediction]);

  // Auto-fetch prediction on mount
  useEffect(() => {
    if (user?.id) {
      fetchChurnPrediction();
    }
  }, [user?.id]);

  return {
    prediction,
    loading,
    error,
    fetchChurnPrediction,
    applyRetentionAction,
  };
}