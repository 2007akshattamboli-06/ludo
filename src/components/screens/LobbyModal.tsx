import React, { useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Gauge,
  Hash,
  Loader2,
  LogOut,
  Music,
  Palette,
  Play,
  Settings,
  Smartphone,
  Sparkles,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { GameMode, PlayerConfig } from '../../types/game';
import {
  BOARD_STYLES,
  BoardStyleId,
  PAWN_STYLES,
  PawnStyleId,
} from '../../game/constants/customizationConfig';
import { ProfileModal } from './ProfileModal';
import { FriendsModal } from '../friends/FriendsModal';

export type GameSpeedOption = 'normal' | 'fast' | 'turbo';
type PendingModeAction = 'online' | 'private' | 'vs-ai' | 'local' | null;

export const GAME_SPEED_CONFIG: Record<
  GameSpeedOption,
  { label: string; diceMs: number; moveStepMs: number }
> = {
  normal: { label: 'Normal', diceMs: 900, moveStepMs: 250 },
  fast: { label: 'Fast', diceMs: 550, moveStepMs: 150 },
  turbo: { label: 'Turbo', diceMs: 300, moveStepMs: 80 },
};

export interface GameSettings {
  soundEffects: boolean;
  backgroundMusic: boolean;
  vibration: boolean;
  chatAlerts: boolean;
  gameSpeed: GameSpeedOption;
  boardStyle: BoardStyleId;
  pawnStyle: PawnStyleId;
}

export const SETTINGS_STORAGE_KEY = 'ludo_sastra_settings';

const DEFAULT_SETTINGS: GameSettings = {
  soundEffects: true,
  backgroundMusic: true,
  vibration: true,
  chatAlerts: true,
  gameSpeed: 'normal',
  boardStyle: 'classic',
  pawnStyle: 'classic',
};

const loadStoredSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

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

const CARD_CLASS =
  'bg-[#161C2A]/95 border border-white/10 shadow-xl backdrop-blur-md';
const BTN_GOLD_CLASS =
  'bg-gradient-to-b from-[#FDE047] via-[#FACC15] to-[#EAB308] text-[#0B0E17] shadow-[0_8px_26px_rgba(250,204,21,0.35)] hover:brightness-105 active:scale-[0.99] transition';
const BTN_SLATE_CLASS =
  'bg-[#181E2C] border border-white/10 text-white shadow-md hover:bg-[#21293C] hover:border-white/20 active:scale-[0.99] transition';
const BTN_OUTLINE_GOLD_CLASS =
  'bg-[#181E2C] border-2 border-[#FACC15] text-[#FACC15] hover:bg-[#FACC15]/10 active:scale-[0.99] transition';

const MODE_TITLES: Record<Exclude<PendingModeAction, null>, string> = {
  online: 'Play Online',
  private: 'Private Room',
  'vs-ai': 'Vs Smart AI',
  local: 'Pass & Play',
};

function PawnPreviewIcon({ styleId }: { styleId: PawnStyleId }) {
  if (styleId === 'crown') {
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 via-rose-500 to-rose-700 border-2 border-[#FACC15] flex items-center justify-center shadow-md">
        <Crown className="w-4 h-4 text-[#FEF08A] fill-[#FEF08A]" />
      </div>
    );
  }
  if (styleId === 'gem') {
    return (
      <div className="w-9 h-9 rounded-xl rotate-45 bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700 border-2 border-white flex items-center justify-center shadow-md">
        <div className="w-3.5 h-3.5 bg-white/45" />
      </div>
    );
  }
  if (styleId === 'neon') {
    return (
      <div className="w-9 h-9 rounded-full bg-[#090D16] border-[3px] border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)] flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-emerald-300" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white via-amber-400 to-amber-600 border-2 border-white flex items-center justify-center shadow-md">
      <span className="w-4 h-4 rounded-full border border-white/75" />
    </div>
  );
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
  const [pendingModeAction, setPendingModeAction] =
    useState<PendingModeAction>(null);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadStoredSettings);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const displayName = user?.username || user?.displayName || 'Player';
  const level = typeof user?.level === 'number' ? user.level : 1;
  const coins = typeof user?.coins === 'number' ? user.coins : 1500;
  const userUid = user?.uid || user?.id || '';

  const persistSettings = (updater: (prev: GameSettings) => GameSettings) => {
    setSettings((prev) => {
      const updated = updater(prev);
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('sastra-settings-changed', { detail: updated })
        );
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const toggleSetting = (
    key: 'soundEffects' | 'backgroundMusic' | 'vibration' | 'chatAlerts'
  ) => {
    persistSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setGameSpeed = (gameSpeed: GameSpeedOption) => {
    persistSettings((prev) => ({ ...prev, gameSpeed }));
  };

  const setBoardStyle = (boardStyle: BoardStyleId) => {
    persistSettings((prev) => ({ ...prev, boardStyle }));
  };

  const setPawnStyle = (pawnStyle: PawnStyleId) => {
    persistSettings((prev) => ({ ...prev, pawnStyle }));
  };

  const totalUnread = useMemo(() => {
    const msgUnread = Object.values(unreadCounts || {}).reduce(
      (sum, count) => sum + (Number(count) || 0),
      0
    );
    return msgUnread + (incomingRequests?.length || 0);
  }, [unreadCounts, incomingRequests]);

  const activeRoomCode: string =
    waitingRoom?.code || waitingRoom?.roomCode || '';
  const activeRoomPlayers: any[] = waitingRoom?.players || [];
  const activeRoomMax: number = waitingRoom?.maxPlayers || playerCount;
  const isRoomHost =
    !waitingRoom ||
    waitingRoom?.hostUid === userUid ||
    waitingRoom?.hostId === userUid ||
    activeRoomPlayers[0]?.uid === userUid;

  const launchOfflineMatch = (mode: GameMode, count: 2 | 4) => {
    const isAI = mode === 'vs-ai';
    const isFourPlayers = count === 4;

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
        name: isAI
          ? isFourPlayers
            ? 'Smart AI 2'
            : 'Smart AI'
          : isFourPlayers
          ? 'Player 3'
          : 'Player 2',
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

  const handleConfirmPlayerCount = (count: 2 | 4) => {
    const chosenMode = pendingModeAction;
    setPlayerCount(count);
    setPendingModeAction(null);

    if (chosenMode === 'online') {
      onFindQuickMatch(count);
    } else if (chosenMode === 'private') {
      setShowPrivateModal(true);
    } else if (chosenMode === 'vs-ai') {
      launchOfflineMatch('vs-ai', count);
    } else if (chosenMode === 'local') {
      launchOfflineMatch('local', count);
    }
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

  return (
    <div className="w-full max-w-lg min-h-[100dvh] mx-auto px-5 py-6 flex flex-col justify-between gap-6 select-none text-white">
      {/* Top Section: Header Bar & Notifications */}
      <div className="flex flex-col gap-3">
        {/* Incoming Friend Matchmaking Invite Banner */}
        {pendingInvite && (
          <div
            className={`${CARD_CLASS} rounded-2xl p-3.5 border-[#FACC15]/50 flex items-center justify-between gap-3`}
          >
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#FACC15] uppercase tracking-wider">
                Matchmaking Invite
              </p>
              <p className="text-sm font-bold text-white truncate">
                {pendingInvite?.fromUsername || 'A friend'} invited you to play!
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onAcceptInvite(pendingInvite)}
                className={`px-3.5 py-1.5 rounded-full ${BTN_GOLD_CLASS} text-xs font-extrabold cursor-pointer`}
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

        {/* Top Bar: Crown Logo (Left) & Customize + Friends + Settings (Right) */}
        <div className="flex items-center justify-between">
          <div className="p-2 text-[#FACC15]">
            <Crown className="w-7 h-7 fill-[#FACC15]" />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowCustomizeModal(true)}
              title="Customize Board & Pawns"
              aria-label="Customize"
              className={`w-11 h-11 rounded-full ${CARD_CLASS} flex items-center justify-center text-white/90 hover:text-[#FACC15] transition cursor-pointer`}
            >
              <Palette className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowFriendsModal(true)}
              title="Friends, Chat & Matchmaking"
              aria-label="Friends"
              className={`relative w-11 h-11 rounded-full ${CARD_CLASS} flex items-center justify-center text-white/90 hover:text-[#FACC15] transition cursor-pointer`}
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
              title="Game Settings"
              aria-label="Settings"
              className={`w-11 h-11 rounded-full ${CARD_CLASS} flex items-center justify-center text-white hover:text-[#FACC15] hover:rotate-45 transition-all duration-200 cursor-pointer`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Hero Branding + Profile Card */}
      <div className="flex flex-col gap-6 my-auto">
        {/* Hero Branding: 3D White Die + Gold Orbital Swoosh + Ludo Sastra */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-24 h-24 flex items-center justify-center mb-1.5">
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

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-300 shadow-xl border border-white/80 transform -rotate-12 flex flex-col justify-between p-2.5">
              <div className="flex justify-between">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B0E17]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B0E17]" />
              </div>
              <div className="flex justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B0E17]" />
              </div>
              <div className="flex justify-between">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B0E17]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B0E17]" />
              </div>
            </div>
          </div>

          <h1 className="text-[46px] leading-[0.95] font-black italic tracking-tight">
            <span className="block text-white drop-shadow">Ludo</span>
            <span className="block text-[#FACC15] drop-shadow">Sastra</span>
          </h1>
        </div>

        {/* User Profile & Live Online Status Card (Opens Player Profile) */}
        <div
          onClick={() => setShowProfileModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowProfileModal(true)}
          className={`${CARD_CLASS} rounded-[24px] p-4 flex items-center justify-between cursor-pointer hover:border-white/20 transition`}
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
            <div className="px-3 py-1.5 rounded-full bg-[#10141F] border border-white/10 flex items-center gap-2">
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
      </div>

      {/* Bottom Section: 4 Playing Method Buttons (Opens Player Count Popup on Click) */}
      <div className="flex flex-col gap-3.5 pb-2">
        <button
          type="button"
          onClick={() => setPendingModeAction('online')}
          className={`${BTN_GOLD_CLASS} w-full h-[62px] rounded-full flex items-center justify-center gap-3 text-[20px] font-extrabold tracking-tight cursor-pointer`}
        >
          <Play className="w-6 h-6 fill-[#0B0E17] text-[#0B0E17]" />
          <span>Play Online</span>
        </button>

        <button
          type="button"
          onClick={() => setPendingModeAction('private')}
          className={`${BTN_SLATE_CLASS} w-full h-[56px] rounded-full flex items-center justify-center gap-2.5 text-[17px] font-bold cursor-pointer`}
        >
          <Hash className="w-5 h-5 text-white" />
          <span>Private Room</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPendingModeAction('vs-ai')}
            className={`${BTN_SLATE_CLASS} h-[56px] rounded-full px-4 flex items-center justify-center gap-2 text-[15px] font-bold cursor-pointer`}
          >
            <Bot className="w-5 h-5 text-white shrink-0" />
            <span>Vs Smart AI</span>
          </button>

          <button
            type="button"
            onClick={() => setPendingModeAction('local')}
            className={`${BTN_SLATE_CLASS} h-[56px] rounded-full px-4 flex items-center justify-center gap-2 text-[15px] font-bold cursor-pointer`}
          >
            <Users className="w-5 h-5 text-white shrink-0" />
            <span>Pass &amp; Play</span>
          </button>
        </div>
      </div>

      {/* Popup: Select 2 Players or 4 Players After Clicking Any Game Mode */}
      {pendingModeAction && (
        <div
          onClick={() => setPendingModeAction(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[28px] bg-[#0F1422] border border-[#FACC15]/40 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#FACC15]">
                  {MODE_TITLES[pendingModeAction]}
                </p>
                <h3 className="text-lg font-black text-white">
                  Select Players
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingModeAction(null)}
                aria-label="Close Player Selection"
                className="w-9 h-9 rounded-full bg-[#181E2C] flex items-center justify-center text-[#8B95A8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleConfirmPlayerCount(2)}
                className={`${CARD_CLASS} rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 hover:border-[#FACC15] hover:bg-[#1D2538] active:scale-[0.98] transition cursor-pointer group`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FACC15]/15 border border-[#FACC15]/40 flex items-center justify-center text-[#FACC15] group-hover:scale-105 transition">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-black text-white">2 Players</p>
                  <p className="text-[11px] text-[#8B95A8] mt-0.5">
                    1v1 Classic Duel
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmPlayerCount(4)}
                className={`${CARD_CLASS} rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 hover:border-[#FACC15] hover:bg-[#1D2538] active:scale-[0.98] transition cursor-pointer group`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FACC15]/15 border border-[#FACC15]/40 flex items-center justify-center text-[#FACC15] group-hover:scale-105 transition">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-black text-white">4 Players</p>
                  <p className="text-[11px] text-[#8B95A8] mt-0.5">
                    4-Way Royal Battle
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Matchmaking Searching Popup */}
      {searchingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-[#181E2C] border border-[#FACC15]/40 p-6 flex flex-col items-center text-center gap-5 shadow-2xl">
            <div className="w-full flex items-center justify-between gap-2 px-2">
              <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-[#0E121D] border-2 border-[#FACC15] flex items-center justify-center shadow-lg">
                  <Crown className="w-7 h-7 text-[#FACC15] fill-[#FACC15]" />
                </div>
                <p className="text-xs font-extrabold text-white truncate max-w-[110px]">
                  {displayName}
                </p>
                <span className="text-[10px] font-bold text-[#FACC15]">
                  Lvl {level} • Ready
                </span>
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#FACC15]/15 border border-[#FACC15]/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#FACC15] animate-spin" />
                </div>
                <span className="text-[10px] font-black tracking-widest text-[#FACC15]">
                  VS
                </span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-[#10141F] border border-dashed border-white/25 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#8B95A8] animate-pulse" />
                </div>
                <p className="text-xs font-bold text-[#8B95A8] truncate max-w-[110px]">
                  Searching...
                </p>
                <span className="text-[10px] text-[#8B95A8]">
                  {playerCount}P Arena
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                Finding {playerCount}-Player Match
              </h3>
              <p className="text-xs text-[#8B95A8] mt-1">
                Matching {displayName} with live players...
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

      {/* Private Room Popup / Active Waiting Room */}
      {(showPrivateModal || Boolean(waitingRoom)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] bg-[#0B0E17] border border-white/10 p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#FACC15]" />
                <span>
                  {waitingRoom
                    ? 'Private Waiting Room'
                    : `Private Room (${playerCount}P)`}
                </span>
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
                <div
                  className={`${CARD_CLASS} rounded-2xl p-4 flex items-center justify-between`}
                >
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
                    className={`flex-1 py-3 rounded-full ${BTN_SLATE_CLASS} text-sm font-bold cursor-pointer`}
                  >
                    Leave
                  </button>
                  {isRoomHost && (
                    <button
                      type="button"
                      onClick={() => onStartPrivateRoom(activeRoomCode)}
                      disabled={activeRoomPlayers.length < 2}
                      className={`flex-1 py-3 rounded-full ${BTN_GOLD_CLASS} text-sm font-extrabold disabled:opacity-50 cursor-pointer`}
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
                  className={`w-full py-3.5 rounded-full ${BTN_GOLD_CLASS} text-sm font-extrabold cursor-pointer`}
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
                      onChange={(e) =>
                        setRoomCodeInput(e.target.value.toUpperCase())
                      }
                      placeholder="ENTER CODE"
                      maxLength={8}
                      className="flex-1 px-4 py-3 rounded-full bg-[#181E2C] border border-white/10 text-sm font-bold tracking-widest text-white uppercase focus:outline-none focus:border-[#FACC15]"
                    />
                    <button
                      type="submit"
                      className={`px-5 py-3 rounded-full ${BTN_OUTLINE_GOLD_CLASS} text-sm font-extrabold cursor-pointer`}
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

      {/* Centered Popup: Board & Pawn Studio */}
      {showCustomizeModal && (
        <div
          onClick={() => setShowCustomizeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#0B0E17] border border-white/10 p-5 flex flex-col gap-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#FACC15]" />
                <span>Board &amp; Pawn Studio</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomizeModal(false)}
                aria-label="Close Customize"
                className="w-9 h-9 rounded-full bg-[#181E2C] flex items-center justify-center text-[#8B95A8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#8B95A8] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Board Theme</span>
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(BOARD_STYLES) as BoardStyleId[]).map((bId) => {
                  const item = BOARD_STYLES[bId];
                  const active = settings.boardStyle === bId;
                  return (
                    <button
                      key={bId}
                      type="button"
                      onClick={() => setBoardStyle(bId)}
                      className={`p-3 rounded-2xl text-left flex flex-col gap-2 transition cursor-pointer ${
                        active
                          ? 'bg-[#1D2538] border-2 border-[#FACC15] shadow-lg'
                          : `${CARD_CLASS} hover:border-white/25`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {item.previewSwatches.map((hex, i) => (
                            <span
                              key={i}
                              className="w-4 h-4 rounded-full border border-white/25 shadow-sm"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                        {active && (
                          <span className="w-5 h-5 rounded-full bg-[#FACC15] text-[#0B0E17] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#8B95A8] leading-tight">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#8B95A8] flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Pawn Design</span>
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {(Object.keys(PAWN_STYLES) as PawnStyleId[]).map((pId) => {
                  const item = PAWN_STYLES[pId];
                  const active = settings.pawnStyle === pId;
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => setPawnStyle(pId)}
                      className={`p-3 rounded-2xl text-left flex flex-col gap-2.5 transition cursor-pointer ${
                        active
                          ? 'bg-[#1D2538] border-2 border-[#FACC15] shadow-lg'
                          : `${CARD_CLASS} hover:border-white/25`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <PawnPreviewIcon styleId={pId} />
                        {active && (
                          <span className="w-5 h-5 rounded-full bg-[#FACC15] text-[#0B0E17] flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#8B95A8] leading-tight">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCustomizeModal(false)}
              className={`w-full py-3 rounded-full ${BTN_GOLD_CLASS} text-sm font-extrabold cursor-pointer mt-1`}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Centered Popup: Game Settings */}
      {showSettingsModal && (
        <div
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#0B0E17] border border-white/10 p-5 flex flex-col gap-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FACC15]" />
                <span>Game Settings</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close Settings"
                className="w-9 h-9 rounded-full bg-[#181E2C] flex items-center justify-center text-[#8B95A8] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => toggleSetting('soundEffects')}
                className={`${CARD_CLASS} rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-white/20`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#10141F] border border-white/5 flex items-center justify-center text-[#FACC15]">
                    {settings.soundEffects ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-[#8B95A8]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Sound Effects</p>
                    <p className="text-[11px] text-[#8B95A8]">
                      Dice roll, capture &amp; win SFX
                    </p>
                  </div>
                </div>
                <span
                  className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${
                    settings.soundEffects
                      ? 'bg-[#FACC15]'
                      : 'bg-[#10141F] border border-white/10'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full transition-transform ${
                      settings.soundEffects
                        ? 'translate-x-5 bg-[#0B0E17]'
                        : 'translate-x-0 bg-[#8B95A8]'
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('backgroundMusic')}
                className={`${CARD_CLASS} rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-white/20`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#10141F] border border-white/5 flex items-center justify-center">
                    <Music
                      className={`w-5 h-5 ${
                        settings.backgroundMusic
                          ? 'text-[#FACC15]'
                          : 'text-[#8B95A8]'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Background Music
                    </p>
                    <p className="text-[11px] text-[#8B95A8]">
                      Lobby &amp; board theme audio
                    </p>
                  </div>
                </div>
                <span
                  className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${
                    settings.backgroundMusic
                      ? 'bg-[#FACC15]'
                      : 'bg-[#10141F] border border-white/10'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full transition-transform ${
                      settings.backgroundMusic
                        ? 'translate-x-5 bg-[#0B0E17]'
                        : 'translate-x-0 bg-[#8B95A8]'
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('vibration')}
                className={`${CARD_CLASS} rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-white/20`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#10141F] border border-white/5 flex items-center justify-center">
                    <Smartphone
                      className={`w-5 h-5 ${
                        settings.vibration ? 'text-[#FACC15]' : 'text-[#8B95A8]'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Vibration</p>
                    <p className="text-[11px] text-[#8B95A8]">
                      Haptic feedback on turns &amp; hits
                    </p>
                  </div>
                </div>
                <span
                  className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${
                    settings.vibration
                      ? 'bg-[#FACC15]'
                      : 'bg-[#10141F] border border-white/10'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full transition-transform ${
                      settings.vibration
                        ? 'translate-x-5 bg-[#0B0E17]'
                        : 'translate-x-0 bg-[#8B95A8]'
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('chatAlerts')}
                className={`${CARD_CLASS} rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-white/20`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#10141F] border border-white/5 flex items-center justify-center">
                    <Bell
                      className={`w-5 h-5 ${
                        settings.chatAlerts ? 'text-[#FACC15]' : 'text-[#8B95A8]'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Chat &amp; Invite Alerts
                    </p>
                    <p className="text-[11px] text-[#8B95A8]">
                      Notify on messages &amp; match invites
                    </p>
                  </div>
                </div>
                <span
                  className={`w-12 h-7 rounded-full p-1 flex items-center transition-colors ${
                    settings.chatAlerts
                      ? 'bg-[#FACC15]'
                      : 'bg-[#10141F] border border-white/10'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full transition-transform ${
                      settings.chatAlerts
                        ? 'translate-x-5 bg-[#0B0E17]'
                        : 'translate-x-0 bg-[#8B95A8]'
                    }`}
                  />
                </span>
              </button>

              <div
                className={`${CARD_CLASS} rounded-2xl p-3.5 flex flex-col gap-2.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#10141F] border border-white/5 flex items-center justify-center text-[#FACC15]">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Dice &amp; Token Speed
                      </p>
                      <p className="text-[11px] text-[#8B95A8]">
                        Dice {GAME_SPEED_CONFIG[settings.gameSpeed].diceMs}ms •
                        Move {GAME_SPEED_CONFIG[settings.gameSpeed].moveStepMs}
                        ms/step
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#FACC15]">
                    {GAME_SPEED_CONFIG[settings.gameSpeed].label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'fast', 'turbo'] as const).map((speedKey) => (
                    <button
                      key={speedKey}
                      type="button"
                      onClick={() => setGameSpeed(speedKey)}
                      className={`py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                        settings.gameSpeed === speedKey
                          ? 'bg-[#FACC15] text-[#0B0E17]'
                          : 'bg-[#10141F] text-[#8B95A8] hover:text-white border border-white/10'
                      }`}
                    >
                      {GAME_SPEED_CONFIG[speedKey].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSettingsModal(false);
                onLogout();
              }}
              className="w-full py-3 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-rose-500/25 transition cursor-pointer mt-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Centered Popup: Friends List, Direct Chat & Matchmaking Invite */}
      {showFriendsModal && (
        <div
          onClick={() => {
            onActiveChatChange(null);
            setShowFriendsModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <FriendsModal
              user={user}
              friends={friends}
              incomingRequests={incomingRequests}
              outgoingRequests={outgoingRequests}
              presenceMap={presenceMap}
              unreadCounts={unreadCounts}
              onActiveChatChange={onActiveChatChange}
              onClose={() => {
                onActiveChatChange(null);
                setShowFriendsModal(false);
              }}
              onInviteFriend={(friend: any) => {
                onInviteFriend(friend);
                setShowFriendsModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Centered Popup: Player Profile */}
      {showProfileModal && (
        <div
          onClick={() => setShowProfileModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <ProfileModal
              user={user}
              onClose={() => setShowProfileModal(false)}
              onUserUpdated={onUserUpdated}
              onLogout={() => {
                setShowProfileModal(false);
                onLogout();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyModal;