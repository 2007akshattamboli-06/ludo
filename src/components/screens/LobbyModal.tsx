import React, { useState } from 'react';
import {
  Bot,
  Check,
  ChevronRight,
  Coins,
  Copy,
  Crown,
  Gamepad2,
  Globe,
  Hash,
  Loader2,
  Play,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { AIDifficulty, GameMode, PlayerColor, PlayerConfig } from '../../types/game';
import { UserProfile } from '../../types/auth';
import {
  FriendProfile,
  FriendRequestRecord,
  GameInvitePayload,
} from '../../types/friends';
import { LobbyMode, OnlineRoomState } from '../../types/multiplayer';
import { COLOR_ORDER, PLAYER_THEMES } from '../../game/constants/boardConstants';
import { AVATAR_OPTIONS } from './LoginScreen';
import { ProfileModal } from './ProfileModal';
import { FriendsModal } from '../friends/FriendsModal';

interface LobbyModalProps {
  user: UserProfile;
  onlineCount: number;
  serverConnected: boolean;
  searchingMatch: boolean;
  waitingRoom: OnlineRoomState | null;
  mpError: string | null;
  friends: FriendProfile[];
  incomingRequests: FriendRequestRecord[];
  outgoingRequests: FriendRequestRecord[];
  presenceMap: Record<string, { online: boolean; inGame: boolean }>;
  unreadCounts: Record<string, number>;
  pendingInvite: GameInvitePayload | null;
  onActiveChatChange?: (friendUid: string | null) => void;
  onAcceptInvite: (invite: GameInvitePayload) => void;
  onDismissInvite: () => void;
  onInviteFriend: (friend: FriendProfile) => void;
  onUserUpdated: (updated: UserProfile) => void;
  onLogout: () => void;
  onStartOfflineGame: (players: PlayerConfig[], mode: GameMode) => void;
  onFindQuickMatch: (maxPlayers: 2 | 4) => void;
  onCancelQuickMatch: () => void;
  onCreatePrivateRoom: (maxPlayers: 2 | 3 | 4) => void;
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
  const [showProfile, setShowProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [mode, setMode] = useState<LobbyMode>('online-quick');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (showProfile) {
    return (
      <ProfileModal
        user={user}
        onClose={() => setShowProfile(false)}
        onUserUpdated={onUserUpdated}
        onLogout={onLogout}
      />
    );
  }

  if (showFriends) {
    return (
      <FriendsModal
        user={user}
        friends={friends}
        incomingRequests={incomingRequests}
        outgoingRequests={outgoingRequests}
        presenceMap={presenceMap}
        unreadCounts={unreadCounts}
        onActiveChatChange={onActiveChatChange}
        onClose={() => setShowFriends(false)}
        onInviteFriend={(friend) => {
          setShowFriends(false);
          onInviteFriend(friend);
        }}
      />
    );
  }

  const avatarMeta =
    AVATAR_OPTIONS.find((a) => a.id === user.avatar) ?? AVATAR_OPTIONS[0];
  const AvatarIcon = avatarMeta.Icon;

  const onlineFriends = friends.filter((f) => presenceMap[f.uid]?.online);
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);
  const totalSocialBadge = incomingRequests.length + totalUnread;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleOfflineLaunch = () => {
    const activeColors: PlayerColor[] =
      playerCount === 2 ? ['red', 'yellow'] : COLOR_ORDER.slice(0, playerCount);

    const configs: PlayerConfig[] = COLOR_ORDER.map((color) => {
      const isActive = activeColors.includes(color);
      const isHuman = mode === 'local' ? true : color === 'red';
      const playerName =
        color === 'red'
          ? user.username
          : isHuman
          ? `Player ${PLAYER_THEMES[color].name}`
          : `${PLAYER_THEMES[color].name} Bot`;

      return {
        color,
        name: playerName,
        isAI: !isHuman,
        difficulty,
        active: isActive,
      };
    });

    onStartOfflineGame(configs, mode === 'local' ? 'local' : 'vs-ai');
  };

  if (waitingRoom && waitingRoom.status === 'WAITING') {
    const isHost = waitingRoom.hostUid === user.uid;
    const joinedUids = new Set(waitingRoom.players.map((p) => p.uid));
    const invitableFriends = onlineFriends.filter((f) => !joinedUids.has(f.uid));

    return (
      <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Private Room Lobby
          </span>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" /> Leave
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 text-center mb-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-1">
            Share Room Code
          </p>
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-3xl font-black tracking-[0.22em] text-amber-400">
              {waitingRoom.code}
            </span>
            <button
              type="button"
              onClick={() => handleCopyCode(waitingRoom.code)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {invitableFriends.length > 0 && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Invite Online Friends
            </p>
            <div className="flex flex-wrap gap-1.5">
              {invitableFriends.map((f) => (
                <button
                  key={f.uid}
                  type="button"
                  onClick={() => onInviteFriend(f)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-400 text-xs font-bold text-slate-200 hover:text-slate-950 transition"
                >
                  <Gamepad2 className="w-3.5 h-3.5" /> {f.username}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 mb-5">
          <p className="text-xs font-semibold text-slate-400">
            Players Joined ({waitingRoom.players.length}/{waitingRoom.maxPlayers})
          </p>
          {waitingRoom.players.map((p) => {
            const theme = PLAYER_THEMES[p.color];
            return (
              <div
                key={p.uid}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span className="text-sm font-bold text-white">{p.username}</span>
                </div>
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  {p.uid === waitingRoom.hostUid ? 'Host' : theme.name}
                </span>
              </div>
            );
          })}
        </div>

        {mpError && (
          <p className="text-xs text-rose-400 text-center mb-3 font-semibold">{mpError}</p>
        )}

        {isHost ? (
          <button
            type="button"
            disabled={waitingRoom.players.length < 2}
            onClick={() => onStartPrivateRoom(waitingRoom.code)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            {waitingRoom.players.length < 2 ? 'Waiting for Friend...' : 'Start Match Now'}
          </button>
        ) : (
          <div className="py-3 rounded-2xl bg-slate-800/70 text-center text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            Waiting for host to start...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
      {/* Live Game Invite Banner */}
      {pendingInvite && (
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-amber-500/20 border border-emerald-400/50 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black text-emerald-300 truncate">
              {pendingInvite.fromUsername} invited you!
            </p>
            <p className="text-[11px] text-slate-300">Room: {pendingInvite.roomCode}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onAcceptInvite(pendingInvite)}
              className="px-3 py-1.5 rounded-xl bg-emerald-400 text-slate-950 text-xs font-black uppercase"
            >
              Join
            </button>
            <button
              type="button"
              onClick={onDismissInvite}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Row: Profile Card + Friends Button with Unread/Request Badge */}
      <div className="flex items-stretch gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="flex-1 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/85 hover:bg-slate-950 border border-slate-800 hover:border-amber-400/50 text-left transition group min-w-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarMeta.gradient} flex items-center justify-center text-white shrink-0 shadow`}
            >
              <AvatarIcon className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white truncate">{user.username}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Lvl {user.level}</span>
                <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                  <Coins className="w-3 h-3" /> {user.coins.toLocaleString()}
                </span>
                <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                  <Trophy className="w-3 h-3" /> {user.wins}W
                </span>
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowFriends(true)}
          className="relative px-3.5 rounded-2xl bg-slate-950/85 hover:bg-amber-400 border border-slate-800 hover:border-amber-300 text-slate-200 hover:text-slate-950 flex flex-col items-center justify-center gap-0.5 transition shrink-0"
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase">Friends</span>
          {totalSocialBadge > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow ${
                incomingRequests.length > 0
                  ? 'bg-rose-500 text-white'
                  : 'bg-sky-400 text-slate-950'
              }`}
            >
              {totalSocialBadge > 9 ? '9+' : totalSocialBadge}
            </span>
          )}
        </button>
      </div>

      {/* Title + Live Server Pill */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950">
            <Crown className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            LUDO <span className="text-amber-400">ROYALE</span>
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-bold">
          <span
            className={`w-2 h-2 rounded-full ${
              serverConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300">
            {serverConnected ? `${onlineCount} Online` : 'Server Offline'}
          </span>
        </div>
      </div>

      {/* 4 Game Modes Grid */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button
          type="button"
          onClick={() => {
            setMode('online-quick');
            if (playerCount === 3) setPlayerCount(2);
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold border transition ${
            mode === 'online-quick'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" /> Play Online
        </button>

        <button
          type="button"
          onClick={() => setMode('online-private')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold border transition ${
            mode === 'online-private'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Hash className="w-4 h-4" /> Private Room
        </button>

        <button
          type="button"
          onClick={() => setMode('vs-ai')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold border transition ${
            mode === 'vs-ai'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Bot className="w-4 h-4" /> Vs Smart AI
        </button>

        <button
          type="button"
          onClick={() => setMode('local')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold border transition ${
            mode === 'local'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
              : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Pass & Play
        </button>
      </div>

      {mpError && (
        <div className="p-2.5 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
          {mpError}
        </div>
      )}

      {/* Player Count */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Players
        </label>
        <div className={`grid ${mode === 'online-quick' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
          {(mode === 'online-quick' ? ([2, 4] as const) : ([2, 3, 4] as const)).map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => setPlayerCount(cnt)}
              className={`py-2.5 rounded-xl text-sm font-bold border transition ${
                playerCount === cnt
                  ? 'bg-slate-100 text-slate-950 border-white'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700'
              }`}
            >
              {cnt} Players
            </button>
          ))}
        </div>
      </div>

      {mode === 'online-quick' && (
        searchingMatch ? (
          <div className="space-y-2.5">
            <div className="py-3.5 rounded-2xl bg-slate-950 border border-amber-400/40 flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching for {playerCount}P opponent...
            </div>
            <button
              type="button"
              onClick={onCancelQuickMatch}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase"
            >
              Cancel Search
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!serverConnected}
            onClick={() => onFindQuickMatch(playerCount === 4 ? 4 : 2)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            <Globe className="w-5 h-5" /> Find Online Match
          </button>
        )
      )}

      {mode === 'online-private' && (
        <div className="space-y-3">
          <button
            type="button"
            disabled={!serverConnected}
            onClick={() => onCreatePrivateRoom(playerCount)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg disabled:opacity-50"
          >
            Create Private Room
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              disabled={!serverConnected || joinCode.trim().length < 4}
              onClick={() => onJoinPrivateRoom(joinCode)}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider disabled:opacity-50"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {mode === 'vs-ai' && (
        <>
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Bot Intelligence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition ${
                    difficulty === lvl
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleOfflineLaunch}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl"
          >
            <Play className="w-5 h-5 fill-slate-950" /> START MATCH
          </button>
        </>
      )}

      {mode === 'local' && (
        <button
          type="button"
          onClick={handleOfflineLaunch}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl"
        >
          <Play className="w-5 h-5 fill-slate-950" /> START PASS & PLAY
        </button>
      )}
    </div>
  );
};