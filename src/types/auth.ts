export type AvatarId = 'crown' | 'flame' | 'shield' | 'zap' | 'gem' | 'swords';

export interface MatchHistoryItem {
  id: string;
  won: boolean;
  mode: string;
  coinsEarned: number;
  xpEarned: number;
  playedAt: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  avatar: AvatarId;
  isGuest: boolean;
  coins: number;
  level: number;
  xp: number;
  wins: number;
  matchesPlayed: number;
  matchHistory?: MatchHistoryItem[];
}