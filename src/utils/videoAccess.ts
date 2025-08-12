import { VideoAccessControl } from '../types/video';

export const VIDEO_ACCESS_LIMITS = {
  FREE: 300, // 5 minutes in seconds
  PREMIUM: Infinity,
  VIP: Infinity,
} as const;

export const MEMBERSHIP_FEATURES = {
  FREE: {
    videoLimit: 300,
    quality: 'SD',
    downloads: false,
    ads: true,
    exclusiveContent: false,
  },
  PREMIUM: {
    videoLimit: Infinity,
    quality: 'HD',
    downloads: true,
    ads: false,
    exclusiveContent: true,
  },
  VIP: {
    videoLimit: Infinity,
    quality: '4K',
    downloads: true,
    ads: false,
    exclusiveContent: true,
    prioritySupport: true,
    liveAccess: true,
  },
} as const;

export function calculateVideoAccess(
  membershipType: 'FREE' | 'PREMIUM' | 'VIP',
  watchedDuration: number,
  videoDuration: number
): VideoAccessControl {
  const maxDuration = VIDEO_ACCESS_LIMITS[membershipType];
  const effectiveLimit = Math.min(maxDuration, videoDuration);
  const canAccess = watchedDuration < effectiveLimit;
  
  let restrictionType: VideoAccessControl['restrictionType'];
  let restrictionMessage: string | undefined;
  
  if (!canAccess && membershipType === 'FREE') {
    restrictionType = 'time_limit';
    restrictionMessage = 'Free preview time has ended. Upgrade to continue watching.';
  }
  
  return {
    videoId: '',
    userId: '',
    membershipType,
    maxDuration: effectiveLimit,
    watchedDuration,
    canAccess,
    restrictionType,
    restrictionMessage,
  };
}

export function formatVideoTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function calculateRemainingTime(
  membershipType: 'FREE' | 'PREMIUM' | 'VIP',
  watchedDuration: number,
  videoDuration: number
): number {
  const limit = VIDEO_ACCESS_LIMITS[membershipType];
  const effectiveLimit = Math.min(limit, videoDuration);
  return Math.max(0, effectiveLimit - watchedDuration);
}

export function shouldShowUpgradePrompt(
  membershipType: 'FREE' | 'PREMIUM' | 'VIP',
  watchedDuration: number,
  videoDuration: number
): boolean {
  if (membershipType !== 'FREE') return false;
  
  const limit = VIDEO_ACCESS_LIMITS.FREE;
  const warningThreshold = limit * 0.8; // Show warning at 80% of limit
  
  return watchedDuration >= warningThreshold && watchedDuration < limit;
}

export function getUpgradeMessage(
  membershipType: 'FREE' | 'PREMIUM' | 'VIP',
  remainingTime: number
): string {
  if (membershipType !== 'FREE') return '';
  
  if (remainingTime <= 0) {
    return 'Your free preview has ended. Upgrade to continue watching!';
  }
  
  if (remainingTime <= 60) {
    return `Only ${Math.floor(remainingTime)} seconds remaining in your free preview!`;
  }
  
  const minutes = Math.floor(remainingTime / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining in your free preview`;
}