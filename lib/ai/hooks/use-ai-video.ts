import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoAnalysisResult {
  thumbnail?: string;
  classification?: Array<{ label: string; confidence: number }>;
  analysis?: {
    objects: Array<{ type: string; confidence: number; bbox: number[] }>;
    scenes: Array<{ type: string; timestamp: number }>;
  };
  extraction?: {
    frames: string[];
    metadata: any;
  };
}

interface UseAIVideoOptions {
  onSuccess?: (result: VideoAnalysisResult) => void;
  onError?: (error: Error) => void;
}

export function useAIVideo(options: UseAIVideoOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);

  const processVideo = useCallback(async (
    videoId: string,
    operations: Array<'thumbnail' | 'classify' | 'analyze' | 'extract'>,
    processOptions?: {
      timestampSeconds?: number;
      maxFrames?: number;
      outputFormat?: 'base64' | 'url';
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: processError } = await supabase.functions.invoke('ai-video-processor', {
        body: {
          videoId,
          operations,
          options: processOptions,
        },
      });

      if (processError) throw processError;

      setResult(data.results);
      options.onSuccess?.(data.results);
      
      return data.results;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const generateThumbnail = useCallback((videoId: string, timestamp?: number) => {
    return processVideo(videoId, ['thumbnail'], { timestampSeconds: timestamp });
  }, [processVideo]);

  const classifyVideo = useCallback((videoId: string) => {
    return processVideo(videoId, ['classify']);
  }, [processVideo]);

  const analyzeVideo = useCallback((videoId: string, maxFrames?: number) => {
    return processVideo(videoId, ['analyze'], { maxFrames });
  }, [processVideo]);

  const extractFrames = useCallback((videoId: string, maxFrames?: number) => {
    return processVideo(videoId, ['extract'], { maxFrames });
  }, [processVideo]);

  const fullAnalysis = useCallback((videoId: string) => {
    return processVideo(videoId, ['thumbnail', 'classify', 'analyze', 'extract']);
  }, [processVideo]);

  return {
    processVideo,
    generateThumbnail,
    classifyVideo,
    analyzeVideo,
    extractFrames,
    fullAnalysis,
    loading,
    error,
    result,
  };
}