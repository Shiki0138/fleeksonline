import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  contentId: string;
  contentType: 'video' | 'image' | 'text' | 'audio' | 'comment';
  content?: string; // For text content
  url?: string; // For media content
  userId?: string;
  context?: {
    reportedBy?: string;
    reportReason?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface ModerationResponse {
  contentId: string;
  contentType: string;
  decision: 'approved' | 'flagged' | 'rejected' | 'review_required';
  confidence: number;
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    details: string;
  }>;
  recommendations: string[];
  processingTime: number;
}

// Moderation categories
const MODERATION_CATEGORIES = {
  VIOLENCE: 'violence',
  ADULT: 'adult_content',
  HATE_SPEECH: 'hate_speech',
  HARASSMENT: 'harassment',
  SELF_HARM: 'self_harm',
  SPAM: 'spam',
  MISINFORMATION: 'misinformation',
  COPYRIGHT: 'copyright',
  PRIVACY: 'privacy_violation',
};

// Severity thresholds
const SEVERITY_THRESHOLDS = {
  low: 0.3,
  medium: 0.6,
  high: 0.8,
  critical: 0.95,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request = await req.json() as ModerationRequest;
    const { contentId, contentType, content, url, userId, context = {} } = request;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = Date.now();
    const violations: ModerationResponse['violations'] = [];

    // Run appropriate moderation based on content type
    switch (contentType) {
      case 'text':
      case 'comment':
        await moderateText(content || '', violations);
        break;
      
      case 'image':
        await moderateImage(url || '', violations);
        break;
      
      case 'video':
        await moderateVideo(url || '', violations, supabase);
        break;
      
      case 'audio':
        await moderateAudio(url || '', violations);
        break;
    }

    // Check user history for repeat offenders
    if (userId) {
      const userViolations = await checkUserHistory(supabase, userId);
      if (userViolations.repeatOffender) {
        violations.forEach(v => v.severity = increaseSeverity(v.severity));
      }
    }

    // Make moderation decision
    const decision = makeDecision(violations, context);
    const confidence = calculateConfidence(violations);
    const recommendations = generateRecommendations(violations, decision);

    // Store moderation result
    await supabase.from('moderation_logs').insert({
      content_id: contentId,
      content_type: contentType,
      user_id: userId,
      decision,
      confidence,
      violations,
      context,
      processing_time: Date.now() - startTime,
      created_at: new Date().toISOString(),
    });

    // Take automated actions if needed
    if (decision === 'rejected' || decision === 'flagged') {
      await takeAutomatedAction(supabase, contentId, contentType, decision, violations);
    }

    const response: ModerationResponse = {
      contentId,
      contentType,
      decision,
      confidence,
      violations,
      recommendations,
      processingTime: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Text moderation using multiple AI models
async function moderateText(text: string, violations: any[]): Promise<void> {
  if (!text || text.trim().length === 0) return;

  // Toxicity detection using Hugging Face
  try {
    const toxicityResponse = await fetch('https://api-inference.huggingface.co/models/unitary/toxic-bert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
      }),
    });

    const toxicityResults = await toxicityResponse.json();
    
    // Process toxicity results
    if (Array.isArray(toxicityResults[0])) {
      toxicityResults[0].forEach((result: any) => {
        if (result.score > SEVERITY_THRESHOLDS.low) {
          violations.push({
            type: mapToxicityLabel(result.label),
            severity: getSeverityLevel(result.score),
            confidence: result.score,
            details: `Detected ${result.label} content`,
          });
        }
      });
    }
  } catch (error) {
    console.error('Toxicity detection error:', error);
  }

  // Hate speech detection
  if (text.length > 10) {
    const hateScore = await detectHateSpeech(text);
    if (hateScore > SEVERITY_THRESHOLDS.low) {
      violations.push({
        type: MODERATION_CATEGORIES.HATE_SPEECH,
        severity: getSeverityLevel(hateScore),
        confidence: hateScore,
        details: 'Potential hate speech detected',
      });
    }
  }

  // Spam detection
  const spamScore = detectSpam(text);
  if (spamScore > SEVERITY_THRESHOLDS.medium) {
    violations.push({
      type: MODERATION_CATEGORIES.SPAM,
      severity: getSeverityLevel(spamScore),
      confidence: spamScore,
      details: 'Spam patterns detected',
    });
  }
}

// Image moderation using vision AI
async function moderateImage(imageUrl: string, violations: any[]): Promise<void> {
  if (!imageUrl) return;

  try {
    // NSFW detection using Cloudflare Workers AI
    const nsfwResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/nsfw-image-detection', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('CF_API_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
      }),
    });

    const nsfwResult = await nsfwResponse.json();
    
    if (nsfwResult.nsfw_score > SEVERITY_THRESHOLDS.medium) {
      violations.push({
        type: MODERATION_CATEGORIES.ADULT,
        severity: getSeverityLevel(nsfwResult.nsfw_score),
        confidence: nsfwResult.nsfw_score,
        details: 'Adult content detected',
      });
    }

    // Violence detection
    const violenceScore = await detectViolenceInImage(imageUrl);
    if (violenceScore > SEVERITY_THRESHOLDS.low) {
      violations.push({
        type: MODERATION_CATEGORIES.VIOLENCE,
        severity: getSeverityLevel(violenceScore),
        confidence: violenceScore,
        details: 'Violent imagery detected',
      });
    }
  } catch (error) {
    console.error('Image moderation error:', error);
  }
}

// Video moderation (sample frames)
async function moderateVideo(videoUrl: string, violations: any[], supabase: any): Promise<void> {
  if (!videoUrl) return;

  try {
    // Get video metadata
    const { data: video } = await supabase
      .from('videos')
      .select('duration, thumbnail_url')
      .eq('url', videoUrl)
      .single();

    if (!video) return;

    // Sample frames at intervals
    const framesToCheck = Math.min(5, Math.ceil(video.duration / 30));
    const framePromises = [];

    for (let i = 0; i < framesToCheck; i++) {
      const timestamp = (video.duration / framesToCheck) * i;
      const frameUrl = `${videoUrl}?t=${timestamp}`;
      framePromises.push(moderateImage(frameUrl, []));
    }

    const frameResults = await Promise.all(framePromises);
    
    // Aggregate frame violations
    frameResults.forEach((frameViolations: any) => {
      if (frameViolations && frameViolations.length > 0) {
        violations.push(...frameViolations);
      }
    });

    // Check audio track if present
    await moderateAudio(videoUrl, violations);
  } catch (error) {
    console.error('Video moderation error:', error);
  }
}

// Audio moderation (transcription + text analysis)
async function moderateAudio(audioUrl: string, violations: any[]): Promise<void> {
  try {
    // For demonstration, we'll simulate audio moderation
    // In production, use speech-to-text API then moderate the transcript
    const simulatedTranscript = 'Audio content transcript would go here';
    await moderateText(simulatedTranscript, violations);
  } catch (error) {
    console.error('Audio moderation error:', error);
  }
}

// Helper functions
async function detectHateSpeech(text: string): Promise<number> {
  // Use a specialized hate speech model
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/Hate-speech-CNERG/dehatebert-mono-english', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
      }),
    });

    const results = await response.json();
    return results[0]?.find((r: any) => r.label === 'HATE')?.score || 0;
  } catch (error) {
    console.error('Hate speech detection error:', error);
    return 0;
  }
}

function detectSpam(text: string): number {
  // Simple spam detection heuristics
  let score = 0;
  
  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5) score += 0.3;
  
  // Check for repeated characters
  if (/(.)\1{4,}/.test(text)) score += 0.3;
  
  // Check for spam keywords
  const spamKeywords = ['buy now', 'click here', 'limited offer', 'act now', 'promo'];
  spamKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword)) score += 0.2;
  });
  
  // Check for excessive URLs
  const urlCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 2) score += 0.3;
  
  return Math.min(score, 1);
}

