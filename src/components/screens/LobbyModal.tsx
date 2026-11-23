import React, { useMemo, useState } from 'react';
import {
  Bot,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Hash,
  Loader2,
  LogOut,
  Play,
  Send,
  Settings,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { GameMode, PlayerConfig } from '../../types/game';

export interface LobbyModalProps {
  user: any;
  onlineCount: number;
  serverConnected: boolean;
  searchingMatch: boolean;
  waitingRoom: any | null;
  onlineRooms?: any[];
  mpError: string | null;
  friends: any[];
  incomingRequests: any[];
  outgoingRequests: any[];
  presenceMap: Record<string, any>;
  unreadCounts: Record<string, number>;
  pendingInvite: any | null;
  onActiveChatChange: (friendUid: string | null) => void;
  onAcceptInvite: (invite: any) => void;
  onDismissInvite: () => void;
  onInviteFriend: (friend: any) => Promise<void> | void;
  onUserUpdated: (updatedUser: any) => void;
  onLogout: () => void;
  onStartOfflineGame: (configs: PlayerConfig[], mode: GameMode) => void;
  onFindQuickMatch: (maxPlayers: 2 | 4) => void;
  onCancelQuickMatch: () => void;
  onCreatePrivateRoom: (maxPlayers: 2 | 4) => void;
  onJoinPrivateRoom: (code: string) => void;
  onStartPrivateRoom: (code: string) => void;
  onLeaveRoom: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  user,
  onlineCount,
  serverConnected,
  searchingMatch,
  waitingRoom,
  onlineRooms = [],
  mpError,
  friends,
  incomingRequests,
  outgoingRequests,
  presenceMap,
  unreadCounts,
  pendingInvite,
  onActiveChatChange,
  onAcceptInvite,
  onDismissInvite,
  onInviteFriend,
  onUserUpdated,
  onLogout,
  onStartOfflineGame,
  onFindQuickMatch,
  onCancelQuickMatch,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onStartPrivateRoom,
  onLeaveRoom,
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [friendQuery, setFriendQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const profileData = user as any;
  const displayName = profileData?.username || profileData?.displayName || 'Player';
  const level = typeof profileData?.level === 'number' ? profileData.level : 1;
  const coins = typeof profileData?.coins === 'number' ? profileData.coins : 1500;
  const userUid = profileData?.uid || profileData?.id || '';

  const totalUnread = useMemo(() => {
    const msgUnread = Object.values(unreadCounts || {}).reduce(
      (sum, count) => sum + (Number(count) || 0),
      0
    );
    return msgUnread + (incomingRequests?.length || 0);
  }, [unreadCounts, incomingRequests]);

  const activeRoomCode: string =
    (waitingRoom as any)?.code || (waitingRoom as any)?.roomCode || '';
  const activeRoomPlayers: any[] = (waitingRoom as any)?.players || [];
  const activeRoomMax: number = (waitingRoom as any)?.maxPlayers || playerCount;
  const isRoomHost =
    !waitingRoom ||
    (waitingRoom as any)?.hostUid === userUid ||
    (waitingRoom as any)?.hostId === userUid ||
    activeRoomPlayers[0]?.uid === userUid;

  const launchOfflineMatch = (mode: GameMode) => {
    const isAI = mode === 'vs-ai';
    const isFourPlayers = playerCount === 4;

    const configs: PlayerConfig[] = [
      {
        color: 'red',
        name: displayName,
        isAI: false,
        active: true,
      },
      {
        color: 'green',
        name: isAI ? 'Smart AI 1' : 'Player 2',
        isAI,
        difficulty: isAI ? 'hard' : undefined,
        active: isFourPlayers,
      },
      {
        color: 'yellow',
        name: isAI ? (isFourPlayers ? 'Smart AI 2' : 'Smart AI') : isFourPlayers ? 'Player 3' : 'Player 2',
        isAI,
        difficulty: isAI ? 'hard' : undefined,
        active: true,
      },
      {
        color: 'blue',
        name: isAI ? 'Smart AI 3' : 'Player 4',
        isAI,
        difficulty: isAI ? 'hard' : undefined,
        active: isFourPlayers,
      },
    ];

    onStartOfflineGame(configs, mode);
  };

  const handleCopyCode = () => {
    if (!activeRoomCode) return;
    navigator.clipboard?.writeText(activeRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = roomCodeInput.trim().toUpperCase();
    if (!cleaned) return;
    onJoinPrivateRoom(cleaned);
  };

  const handleFriendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = friendQuery.trim();
    if (!query) return;
    const matched = friends?.find(
      (f: any) =>
        f?.username?.toLowerCase() === query.toLowerCase() || f?.uid === query
    );
    await onInviteFriend(matched || { uid: query, username: query });
    setFriendQuery('');
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-5 select-none text-white">
      {/* Incoming Game Invite Banner */}
      {pendingInvite && (
        <div className="royale-card rounded-2xl p-3.5 border-[#FACC15]/50 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#FACC15] uppercase tracking-wider">
              Game Invite
            </p>
            <p className="text-sm font-bold text-white truncate">
              {(pendingInvite as any)?.fromUsername || 'A friend'} invited you to play!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onAcceptInvite(pendingInvite)}
              className="px-3.5 py-1.5 rounded-full royale-btn-gold text-xs font-extrabold cursor-pointer"
            >
              Join
            </button>
            <button
              type="button"
              onClick={onDismissInvite}
              aria-label="Dismiss Invite"
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8B95A8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Multiplayer Error Alert */}
      {mpError && (
        <div className="rounded-2xl px-4 py-3 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold text-center">
          {mpError}
        </div>
      )}

      {/* Top Bar: Crown Logo (Left) & Friends + Settings (Right) */}
      <div className="flex items-center justify-between">
        <div className="p-2 text-[#FACC15]">
          <Crown className="w-7 h-7 fill-[#FACC15]" />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFriendsModal(true)}
            title="Friends & Chat"
            aria-label="Friends"
            className="relative w-11 h-11 rounded-full royale-card flex items-center justify-center text-white/90 hover:text-[#FACC15] transition cursor-pointer"
          >
            <Users className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FACC15] text-[#0B0E17] text-[11px] font-extrabold flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            title="Profile & Settings"
            aria-label="Settings"
            className="w-11 h-11 rounded-full royale-card flex items-center justify-center text-white hover:rotate-45 transition-transform duration-200 cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Branding: 3D White Die + Gold Orbital Swoosh + Ludo Royale */}
      <div className="flex flex-col items-center text-center mt-1 mb-1">
        <div className="relative w-20 h-20 flex items-center justify-center mb-1">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <path
              d="M 14 58 C 12 80, 84 82, 88 46"
              fill="none"
              stroke="#FACC15"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <polygon points="88,40 82,50 93,49" fill="#FACC15" />
          </svg>

          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white via-slate-100 to-slate-300 shadow-xl border border-white/80 transform -rotate-12 flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <span className="w-2 h-2 rounded-full bg-[#0B0E17]" />
              <span className="w-2 h-2 rounded-full bg-[#0B0E17]" />
            </div>
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-[#0B0E17]" />
            </div>
            <div className="flex justify-between">
              <span className="w-2 h-2 rounded-full bg-[#0B0E17]" />
              <span className="w-2 h-2 rounded-full bg-[#0B0E17]" />
            </div>
          </div>
        </div>

        <h1 className="text-[42px] leading-[0.95] font-black italic tracking-tight">
          <span className="block text-white drop-shadow">Ludo</span>
          <span className="block text-[#FACC15] drop-shadow">Royale</span>
        </h1>
      </div>

      {/* User Profile & Live Online Status Card */}
      <div
        onClick={() => setShowSettingsModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowSettingsModal(true)}
        className="royale-card rounded-[24px] p-4 flex items-center justify-between cursor-pointer hover:border-white/15 transition"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-[#0E121D] border border-[#FACC15]/50 flex items-center justify-center shrink-0 shadow-inner">
            <Crown className="w-7 h-7 text-[#FACC15] fill-[#FACC15]" />
          </div>

          <div className="min-w-0">
            <p className="text-white font-bold text-[17px] truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-2 text-sm mt-0.5">
              <span className="text-[#8B95A8] font-medium">Lvl {level}</span>
              <span className="text-[#8B95A8]">•</span>
              <span className="inline-flex items-center gap-1 text-[#FACC15] font-bold">
                <span className="w-4 h-4 rounded-full bg-[#FACC15]/20 border border-[#FACC15] text-[10px] flex items-center justify-center">
                  $
                </span>
                {coins.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-3 py-1.5 rounded-full bg-[#10141F] border border-white/5 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                serverConnected
                  ? 'bg-[#22C55E] shadow-[0_0_8px_#22C55E]'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-semibold text-white">
              {serverConnected ? `${onlineCount} Online` : 'Offline'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8B95A8]" />
        </div>
      </div>

      {/* Mode Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onFindQuickMatch(playerCount)}
          className="royale-btn-gold w-full h-[60px] rounded-full flex items-center justify-center gap-3 text-[20px] font-extrabold tracking-tight cursor-pointer"
        >
          <Play className="w-6 h-6 fill-[#0B0E17] text-[#0B0E17]" />
          <span>Play Online</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPrivateModal(true)}
          className="royale-btn-slate w-full h-[54px] rounded-full flex items-center justify-center gap-2.5 text-[17px] font-bold cursor-pointer"
        >
          <Hash className="w-5 h-5 text-white" />
          <span>Private Room</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => launchOfflineMatch('vs-ai')}
            className="royale-btn-slate h-[54px] rounded-full px-4 flex items-center justify-center gap-2 text-[15px] font-bold cursor-pointer"
          >
            <Bot className="w-5 h-5 text-white shrink-0" />
            <span>Vs Smart AI</span>
          </button>

          <button
            type="button"
            onClick={() => launchOfflineMatch('local')}
            className="royale-btn-slate h-[54px] rounded-full px-4 flex items-center justify-center gap-2 text-[15px] font-bold cursor-pointer"
          >
            <Users className="w-5 h-5 text-white shrink-0" />
            <span>Pass &amp; Play</span>
          </button>
        </div>
      </div>

      {/* PLAYERS Divider & 2/4 Player Toggle */}
      <div className="flex flex-col gap-2.5 mt-1">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-extrabold tracking-wider uppercase text-[#8B95A8]">
            PLAYERS
          </span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlayerCount(2)}
            className={`h-[50px] rounded-full flex items-center justify-center gap-2 text-[15px] font-extrabold transition cursor-pointer ${
              playerCount === 2
                ? 'bg-white text-[#0B0E17] shadow-md'
                : 'royale-btn-slate text-white/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2 Players</span>
          </button>

          <button
            type="button"
            onClick={() => setPlayerCount(4)}
            className={`h-[50px] rounded-full flex items-center justify-center gap-2 text-[15px] font-extrabold transition cursor-pointer ${
              playerCount === 4
                ? 'bg-white text-[#0B0E17] shadow-md'
                : 'royale-btn-slate text-white/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>4 Players</span>
          </button>
        </div>
      </div>

      {/* Quick Matchmaking Searching Overlay */}
      {searchingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-[#181E2C] border border-[#FACC15]/40 p-6 flex flex-col items-center text-center gap-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FACC15]/15 border border-[#FACC15]/40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#FACC15] animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Finding {playerCount}-Player Match
              </h3>
              <p className="text-xs text-[#8B95A8] mt-1">
                Matching you with live players on Royale servers...
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelQuickMatch}
              className="w-full py-3 rounded-full bg-[#10141F] border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition cursor-pointer"
            >
              Cancel Search
            </button>
          </div>
        </div>
      )}

      {/* Private Room Modal / Active Waiting Room */}
      {(showPrivateModal || Boolean(waitingRoom)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] bg-[#0B0E17] border border-white/10 p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#FACC15]" />
                <span>{waitingRoom ? 'Private Waiting Room' : 'Private Room'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (waitingRoom) onLeaveRoom();
                  setShowPrivateModal(false);
                }}
                aria-label="Close Room Modal"
                className="w-9 h-9 rounded-full bg-[#181E2C] flex items-center justify-center text-[#8B95A8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {waitingRoom ? (
              <div className="space-y-4">
                <div className="royale-card rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-[#8B95A8]">
                      Room Code
                    </p>
                    <p className="text-2xl font-black tracking-widest text-[#FACC15]">
                      {activeRoomCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3.5 py-2 rounded-full bg-[#10141F] border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#FACC15]" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#8B95A8]">
                    Players ({activeRoomPlayers.length}/{activeRoomMax})
                  </p>
                  {activeRoomPlayers.map((p: any, i: number) => (
                    <div
                      key={p?.uid || i}
                      className="px-3.5 py-2.5 rounded-xl bg-[#181E2C] border border-white/5 flex items-center justify-between text-sm font-bold"
                    >
                      <span>{p?.username || `Player ${i + 1}`}</span>
                      <span className="text-xs text-[#22C55E]">Ready</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onLeaveRoom();
                      setShowPrivateModal(false);
                    }}
                    className="flex-1 py-3 rounded-full royale-btn-slate text-sm font-bold cursor-pointer"
                  >
                    Leave
                  </button>
                  {isRoomHost && (
                    <button
                      type="button"
                      onClick={() => onStartPrivateRoom(activeRoomCode)}
                      disabled={activeRoomPlayers.length < 2}
                      className="flex-1 py-3 rounded-full royale-btn-gold text-sm font-extrabold disabled:opacity-50 cursor-pointer"
                    >
                      Start Match
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => onCreatePrivateRoom(playerCount)}
                  className="w-full py-3.5 rounded-full royale-btn-gold text-sm font-extrabold cursor-pointer"
                >
                  Create {playerCount}-Player Room
                </button>

                <form onSubmit={handleJoinSubmit} className="space-y-2.5">
                  <label className="block text-xs font-bold text-[#8B95A8]">
                    Join with Room Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      maxLength={8}
                      className="flex-1 px-4 py-3 rounded-full bg-[#181E2C] border border-white/10 text-sm font-bold tracking-widest text-white uppercase focus:outline-none focus:border-[#FACC15]"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-full royale-btn-outline-gold text-sm font-extrabold cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                </form>

                {onlineRooms?.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-bold text-[#8B95A8]">
                      Open Rooms ({onlineRooms.length})
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {onlineRooms.map((room: any, idx: number) => {
                        const code = room?.code || room?.roomCode;
                        return (
                          <div
                            key={code || idx}
                            className="px-3.5 py-2 rounded-xl bg-[#181E2C] flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-white">
                              Room #{code}
                            </span>
                            <button
                              type="button"
                              onClick={() => code && onJoinPrivateRoom(code)}
                              className="px-3 py-1 rounded-full bg-[#FACC15] text-[#0B0E17] font-extrabold cursor-pointer"
                            >
                              Join
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Friends & Invites Modal */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[85vh] rounded-[28px] bg-[#0B0E17] border border-white/10 p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FACC15]" />
                <span>Friends ({friends?.length || 0})</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  onActiveChatChange(null);
                  setShowFriendsModal(false);
                }}
                aria-label="Close Friends"
                className="w-9 h-9 rounded-full bg-[#181E2C] flex items-center justify-center text-[#8B95A8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFriendSubmit} className="flex gap-2">
              <input
                type="text"
                value={friendQuery}
                onChange={(e) => setFriendQuery(e.target.value)}
                placeholder="Invite friend by username..."
                className="flex-1 px-4 py-2.5 rounded-full bg-[#181E2C] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FACC15]"
              />
              <button
                type="submit"
                aria-label="Send Friend Invite"
                className="px-4 py-2.5 rounded-full royale-btn-gold text-xs font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite</span>
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2">
              {incomingRequests?.length > 0 && (
                <p className="text-xs font-bold text-[#FACC15]">
                  Pending Requests ({incomingRequests.length})
                </p>
              )}
              {outgoingRequests?.length > 0 && (
                <p className="text-[11px] text-[#8B95A8]">
                  Sent Requests: {outgoingRequests.length}
                </p>
              )}

              {friends?.length === 0 ? (
                <p className="py-10 text-center text-xs text-[#8B95A8]">
                  No friends added yet. Enter a username above to invite!
                </p>
              ) : (
                friends.map((friend: any, idx: number) => {
                  const fUid = friend?.uid || friend?.id || String(idx);
                  const isOnline = Boolean(
                    presenceMap?.[fUid]?.online || presenceMap?.[fUid]
                  );
                  const unread = unreadCounts?.[fUid] || 0;

                  return (
                    <div
                      key={fUid}
                      onClick={() => onActiveChatChange(fUid)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && onActiveChatChange(fUid)}
                      className="px-3.5 py-3 rounded-2xl bg-[#181E2C] border border-white/5 flex items-center justify-between gap-2 cursor-pointer hover:border-white/15"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isOnline ? 'bg-[#22C55E]' : 'bg-slate-600'
                          }`}
                        />
                        <span className="text-sm font-bold text-white truncate">
                          {friend?.username || 'Friend'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {unread > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FACC15] text-[#0B0E17] text-[11px] font-extrabold">
                            {unread}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInviteFriend(friend);
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#10141F] border border-[#FACC15]/40 text-[#FACC15] text-[11px] font-extrabold flex items-center gap-1 hover:bg-[#FACC15]/15 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Invite</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile & Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-[#0B0E17] border border-white/10 p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Player Profile</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close Profile"
                className="w-9 h-9 rounded-full bg-[#181E2C] flex items-center justify-center text-[#8B95A8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="royale-card rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0E121D] border border-[#FACC15]/50 flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#FACC15] fill-[#FACC15]" />
              </div>
              <div>
                <p className="font-bold text-white">{displayName}</p>
                <p className="text-xs text-[#8B95A8]">
                  Level {level} • {coins.toLocaleString()} Coins
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onUserUpdated({ ...user });
                setShowSettingsModal(false);
              }}
              className="w-full py-3 rounded-full royale-btn-slate text-sm font-bold cursor-pointer"
            >
              Sync Profile
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSettingsModal(false);
                onLogout();
              }}
              className="w-full py-3 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-rose-500/25 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyModal;
