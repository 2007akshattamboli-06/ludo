import React from 'react';
import { Bot, Crown, User, WifiOff } from 'lucide-react';
import { PlayerConfig, Token } from '../../types/game';
import { PlayerReactionPayload } from '../../types/multiplayer';
import { HOME_GOAL_STEPS, PLAYER_THEMES } from '../../game/constants/boardConstants';

interface PlayerPodProps {
  player: PlayerConfig;
  tokens: Token[];
  isTurn: boolean;
  isWinner: boolean;
  isMe?: boolean;
  disconnected?: boolean;
  reaction?: PlayerReactionPayload | null;
}

export const PlayerPod: React.FC<PlayerPodProps> = ({
  player,
  tokens,
  isTurn,
  isWinner,
  isMe = false,
  disconnected = false,
  reaction = null,
}) => {
  const theme = PLAYER_THEMES[player.color];
  const myTokens = tokens.filter((t) => t.color === player.color);
  const finishedCount = myTokens.filter((t) => t.steps >= HOME_GOAL_STEPS).length;

  return (
    <div
      className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all duration-300 ${
        isTurn
          ? 'bg-slate-900/95 border-amber-400 shadow-lg scale-[1.02]'
          : 'bg-slate-900/60 border-slate-800 opacity-80'
      }`}
    >
      {/* Floating Emoji / Quick Chat Bubble */}
      {reaction && (
        <div className="absolute -top-7 right-2 z-20 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg animate-bounce flex items-center gap-1">
          <span>{reaction.emoji}</span>
          {reaction.text && <span>{reaction.text}</span>}
        </div>
      )}

      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-inner shrink-0"
          style={{ backgroundColor: theme.primary }}
        >
          {isWinner ? (
            <Crown className="w-5 h-5 text-amber-200" />
          ) : disconnected ? (
            <WifiOff className="w-4 h-4 text-slate-200" />
          ) : player.isAI ? (
            <Bot className="w-5 h-5" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-slate-100 truncate">{player.name}</span>
            {isMe && (
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                You
              </span>
            )}
            {isTurn && !disconnected && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {disconnected ? 'Disconnected' : `${finishedCount}/4 Home`}
          </p>
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        {myTokens.map((t) => (
          <span
            key={t.id}
            className="w-2.5 h-2.5 rounded-full border border-white/30"
            style={{
              backgroundColor:
                t.steps >= HOME_GOAL_STEPS
                  ? '#FBBF24'
                  : t.steps >= 0
                  ? theme.primary
                  : '#1E293B',
            }}
          />
        ))}
      </div>
    </div>
  );
};