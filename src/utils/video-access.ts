/**
 * Video access utilities for the Fleeks platform
 */

export type MembershipTier = 'free' | 'basic' | 'premium' | 'enterprise';

export const MEMBERSHIP_TIERS = {
  FREE: 'free' as const,
  BASIC: 'basic' as const,
  PREMIUM: 'premium' as const,
  ENTERPRISE: 'enterprise' as const,
};

export const TIER_HIERARCHY: Record<MembershipTier, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
};

export const TIER_FEATURES = {
  free: {
    name: '無料会員',
    previewMinutes: 5,
    maxVideosPerMonth: 10,
    hasAds: true,
    canDownload: false,
    price: 0,
  },
  basic: {
    name: 'ベーシック',
    previewMinutes: null, // Unlimited
    maxVideosPerMonth: null, // Unlimited
    hasAds: false,
    canDownload: false,
    price: 7980,
  },
  premium: {
    name: 'プレミアム',
    previewMinutes: null,
    maxVideosPerMonth: null,
    hasAds: false,
    canDownload: true,
    price: 14980,
  },
  enterprise: {
    name: 'エンタープライズ',
    previewMinutes: null,
    maxVideosPerMonth: null,
    hasAds: false,
    canDownload: true,
    price: 29980,
    additionalFeatures: ['priority_support', 'team_management', 'analytics'],
  },
};

/**
 * Check if a user can access a video based on their membership tier
 */
export function canAccessVideo(
  userTier: MembershipTier,
  requiredTier: MembershipTier
): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

/**
 * Calculate remaining preview time for free users
 */
export function calculateRemainingPreviewTime(
  watchedSeconds: number,
  userTier: MembershipTier
): number {
  if (userTier !== 'free') {
    return Infinity; // No limit for paid tiers
  }
  
  const previewLimitSeconds = TIER_FEATURES.free.previewMinutes * 60;
  return Math.max(0, previewLimitSeconds - watchedSeconds);
}

/**
 * Format seconds to readable time (MM:SS or HH:MM:SS)
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate watch percentage
 */
export function calculateWatchPercentage(
  watchedSeconds: number,
  totalSeconds: number
): number {
  if (!totalSeconds || totalSeconds <= 0) return 0;
  return Math.min(100, Math.round((watchedSeconds / totalSeconds) * 100));
}

/**
 * Get tier display information
 */
export function getTierDisplayInfo(tier: MembershipTier) {
  const features = TIER_FEATURES[tier];
  return {
    name: features.name,
    price: features.price,
    priceDisplay: features.price === 0 ? '無料' : `¥${features.price.toLocaleString()}/月`,
    color: {
      free: '#9CA3AF', // gray
      basic: '#3B82F6', // blue
      premium: '#8B5CF6', // purple
      enterprise: '#F59E0B', // amber
    }[tier],
    badge: {
      free: '🆓',
      basic: '⭐',
      premium: '🌟',
      enterprise: '👑',
    }[tier],
  };
}

/**
 * Check if user needs to upgrade to access content
 */
export function needsUpgrade(
  userTier: MembershipTier,
  requiredTier: MembershipTier
): boolean {
  return TIER_HIERARCHY[userTier] < TIER_HIERARCHY[requiredTier];
}

/**
 * Get recommended upgrade tier
 */
export function getRecommendedUpgrade(
  currentTier: MembershipTier,
  requiredTier: MembershipTier
): MembershipTier | null {
  if (!needsUpgrade(currentTier, requiredTier)) return null;
  
  // If content requires enterprise but user is free, recommend premium first
  if (requiredTier === 'enterprise' && currentTier === 'free') {
    return 'premium';
  }
  
  return requiredTier;
}