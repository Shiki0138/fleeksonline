import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase/client';

export type MembershipTier = 'free' | 'basic' | 'premium' | 'enterprise';

interface VideoAccessData {
  canAccess: boolean;
  remainingTime: number; // in seconds
  hasReachedLimit: boolean;
  userTier: MembershipTier;
  videoRequiredTier: MembershipTier;
}

interface UseVideoAccessProps {
  videoId: string;
  videoRequiredTier?: MembershipTier;
  videoDuration: number;
}

const PREVIEW_DURATION = 300; // 5 minutes in seconds

const tierHierarchy: Record<MembershipTier, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
};

export function useVideoAccess({
  videoId,
  videoRequiredTier = 'free',
  videoDuration,
}: UseVideoAccessProps): VideoAccessData & { updateWatchTime: (seconds: number) => Promise<void> } {
  const { supabase, user } = useSupabase();
  const [accessData, setAccessData] = useState<VideoAccessData>({
    canAccess: false,
    remainingTime: PREVIEW_DURATION,
    hasReachedLimit: false,
    userTier: 'free',
    videoRequiredTier,
  });
  const [watchedTime, setWatchedTime] = useState(0);

  useEffect(() => {
    if (user) {
      checkVideoAccess();
    }
  }, [user, videoId]);

  const checkVideoAccess = async () => {
    if (!user) {
      setAccessData({
        canAccess: true, // Allow preview for non-authenticated users
        remainingTime: PREVIEW_DURATION,
        hasReachedLimit: false,
        userTier: 'free',
        videoRequiredTier,
      });
      return;
    }

    try {
      // Get user's membership tier
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('membership_tier')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const userTier = (userData?.membership_tier || 'free') as MembershipTier;

      // Check if user's tier meets video requirements
      const canAccessFull = tierHierarchy[userTier] >= tierHierarchy[videoRequiredTier];

      // Get previous watch history for this video
      const { data: watchHistory, error: historyError } = await supabase
        .from('video_access_logs')
        .select('watch_duration')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (historyError && historyError.code !== 'PGRST116') throw historyError;

      const previousWatchTime = watchHistory?.[0]?.watch_duration || 0;
      setWatchedTime(previousWatchTime);

      if (canAccessFull) {
        // Full access for premium users
        setAccessData({
          canAccess: true,
          remainingTime: videoDuration,
          hasReachedLimit: false,
          userTier,
          videoRequiredTier,
        });
      } else {
        // Limited access for free users
        const remainingPreviewTime = Math.max(0, PREVIEW_DURATION - previousWatchTime);
        const hasReachedLimit = previousWatchTime >= PREVIEW_DURATION;

        setAccessData({
          canAccess: !hasReachedLimit,
          remainingTime: remainingPreviewTime,
          hasReachedLimit,
          userTier,
          videoRequiredTier,
        });
      }
    } catch (error) {
      console.error('Error checking video access:', error);
      // Default to preview access on error
      setAccessData({
        canAccess: true,
        remainingTime: PREVIEW_DURATION,
        hasReachedLimit: false,
        userTier: 'free',
        videoRequiredTier,
      });
    }
  };

  const updateWatchTime = async (seconds: number) => {
    if (!user || !videoId) return;

    try {
      const watchDuration = Math.min(seconds, accessData.userTier === 'free' ? PREVIEW_DURATION : videoDuration);
      
      await supabase.from('video_access_logs').insert({
        user_id: user.id,
        video_id: videoId,
        watch_duration: watchDuration,
        total_duration: videoDuration,
        watch_percentage: (watchDuration / videoDuration) * 100,
      });

      // Update local state
      setWatchedTime(watchDuration);
      
      if (accessData.userTier === 'free' && watchDuration >= PREVIEW_DURATION) {
        setAccessData(prev => ({
          ...prev,
          hasReachedLimit: true,
          canAccess: false,
          remainingTime: 0,
        }));
      }
    } catch (error) {
      console.error('Error updating watch time:', error);
    }
  };

  return {
    ...accessData,
    updateWatchTime,
  };
}