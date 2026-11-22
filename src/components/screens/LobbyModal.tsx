import React, { useState } from 'react';
import {
  Bot,
  ChevronRight,
  Crown,
  Hash,
  Play,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { UserProfile } from '../../types/auth';

export interface LobbyModalProps {
  userProfile?: UserProfile | null;
  onlineCount?: number;
  isServerOnline?: boolean;
  unreadCount?: number;
  onStartOnlineMatch: (playerCount: 2 | 4) => void;
  onOpenPrivateRoom: (playerCount: 2 | 4) => void;
  onStartAIMatch: (playerCount: 2 | 4) => void;
  onStartLocalMatch: (playerCount: 2 | 4) => void;
  onOpenProfile?: () => void;
  onOpenFriends?: () => void;
  onOpenSettings?: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  userProfile,
  onlineCount = 1,
  isServerOnline = true,
  unreadCount = 0,
  onStartOnlineMatch,
  onOpenPrivateRoom,
  onStartAIMatch,
  onStartLocalMatch,
  onOpenProfile,
  onOpenFriends,
  onOpenSettings,
}) => {
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);

  const displayName = userProfile?.username || 'Player';
  const level = userProfile?.level ?? 1;
  const coins = userProfile?.coins ?? 1500;

  return (
    <div className="royale-canvas min-h-screen w-full flex flex-col items-center px-5 py-6 select-none">
      <div className="relative z-10 w-full max-w-md flex flex-col gap-5">
        {/* Top Bar: Crown (Left) & Friends + Settings (Right) */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Royale Profile"
            className="p-2 rounded-full text-[#FACC15] hover:bg-white/5 transition cursor-pointer"
          >
            <Crown className="w-7 h-7 fill-[#FACC15]" />
          </button>

          <div className="flex items-center gap-2.5">
            {onOpenFriends && (
              <button
                type="button"
                onClick={onOpenFriends}
                aria-label="Friends"
                className="relative w-11 h-11 rounded-full royale-card flex items-center justify-center text-white/90 hover:text-[#FACC15] transition cursor-pointer"
              >
                <Users className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FACC15] text-[#0B0E17] text-[11px] font-extrabold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSettings || onOpenProfile}
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
          onClick={onOpenProfile}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onOpenProfile?.()}
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
                  isServerOnline
                    ? 'bg-[#22C55E] shadow-[0_0_8px_#22C55E]'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-semibold text-white">
                {isServerOnline ? `${onlineCount} Online` : 'Offline'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8B95A8]" />
          </div>
        </div>

        {/* Game Mode Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onStartOnlineMatch(playerCount)}
            className="royale-btn-gold w-full h-[60px] rounded-full flex items-center justify-center gap-3 text-[20px] font-extrabold tracking-tight cursor-pointer"
          >
            <Play className="w-6 h-6 fill-[#0B0E17] text-[#0B0E17]" />
            <span>Play Online</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPrivateRoom(playerCount)}
            className="royale-btn-slate w-full h-[54px] rounded-full flex items-center justify-center gap-2.5 text-[17px] font-bold cursor-pointer"
          >
            <Hash className="w-5 h-5 text-white" />
            <span>Private Room</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onStartAIMatch(playerCount)}
              className="royale-btn-slate h-[54px] rounded-full px-4 flex items-center justify-center gap-2 text-[15px] font-bold cursor-pointer"
            >
              <Bot className="w-5 h-5 text-white shrink-0" />
              <span>Vs Smart AI</span>
            </button>

            <button
              type="button"
              onClick={() => onStartLocalMatch(playerCount)}
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

        {/* Bottom Gold-Outlined CTA */}
        <button
          type="button"
          onClick={() => onStartOnlineMatch(playerCount)}
          className="royale-btn-outline-gold w-full h-[56px] rounded-full mt-1 flex items-center justify-center gap-2.5 text-[17px] font-extrabold cursor-pointer"
        >
          <Search className="w-5 h-5" />
          <span>Find Online Match</span>
        </button>
      </div>
    </div>
  );
};

export default LobbyModal;
