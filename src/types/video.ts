export interface VideoHistory {
  id: string;
  userId: string;
  videoId: string;
  watchedDuration: number;
  lastWatchedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoAccessControl {
  videoId: string;
  userId: string;
  membershipType: 'FREE' | 'PREMIUM' | 'VIP';
  maxDuration: number;
  watchedDuration: number;
  canAccess: boolean;
  restrictionType?: 'time_limit' | 'premium_only' | 'vip_only';
  restrictionMessage?: string;
}

export interface VideoInteraction {
  id: string;
  userId: string;
  videoId: string;
  interactionType: 'view' | 'like' | 'share' | 'complete';
  durationWatched?: number;
  context?: {
    userAgent?: string;
    timestamp?: string;
    subscriptionStatus?: string;
    device?: string;
    location?: string;
  };
  createdAt: Date;
}

export interface VideoWatchSession {
  sessionId: string;
  videoId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  events: VideoWatchEvent[];
}

export interface VideoWatchEvent {
  timestamp: Date;
  eventType: 'play' | 'pause' | 'seek' | 'end' | 'limit_reached';
  currentTime: number;
  data?: any;
}