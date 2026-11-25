import React, { useEffect, useState } from 'react';
import {
  Check,
  Coins,
  Crown,
  RotateCcw,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { PlayerColor } from '../../types/game';
import { UserProfile } from '../../types/auth';
import { FriendProfile, FriendRequestRecord } from '../../types/friends';
import { PLAYER_THEMES } from '../../game/constants/boardConstants';
import { friendService } from '../../services/friendService';

export interface MatchParticipant {
  uid?: string;
  color: PlayerColor;
  name: string;
  isAI?: boolean;
  isMe?: boolean;
}

interface MatchResultModalProps {
  winnerColor: PlayerColor;
  participants: MatchParticipant[];
  currentUser: UserProfile;
  isOnlineMatch: boolean;
  friends: FriendProfile[];
  outgoingRequests: FriendRequestRecord[];
  onBackToLobby: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  winnerColor,
  participants,
  currentUser,
  isOnlineMatch,
  friends,
  outgoingRequests,
  onBackToLobby,
}) => {
  const winnerPlayer = participants.find((p) => p.color === winnerColor);
  const winnerDisplayName =
    winnerPlayer?.name || PLAYER_THEMES[winnerColor].name;

  const didIWin = Boolean(
    winnerPlayer?.isMe ||
      (winnerPlayer?.uid && winnerPlayer.uid === currentUser.uid)
  );

  const targetCoins = didIWin
    ? isOnlineMatch
      ? 250
      : 100
    : isOnlineMatch
    ? 35
    : 15;
  const targetXp = didIWin
    ? isOnlineMatch
      ? 120
      : 50
    : isOnlineMatch
    ? 30
    : 15;

  const [animatedCoins, setAnimatedCoins] = useState<number>(0);
  const [animatedXp, setAnimatedXp] = useState<number>(0);
  const [xpBarWidth, setXpBarWidth] = useState<number>(15);
  const [sendingUid, setSendingUid] = useState<string | null>(null);
  const [sentUids, setSentUids] = useState<Record<string, boolean>>({});
  const [friendFeedback, setFriendFeedback] = useState<string | null>(null);

  useEffect(() => {
    const duration = 1100;
    const steps = 28;
    let step = 0;

    const timer = setInterval(() => {
      step += 1;
      const ratio = Math.min(1, step / steps);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setAnimatedCoins(Math.round(targetCoins * eased));
      setAnimatedXp(Math.round(targetXp * eased));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    const barTimer = setTimeout(() => {
      setXpBarWidth(didIWin ? 88 : 54);
    }, 150);

    return () => {
      clearInterval(timer);
      clearTimeout(barTimer);
    };
  }, [didIWin, targetCoins, targetXp]);

  const handleSendFriendRequest = async (opponent: MatchParticipant) => {
    if (!opponent.uid || sendingUid) return;
    setSendingUid(opponent.uid);
    setFriendFeedback(null);
    try {
      const msg = await friendService.sendFriendRequest(
        currentUser,
        opponent.uid
      );
      setSentUids((prev) => ({ ...prev, [opponent.uid!]: true }));
      setFriendFeedback(msg);
    } catch (err: any) {
      setFriendFeedback(err?.message || 'Could not send request.');
    } finally {
      setSendingUid(null);
    }
  };

  const orderedPlayers = [...participants].sort((a, b) => {
    if (a.color === winnerColor) return -1;
    if (b.color === winnerColor) return 1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <style>{`
        @keyframes rewardPop {
          0% { opacity: 0; transform: scale(0.86) translateY(18px); }
          100% { opacity: 1; transform: scale(1) translateY(0px); }
        }
        @keyframes coinPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.14); }
        }
      `}</style>

      <div
        style={{ animation: 'rewardPop 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
        className="w-full max-w-md rounded-[30px] bg-[#0F1422] border border-[#FACC15]/40 p-5 sm:p-6 flex flex-col gap-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.85)] relative overflow-hidden"
      >
        {/* Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-40 rounded-full bg-[#FACC15]/20 blur-3xl pointer-events-none" />

        {/* Trophy & Actual Winner Name */}
        <div className="relative flex flex-col items-center text-center pt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FDE047] via-[#FACC15] to-[#D97706] text-[#0B0E17] flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.45)] mb-3">
            <Trophy className="w-9 h-9 stroke-[2.3]" />
          </div>

          <span className="px-3 py-0.5 rounded-full bg-[#FACC15]/15 border border-[#FACC15]/40 text-[11px] font-extrabold uppercase tracking-widest text-[#FACC15] mb-1">
            {didIWin ? 'Victory!' : 'Match Finished'}
          </span>

          <h2 className="text-2xl font-black tracking-tight text-white">
            {winnerDisplayName} Wins!
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {didIWin
              ? 'Dominated the arena and claimed the royal crown!'
              : `${winnerDisplayName} finished all 4 tokens first.`}
          </p>
        </div>

        {/* Animated Coin & XP Reward Card */}
        <div className="rounded-2xl bg-[#161C2A] border border-[#FACC15]/30 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Match Rewards</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              +{animatedXp} XP
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-[#0B0E17] border border-white/10 p-3 flex items-center gap-2.5">
              <div
                style={{ animation: 'coinPulse 1.2s ease-in-out infinite' }}
                className="w-10 h-10 rounded-full bg-[#FACC15]/20 border border-[#FACC15] flex items-center justify-center text-[#FACC15] shrink-0"
              >
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-black text-[#FACC15] leading-none">
                  +{animatedCoins}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Coins Earned</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#0B0E17] border border-white/10 p-3 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
                <span className="text-white">Lvl {currentUser.level || 1}</span>
                <span className="text-[#FACC15]">+{animatedXp} XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-1000 ease-out"
                  style={{ width: `${xpBarWidth}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Players Standings & Add Friend Button */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Players in Match
          </p>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {orderedPlayers.map((p) => {
              const isChampion = p.color === winnerColor;
              const isMe = Boolean(
                p.isMe || (p.uid && p.uid === currentUser.uid)
              );
              const canAddFriend = Boolean(
                isOnlineMatch && p.uid && !isMe && !p.isAI
              );
              const alreadyFriend = Boolean(
                p.uid && friends.some((f) => f.uid === p.uid)
              );
              const alreadyRequested = Boolean(
                p.uid &&
                  (sentUids[p.uid] ||
                    outgoingRequests.some((r) => r.toUid === p.uid))
              );

              return (
                <div
                  key={`${p.color}-${p.name}`}
                  className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                    isChampion
                      ? 'bg-[#1B2234] border-[#FACC15]/50'
                      : 'bg-[#161C2A] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/50"
                      style={{
                        backgroundColor: PLAYER_THEMES[p.color].primary,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        {isChampion ? (
                          <>
                            <Crown className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
                            <span className="text-[#FACC15] font-bold">
                              1st • Champion
                            </span>
                          </>
                        ) : (
                          <span>Runner Up</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {canAddFriend && (
                    <div className="shrink-0">
                      {alreadyFriend ? (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Friends</span>
                        </span>
                      ) : alreadyRequested ? (
                        <span className="px-3 py-1.5 rounded-full bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-[#FACC15]" />
                          <span>Sent</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={sendingUid === p.uid}
                          onClick={() => handleSendFriendRequest(p)}
                          className="px-3 py-1.5 rounded-full bg-[#FACC15] text-[#0B0E17] text-xs font-extrabold flex items-center gap-1 hover:brightness-105 active:scale-95 transition cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>
                            {sendingUid === p.uid ? 'Sending...' : 'Add Friend'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {friendFeedback && (
            <p className="text-xs font-semibold text-center text-[#FACC15] pt-0.5">
              {friendFeedback}
            </p>
          )}
        </div>

        {/* Back to Lobby Button */}
        <button
          type="button"
          onClick={onBackToLobby}
          className="w-full py-3.5 rounded-full bg-gradient-to-b from-[#FDE047] via-[#FACC15] to-[#EAB308] text-[#0B0E17] font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_26px_rgba(250,204,21,0.35)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer mt-1"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Back to Lobby</span>
        </button>
      </div>
    </div>
  );
};