async function detectViolenceInImage(imageUrl: string): Promise<number> {
  // Simulate violence detection
  // In production, use a specialized violence detection model
  return Math.random() * 0.3; // Low probability for demo
}

function mapToxicityLabel(label: string): string {
  const mapping: Record<string, string> = {
    'TOXIC': MODERATION_CATEGORIES.HARASSMENT,
    'SEVERE_TOXIC': MODERATION_CATEGORIES.HARASSMENT,
    'OBSCENE': MODERATION_CATEGORIES.ADULT,
    'THREAT': MODERATION_CATEGORIES.VIOLENCE,
    'INSULT': MODERATION_CATEGORIES.HARASSMENT,
    'IDENTITY_HATE': MODERATION_CATEGORIES.HATE_SPEECH,
  };
  
  return mapping[label] || MODERATION_CATEGORIES.HARASSMENT;
}

function getSeverityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= SEVERITY_THRESHOLDS.critical) return 'critical';
  if (score >= SEVERITY_THRESHOLDS.high) return 'high';
  if (score >= SEVERITY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

function increaseSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
  const levels = ['low', 'medium', 'high', 'critical'];
  const currentIndex = levels.indexOf(severity);
  return levels[Math.min(currentIndex + 1, levels.length - 1)] as any;
}

async function checkUserHistory(supabase: any, userId: string): Promise<any> {
  const { data: history } = await supabase
    .from('moderation_logs')
    .select('decision, violations')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const violationCount = history?.filter((h: any) => 
    h.decision === 'rejected' || h.decision === 'flagged'
  ).length || 0;

  return {
    repeatOffender: violationCount >= 3,
    violationCount,
  };
}

function makeDecision(
  violations: any[],
  context: any
): 'approved' | 'flagged' | 'rejected' | 'review_required' {
  if (violations.length === 0) return 'approved';

  const hasCritical = violations.some(v => v.severity === 'critical');
  const hasHigh = violations.some(v => v.severity === 'high');
  const mediumCount = violations.filter(v => v.severity === 'medium').length;

  // Auto-reject critical violations
  if (hasCritical) return 'rejected';
  
  // Flag high severity or multiple medium
  if (hasHigh || mediumCount >= 2) return 'flagged';
  
  // Review required for edge cases
  if (mediumCount === 1 || context.priority === 'high') return 'review_required';
  
  return 'approved';
}

function calculateConfidence(violations: any[]): number {
  if (violations.length === 0) return 1;
  
  const avgConfidence = violations.reduce((sum, v) => sum + v.confidence, 0) / violations.length;
  return Math.round(avgConfidence * 100) / 100;
}

function generateRecommendations(violations: any[], decision: string): string[] {
  const recommendations: string[] = [];
  
  if (decision === 'rejected') {
    recommendations.push('Content violates community guidelines and should be removed');
    recommendations.push('Notify user about the violation');
    
    if (violations.some(v => v.type === MODERATION_CATEGORIES.HATE_SPEECH)) {
      recommendations.push('Consider temporary user suspension');
    }
  } else if (decision === 'flagged') {
    recommendations.push('Content requires manual review');
    recommendations.push('Restrict visibility until reviewed');
  } else if (decision === 'review_required') {
    recommendations.push('Edge case detected - human review recommended');
  }
  
  return recommendations;
}

async function takeAutomatedAction(
  supabase: any,
  contentId: string,
  contentType: string,
  decision: string,
  violations: any[]
): Promise<void> {
  try {
    // Update content status
    await supabase
      .from(contentType === 'comment' ? 'comments' : 'videos')
      .update({
        moderation_status: decision,
        visibility: decision === 'rejected' ? 'hidden' : 'restricted',
        moderation_reason: violations.map(v => v.type).join(', '),
      })
      .eq('id', contentId);

    // Create moderation action record
    await supabase.from('moderation_actions').insert({
      content_id: contentId,
      content_type: contentType,
      action: decision === 'rejected' ? 'hide' : 'restrict',
      reason: violations[0]?.details || 'Policy violation',
      automated: true,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Automated action error:', error);
  }
}