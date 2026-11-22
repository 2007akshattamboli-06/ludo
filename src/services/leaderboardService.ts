import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

export interface LeaderboardEntry {
  uid: string;
  username: string;
  coins: number;
  level: number;
  wins: number;
  avatar?: string;
}

export async function fetchGlobalLeaderboard(
  maxResults = 50
): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured) return [];

  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('coins', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  const entries: LeaderboardEntry[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    entries.push({
      uid: docSnap.id,
      username: data.username || data.displayName || 'Royale Player',
      coins: typeof data.coins === 'number' ? data.coins : 0,
      level: typeof data.level === 'number' ? data.level : 1,
      wins: typeof data.wins === 'number' ? data.wins : 0,
      avatar: data.avatar,
    });
  });

  return entries;
}