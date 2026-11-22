import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types/auth';
import { DirectMessage, FriendProfile, FriendRequestRecord } from '../types/friends';

const READ_STORAGE_PREFIX = 'ludo_chat_read_';
const READ_UPDATED_EVENT = 'ludo_chat_read_updated';

export function getChatThreadId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

function getLastReadMap(myUid: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${READ_STORAGE_PREFIX}${myUid}`);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export const friendService = {
  markChatAsRead(myUid: string, friendUid: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = getLastReadMap(myUid);
      current[friendUid] = Date.now();
      window.localStorage.setItem(`${READ_STORAGE_PREFIX}${myUid}`, JSON.stringify(current));
      window.dispatchEvent(new Event(READ_UPDATED_EVENT));
    } catch {
      // Ignore storage quota errors
    }
  },

  subscribeToSocial(
    myUid: string,
    onUpdate: (data: {
      friends: FriendProfile[];
      incomingRequests: FriendRequestRecord[];
      outgoingRequests: FriendRequestRecord[];
    }) => void
  ): () => void {
    if (!db) {
      onUpdate({ friends: [], incomingRequests: [], outgoingRequests: [] });
      return () => {};
    }

    let incomingDocs: FriendRequestRecord[] = [];
    let outgoingDocs: FriendRequestRecord[] = [];

    const emitCombined = () => {
      const friendMap = new Map<string, FriendProfile>();
      const pendingIn: FriendRequestRecord[] = [];
      const pendingOut: FriendRequestRecord[] = [];

      for (const req of incomingDocs) {
        if (req.status === 'accepted') {
          friendMap.set(req.fromUid, {
            uid: req.fromUid,
            username: req.fromUsername,
            avatar: req.fromAvatar,
            friendshipId: req.id,
          });
        } else {
          pendingIn.push(req);
        }
      }

      for (const req of outgoingDocs) {
        if (req.status === 'accepted') {
          friendMap.set(req.toUid, {
            uid: req.toUid,
            username: req.toUsername,
            avatar: req.toAvatar,
            friendshipId: req.id,
          });
        } else {
          pendingOut.push(req);
        }
      }

      onUpdate({
        friends: Array.from(friendMap.values()),
        incomingRequests: pendingIn,
        outgoingRequests: pendingOut,
      });
    };

    const qIn = query(collection(db, 'friend_requests'), where('toUid', '==', myUid));
    const qOut = query(collection(db, 'friend_requests'), where('fromUid', '==', myUid));

    const unsubIn = onSnapshot(qIn, (snap) => {
      incomingDocs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FriendRequestRecord, 'id'>),
      }));
      emitCombined();
    });

    const unsubOut = onSnapshot(qOut, (snap) => {
      outgoingDocs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FriendRequestRecord, 'id'>),
      }));
      emitCombined();
    });

    return () => {
      unsubIn();
      unsubOut();
    };
  },

  subscribeToUnreadMessages(
    myUid: string,
    friends: FriendProfile[],
    onUpdate: (
      counts: Record<string, number>,
      newIncomingMessage: {
        friendUid: string;
        senderName: string;
        text: string;
        createdAt: number;
      } | null
    ) => void
  ): () => void {
    if (!db || friends.length === 0) {
      onUpdate({}, null);
      return () => {};
    }

    const sessionStartedAt = Date.now();
    const alertedIds = new Set<string>();
    const recentByFriend = new Map<string, DirectMessage[]>();

    const recalculate = (
      latestMsg: {
        friendUid: string;
        senderName: string;
        text: string;
        createdAt: number;
      } | null = null
    ) => {
      const lastReadMap = getLastReadMap(myUid);
      const counts: Record<string, number> = {};

      for (const friend of friends) {
        const msgs = recentByFriend.get(friend.uid) ?? [];
        const lastReadAt = lastReadMap[friend.uid] ?? 0;
        const unread = msgs.filter(
          (m) => m.senderUid !== myUid && m.createdAt > lastReadAt
        ).length;
        if (unread > 0) {
          counts[friend.uid] = unread;
        }
      }

      onUpdate(counts, latestMsg);
    };

    const unsubscribers = friends.map((friend) => {
      const chatId = getChatThreadId(myUid, friend.uid);
      const messagesRef = collection(db!, 'friend_chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(25));

      return onSnapshot(q, (snap) => {
        const msgs: DirectMessage[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DirectMessage, 'id'>),
        }));
        recentByFriend.set(friend.uid, msgs);

        let newlyArrived: {
          friendUid: string;
          senderName: string;
          text: string;
          createdAt: number;
        } | null = null;

        const newest = msgs[0];
        if (
          newest &&
          newest.senderUid !== myUid &&
          newest.createdAt >= sessionStartedAt - 1500 &&
          !alertedIds.has(newest.id)
        ) {
          alertedIds.add(newest.id);
          newlyArrived = {
            friendUid: friend.uid,
            senderName: newest.senderName,
            text: newest.text,
            createdAt: newest.createdAt,
          };
        }

        recalculate(newlyArrived);
      });
    });

    const onReadEvent = () => recalculate(null);
    if (typeof window !== 'undefined') {
      window.addEventListener(READ_UPDATED_EVENT, onReadEvent);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      if (typeof window !== 'undefined') {
        window.removeEventListener(READ_UPDATED_EVENT, onReadEvent);
      }
    };
  },

  async sendFriendRequest(currentUser: UserProfile, queryInput: string): Promise<string> {
    if (!db) throw new Error('Firestore is not configured.');
    const clean = queryInput.trim();
    if (!clean) throw new Error('Enter a username or Player ID.');

    let targetUser: UserProfile | null = null;

    const directSnap = await getDoc(doc(db, 'users', clean));
    if (directSnap.exists()) {
      targetUser = directSnap.data() as UserProfile;
    } else {
      const exactQ = query(collection(db, 'users'), where('username', '==', clean), limit(1));
      const exactSnap = await getDocs(exactQ);
      if (!exactSnap.empty) {
        targetUser = exactSnap.docs[0].data() as UserProfile;
      } else {
        const allSnap = await getDocs(query(collection(db, 'users'), limit(100)));
        const found = allSnap.docs.find(
          (d) => (d.data() as UserProfile).username?.toLowerCase() === clean.toLowerCase()
        );
        if (found) targetUser = found.data() as UserProfile;
      }
    }

    if (!targetUser) {
      throw new Error('Player not found. Check the exact username or Player ID.');
    }
    if (targetUser.uid === currentUser.uid) {
      throw new Error('You cannot send a friend request to yourself.');
    }

    const forwardId = `${currentUser.uid}_${targetUser.uid}`;
    const reverseId = `${targetUser.uid}_${currentUser.uid}`;

    const [fwdSnap, revSnap] = await Promise.all([
      getDoc(doc(db, 'friend_requests', forwardId)),
      getDoc(doc(db, 'friend_requests', reverseId)),
    ]);

    if (fwdSnap.exists()) {
      const status = fwdSnap.data().status;
      throw new Error(
        status === 'accepted'
          ? `You are already friends with ${targetUser.username}!`
          : `Request already sent to ${targetUser.username}.`
      );
    }

    if (revSnap.exists()) {
      const status = revSnap.data().status;
      if (status === 'accepted') {
        throw new Error(`You are already friends with ${targetUser.username}!`);
      }
      await updateDoc(doc(db, 'friend_requests', reverseId), { status: 'accepted' });
      return `Accepted ${targetUser.username}'s pending request!`;
    }

    const record: Omit<FriendRequestRecord, 'id'> = {
      fromUid: currentUser.uid,
      fromUsername: currentUser.username,
      fromAvatar: currentUser.avatar,
      toUid: targetUser.uid,
      toUsername: targetUser.username,
      toAvatar: targetUser.avatar,
      status: 'pending',
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'friend_requests', forwardId), record);
    return `Friend request sent to ${targetUser.username}!`;
  },

  async acceptRequest(friendshipId: string): Promise<void> {
    if (!db) return;
    await updateDoc(doc(db, 'friend_requests', friendshipId), {
      status: 'accepted',
    });
  },

  async removeFriendshipOrRequest(friendshipId: string): Promise<void> {
    if (!db) return;
    await deleteDoc(doc(db, 'friend_requests', friendshipId));
  },

  subscribeToChat(
    myUid: string,
    friendUid: string,
    onMessages: (messages: DirectMessage[]) => void
  ): () => void {
    if (!db) {
      onMessages([]);
      return () => {};
    }
    const chatId = getChatThreadId(myUid, friendUid);
    const messagesRef = collection(db, 'friend_chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(60));

    return onSnapshot(q, (snap) => {
      const list: DirectMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DirectMessage, 'id'>),
      }));
      onMessages(list);
    });
  },

  async sendMessage(
    currentUser: UserProfile,
    friendUid: string,
    text: string
  ): Promise<void> {
    if (!db) return;
    const clean = text.trim();
    if (!clean) return;

    const chatId = getChatThreadId(currentUser.uid, friendUid);
    const messagesRef = collection(db, 'friend_chats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderUid: currentUser.uid,
      senderName: currentUser.username,
      text: clean.slice(0, 300),
      createdAt: Date.now(),
    });
  },
};