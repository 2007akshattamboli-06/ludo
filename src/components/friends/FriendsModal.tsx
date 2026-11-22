import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Gamepad2,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';
import {
  DirectMessage,
  FriendProfile,
  FriendRequestRecord,
} from '../../types/friends';
import { friendService } from '../../services/friendService';
import { socketService } from '../../services/socketService';
import { AVATAR_OPTIONS } from '../screens/LoginScreen';

interface FriendsModalProps {
  user: UserProfile;
  friends: FriendProfile[];
  incomingRequests: FriendRequestRecord[];
  outgoingRequests: FriendRequestRecord[];
  presenceMap: Record<string, { online: boolean; inGame: boolean }>;
  unreadCounts: Record<string, number>;
  onActiveChatChange?: (friendUid: string | null) => void;
  onClose: () => void;
  onInviteFriend: (friend: FriendProfile) => void;
}

type FriendTab = 'friends' | 'requests' | 'add';

const QUICK_EMOJIS = ['👋', '🎲', '🔥', '😂', '👑', '🤝'];

export const FriendsModal: React.FC<FriendsModalProps> = ({
  user,
  friends,
  incomingRequests,
  outgoingRequests,
  presenceMap,
  unreadCounts,
  onActiveChatChange,
  onClose,
  onInviteFriend,
}) => {
  const [activeTab, setActiveTab] = useState<FriendTab>('friends');
  const [activeChatFriend, setActiveChatFriend] = useState<FriendProfile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draftText, setDraftText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  useEffect(() => {
    socketService.getSocket()?.emit('request_presence');
    return () => {
      onActiveChatChange?.(null);
    };
  }, [onActiveChatChange]);

  useEffect(() => {
    onActiveChatChange?.(activeChatFriend?.uid ?? null);
    if (!activeChatFriend) {
      setMessages([]);
      return;
    }

    friendService.markChatAsRead(user.uid, activeChatFriend.uid);

    const unsub = friendService.subscribeToChat(
      user.uid,
      activeChatFriend.uid,
      (list) => {
        setMessages(list);
        friendService.markChatAsRead(user.uid, activeChatFriend.uid);
      }
    );
    return () => unsub();
  }, [activeChatFriend, onActiveChatChange, user.uid]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setAddingFriend(true);
    try {
      const msg = await friendService.sendFriendRequest(user, searchInput);
      setFeedback({ type: 'ok', text: msg });
      setSearchInput('');
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not send request.',
      });
    } finally {
      setAddingFriend(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    if (!activeChatFriend || sendingMsg) return;
    const content = customText ?? draftText;
    if (!content.trim()) return;

    setSendingMsg(true);
    if (!customText) setDraftText('');
    try {
      await friendService.sendMessage(user, activeChatFriend.uid, content);
      friendService.markChatAsRead(user.uid, activeChatFriend.uid);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 1800);
  };

  const renderAvatar = (avatarId: string, sizeClass = 'w-9 h-9') => {
    const meta = AVATAR_OPTIONS.find((a) => a.id === avatarId) ?? AVATAR_OPTIONS[0];
    const Icon = meta.Icon;
    return (
      <div
        className={`${sizeClass} rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white shrink-0 shadow`}
      >
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  // ==================== DIRECT CHAT VIEW ====================
  if (activeChatFriend) {
    const status = presenceMap[activeChatFriend.uid];
    const isOnline = Boolean(status?.online);

    return (
      <div className="w-full max-w-md mx-auto p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col h-[540px] max-h-[90vh]">
        {/* Chat Header */}
        <div className="flex items-center justify-between gap-2 pb-3.5 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setActiveChatFriend(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {renderAvatar(activeChatFriend.avatar)}
            <div className="truncate">
              <p className="text-sm font-bold text-white truncate">
                {activeChatFriend.username}
              </p>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span className={isOnline ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                  {status?.inGame ? 'In Match' : isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isOnline && (
              <button
                type="button"
                onClick={() => onInviteFriend(activeChatFriend)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition"
              >
                <Gamepad2 className="w-3.5 h-3.5" /> Play
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <MessageCircle className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">
                Start chatting with {activeChatFriend.username}!
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Coordinate a private match or send a quick greeting.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderUid === user.uid;
              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                      isMine
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold rounded-br-sm'
                        : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 px-1">{timeStr}</span>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Emoji Row */}
        <div className="flex items-center justify-between gap-1 mb-2">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSendMessage(undefined, emoji)}
              className="flex-1 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sm transition active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            maxLength={300}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder={`Message ${activeChatFriend.username}...`}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!draftText.trim() || sendingMsg}
            className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black disabled:opacity-40 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Sort friends: unread first, then online, then offline
  const sortedFriends = [...friends].sort((a, b) => {
    const unreadA = unreadCounts[a.uid] ?? 0;
    const unreadB = unreadCounts[b.uid] ?? 0;
    if (unreadB !== unreadA) return unreadB - unreadA;
    const onlineA = presenceMap[a.uid]?.online ? 1 : 0;
    const onlineB = presenceMap[b.uid]?.online ? 1 : 0;
    return onlineB - onlineA;
  });

  // ==================== FRIENDS HUB VIEW ====================
  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-400/15 text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Friends & Social</h2>
            <p className="text-[11px] text-slate-400">
              {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
              {totalUnread > 0 && ` • ${totalUnread} unread`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 mb-4 rounded-2xl bg-slate-950 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('friends')}
          className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
            activeTab === 'friends'
              ? 'bg-amber-400 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Friends ({friends.length})</span>
          {totalUnread > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'friends'
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-sky-500 text-slate-950'
              }`}
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`relative py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'requests'
              ? 'bg-amber-400 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Requests
          {incomingRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('add');
            setFeedback(null);
          }}
          className={`py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'add'
              ? 'bg-amber-400 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          + Add
        </button>
      </div>

      {/* TAB 1: FRIENDS LIST */}
      {activeTab === 'friends' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sortedFriends.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-3">
              <Users className="w-9 h-9 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                No friends added yet. Search by username or Player ID to team up!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black uppercase"
              >
                Add First Friend
              </button>
            </div>
          ) : (
            sortedFriends.map((friend) => {
              const status = presenceMap[friend.uid];
              const isOnline = Boolean(status?.online);
              const unread = unreadCounts[friend.uid] ?? 0;

              return (
                <div
                  key={friend.uid}
                  className={`flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/85 border transition ${
                    unread > 0 ? 'border-sky-400/50 bg-slate-900/90' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      {renderAvatar(friend.avatar)}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                          isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate">
                          {friend.username}
                        </p>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-sky-400 text-slate-950 text-[9px] font-black">
                            {unread} new
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] ${
                          isOnline ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {status?.inGame ? 'In Match' : isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveChatFriend(friend)}
                      title="Chat"
                      className={`relative p-2 rounded-xl border transition ${
                        unread > 0
                          ? 'bg-sky-500/25 border-sky-400 text-sky-200 animate-pulse'
                          : 'bg-slate-800 hover:bg-sky-500/20 border-slate-700 hover:border-sky-400/50 text-sky-300'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {unread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sky-400 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </button>

                    {isOnline && (
                      <button
                        type="button"
                        onClick={() => onInviteFriend(friend)}
                        title="Invite to Private Match"
                        className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 transition"
                      >
                        <Gamepad2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        friendService.removeFriendshipOrRequest(friend.friendshipId)
                      }
                      title="Remove Friend"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Incoming Requests ({incomingRequests.length})
            </h3>
            {incomingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                No incoming requests.
              </p>
            ) : (
              <div className="space-y-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950 border border-amber-400/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderAvatar(req.fromAvatar)}
                      <span className="text-sm font-bold text-white truncate">
                        {req.fromUsername}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => friendService.acceptRequest(req.id)}
                        className="p-2 rounded-xl bg-emerald-400 text-slate-950 font-bold"
                        title="Accept"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => friendService.removeFriendshipOrRequest(req.id)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-400"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {outgoingRequests.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Sent Requests ({outgoingRequests.length})
              </h3>
              <div className="space-y-2">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderAvatar(req.toAvatar)}
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-200 truncate">
                          {req.toUsername}
                        </p>
                        <p className="text-[10px] text-slate-500">Pending approval</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => friendService.removeFriendshipOrRequest(req.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-400 hover:text-rose-300"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADD FRIEND */}
      {activeTab === 'add' && (
        <div className="space-y-4">
          <form onSubmit={handleSendFriendRequest} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Find by Username or Player ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. Akshat or Player ID"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={addingFriend || !searchInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
              >
                {addingFriend ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Add
              </button>
            </div>
          </form>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                feedback.type === 'ok'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Share My ID Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
              Your Shareable Player ID
            </p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-amber-300 truncate">{user.uid}</code>
              <button
                type="button"
                onClick={handleCopyUid}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 shrink-0"
              >
                {copiedUid ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};