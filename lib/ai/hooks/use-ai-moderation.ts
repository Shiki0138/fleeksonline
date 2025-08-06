import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ModerationResult {
  decision: 'approved' | 'flagged' | 'rejected' | 'review_required';
  confidence: number;
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    details: string;
  }>;
  recommendations: string[];
}

interface UseAIModerationOptions {
  autoModerate?: boolean;
  onViolation?: (result: ModerationResult) => void;
}

export function useAIModeration(options: UseAIModerationOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const moderateContent = useCallback(async (
    contentId: string,
    contentType: 'video' | 'image' | 'text' | 'audio' | 'comment',
    content?: string,
    url?: string,
    context?: {
      reportedBy?: string;
      reportReason?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<ModerationResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: moderationError } = await supabase.functions.invoke('ai-moderation', {
        body: {
          contentId,
          contentType,
          content,
          url,
          context,
        },
      });

      if (moderationError) throw moderationError;

      if (data.decision !== 'approved' && options.onViolation) {
        options.onViolation(data);
      }

      return data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const moderateText = useCallback((text: string, contentId?: string) => {
    return moderateContent(
      contentId || crypto.randomUUID(),
      'text',
      text
    );
  }, [moderateContent]);

  const moderateImage = useCallback((imageUrl: string, contentId?: string) => {
    return moderateContent(
      contentId || crypto.randomUUID(),
      'image',
      undefined,
      imageUrl
    );
  }, [moderateContent]);

  const moderateVideo = useCallback((videoUrl: string, videoId: string) => {
    return moderateContent(videoId, 'video', undefined, videoUrl);
  }, [moderateContent]);

  const moderateComment = useCallback((comment: string, commentId: string) => {
    return moderateContent(commentId, 'comment', comment);
  }, [moderateContent]);

  const reportContent = useCallback(async (
    contentId: string,
    contentType: 'video' | 'image' | 'text' | 'audio' | 'comment',
    reportedBy: string,
    reason: string
  ) => {
    return moderateContent(contentId, contentType, undefined, undefined, {
      reportedBy,
      reportReason: reason,
      priority: 'high',
    });
  }, [moderateContent]);

  return {
    moderateContent,
    moderateText,
    moderateImage,
    moderateVideo,
    moderateComment,
    reportContent,
    loading,
    error,
  };
}