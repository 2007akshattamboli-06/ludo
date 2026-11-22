import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { AvatarId, MatchHistoryItem, UserProfile } from '../types/auth';

function mapFirebaseError(err: unknown): Error {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = String((err as { code: string }).code);
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new Error('Invalid email or password.');
      case 'auth/email-already-in-use':
        return new Error('An account with this email already exists.');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address.');
      case 'auth/weak-password':
        return new Error('Password must be at least 6 characters.');
      case 'auth/popup-closed-by-user':
        return new Error('Google sign-in popup was closed.');
      case 'auth/too-many-requests':
        return new Error('Too many attempts. Please wait a moment and try again.');
      default:
        break;
    }
  }
  return err instanceof Error ? err : new Error('Authentication error occurred.');
}

async function ensureUserProfile(
  firebaseUser: User,
  overrides?: Partial<UserProfile>
): Promise<UserProfile> {
  if (!db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    return {
      ...data,
      matchHistory: data.matchHistory ?? [],
    };
  }

  const isGuest = firebaseUser.isAnonymous;
  const fallbackName = isGuest
    ? `Guest_${Math.floor(1000 + Math.random() * 9000)}`
    : firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'RoyalePlayer';

  const newProfile: UserProfile = {
    uid: firebaseUser.uid,
    username: overrides?.username || fallbackName,
    email: firebaseUser.email || overrides?.email || undefined,
    avatar: overrides?.avatar || (isGuest ? 'zap' : 'crown'),
    isGuest,
    coins: isGuest ? 500 : 1500,
    level: 1,
    xp: 0,
    wins: 0,
    matchesPlayed: 0,
    matchHistory: [],
  };

  await setDoc(userRef, {
    ...newProfile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return newProfile;
}

export const authService = {
  subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
    if (!auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      try {
        const profile = await ensureUserProfile(firebaseUser);
        callback(profile);
      } catch {
        callback(null);
      }
    });
  },

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    if (!auth) throw new Error('Firebase is not configured. Check your .env file.');
    if (!email.trim() || !password) {
      throw new Error('Please enter both email and password.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return await ensureUserProfile(cred.user);
    } catch (err) {
      throw mapFirebaseError(err);
    }
  },

  async registerWithEmail(
    username: string,
    email: string,
    password: string,
    avatar: AvatarId
  ): Promise<UserProfile> {
    if (!auth) throw new Error('Firebase is not configured. Check your .env file.');
    const cleanUser = username.trim();
    const cleanEmail = email.trim();

    if (cleanUser.length < 3) {
      throw new Error('Username must be at least 3 characters.');
    }
    if (!cleanEmail) {
      throw new Error('Email is required to create an account.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanUser });
      return await ensureUserProfile(cred.user, {
        username: cleanUser,
        email: cleanEmail,
        avatar,
      });
    } catch (err) {
      throw mapFirebaseError(err);
    }
  },

  async loginWithGoogle(avatar: AvatarId = 'crown'): Promise<UserProfile> {
    if (!auth || !googleProvider) {
      throw new Error('Firebase is not configured. Check your .env file.');
    }
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return await ensureUserProfile(cred.user, { avatar });
    } catch (err) {
      throw mapFirebaseError(err);
    }
  },

  async loginAsGuest(avatar: AvatarId = 'zap'): Promise<UserProfile> {
    if (!auth) throw new Error('Firebase is not configured. Check your .env file.');
    try {
      const cred = await signInAnonymously(auth);
      return await ensureUserProfile(cred.user, { avatar });
    } catch (err) {
      throw mapFirebaseError(err);
    }
  },

  async updateUserProfile(
    uid: string,
    updates: { username: string; avatar: AvatarId }
  ): Promise<UserProfile> {
    if (!db) throw new Error('Firestore is not configured.');
    const cleanName = updates.username.trim();
    if (cleanName.length < 3 || cleanName.length > 20) {
      throw new Error('Username must be between 3 and 20 characters.');
    }

    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      throw new Error('Profile record not found.');
    }

    if (auth?.currentUser && !auth.currentUser.isAnonymous) {
      await updateProfile(auth.currentUser, { displayName: cleanName }).catch(() => {});
    }

    await updateDoc(userRef, {
      username: cleanName,
      avatar: updates.avatar,
      updatedAt: serverTimestamp(),
    });

    const current = snap.data() as UserProfile;
    return {
      ...current,
      username: cleanName,
      avatar: updates.avatar,
      matchHistory: current.matchHistory ?? [],
    };
  },

  async recordMatchResult(
    uid: string,
    won: boolean,
    modeLabel = 'Arena Match'
  ): Promise<UserProfile | null> {
    if (!db) return null;
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return null;

      const current = snap.data() as UserProfile;
      const earnedCoins = won ? 250 : 25;
      const earnedXp = won ? 120 : 30;
      const nextXp = current.xp + earnedXp;
      const nextLevel = Math.floor(nextXp / 300) + 1;

      const entry: MatchHistoryItem = {
        id: `${Date.now()}`,
        won,
        mode: modeLabel,
        coinsEarned: earnedCoins,
        xpEarned: earnedXp,
        playedAt: new Date().toISOString(),
      };

      const nextHistory = [entry, ...(current.matchHistory ?? [])].slice(0, 10);

      const updated: UserProfile = {
        ...current,
        coins: current.coins + earnedCoins,
        xp: nextXp,
        level: nextLevel,
        wins: current.wins + (won ? 1 : 0),
        matchesPlayed: current.matchesPlayed + 1,
        matchHistory: nextHistory,
      };

      await updateDoc(userRef, {
        coins: updated.coins,
        xp: updated.xp,
        level: updated.level,
        wins: updated.wins,
        matchesPlayed: updated.matchesPlayed,
        matchHistory: nextHistory,
        updatedAt: serverTimestamp(),
      });

      return updated;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    if (!auth) return;
    await signOut(auth);
  },
};