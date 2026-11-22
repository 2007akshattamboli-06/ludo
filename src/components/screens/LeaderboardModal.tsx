import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Loader2, Medal, Trophy, X } from 'lucide-react';
import {
  fetchGlobalLeaderboard,
  LeaderboardEntry,
} from '../../services/leaderboardService';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    uid?: string;
    username?: string;
    coins?: number;
    level?: number;
  } | null;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'coins' | 'level'>('coins');

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    setLoading(true);
    fetchGlobalLeaderboard(50)
      .then((data) => {
        if (active) setEntries(data);
      })
      .catch((err) => {
        console.error('Failed to load leaderboard:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const sortedEntries = useMemo(() => {
    const list = [...entries];
    if (sortBy === 'level') {
      list.sort((a, b) => b.level - a.level || b.coins - a.coins);
    } else {
      list.sort((a, b) => b.coins - a.coins || b.level - a.level);
    }
    return list;
  }, [entries, sortBy]);

  const myRankIndex = useMemo(() => {
    if (!currentUser?.uid) return -1;
    return sortedEntries.findIndex((item) => item.uid === currentUser.uid);
  }, [sortedEntries, currentUser]);

  if (!isOpen) return null;

  const topThree = sortedEntries.slice(0, 3);
  const restList = sortedEntries.slice(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[88vh] rounded-[28px] bg-[#0B0E17] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 bg-[#181E2C]/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FACC15]/15 border border-[#FACC15]/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#FACC15]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Royale Leaderboard
              </h2>
              <p className="text-xs text-[#8B95A8]">Top Global Champions</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Leaderboard"
            className="w-9 h-9 rounded-full bg-[#10141F] border border-white/10 flex items-center justify-center text-[#8B95A8] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Tabs */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-[#181E2C] border border-white/5">
            <button
              type="button"
              onClick={() => setSortBy('coins')}
              className={`py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                sortBy === 'coins'
                  ? 'bg-[#FACC15] text-[#0B0E17] shadow'
                  : 'text-[#8B95A8] hover:text-white'
              }`}
            >
              Richest (Coins)
            </button>
            <button
              type="button"
              onClick={() => setSortBy('level')}
              className={`py-2 rounded-full text-xs font-extrabold transition cursor-pointer ${
                sortBy === 'level'
                  ? 'bg-white text-[#0B0E17] shadow'
                  : 'text-[#8B95A8] hover:text-white'
              }`}
            >
              Highest Level
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#8B95A8]">
              <Loader2 className="w-7 h-7 animate-spin text-[#FACC15]" />
              <span className="text-xs font-medium">Loading rankings...</span>
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#8B95A8]">
              No ranked players yet. Play a match to claim #1!
            </div>
          ) : (
            <>
              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {[1, 0, 2].map((podiumIdx) => {
                  const player = topThree[podiumIdx];
                  if (!player) return <div key={podiumIdx} />;

                  const rank = podiumIdx + 1;
                  const isFirst = rank === 1;

                  return (
                    <div
                      key={player.uid}
                      className={`rounded-2xl p-3 flex flex-col items-center text-center border ${
                        isFirst
                          ? 'bg-gradient-to-b from-[#FACC15]/20 to-[#181E2C] border-[#FACC15]/60 -mt-2 shadow-lg'
                          : 'bg-[#181E2C] border-white/10 mt-1'
                      }`}
                    >
                      <div className="mb-1.5">
                        {isFirst ? (
                          <Crown className="w-6 h-6 text-[#FACC15] fill-[#FACC15]" />
                        ) : (
                          <Medal
                            className={`w-5 h-5 ${
                              rank === 2 ? 'text-slate-300' : 'text-amber-600'
                            }`}
                          />
                        )}
                      </div>

                      <span className="text-[11px] font-black uppercase text-[#FACC15]">
                        #{rank}
                      </span>
                      <p className="text-xs font-bold text-white truncate w-full mt-0.5">
                        {player.username}
                      </p>
                      <p className="text-[11px] font-extrabold text-[#FACC15] mt-1">
                        {sortBy === 'coins'
                          ? `${player.coins.toLocaleString()} $`
                          : `Lvl ${player.level}`}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Rank #4+ List */}
              <div className="space-y-2">
                {restList.map((player, idx) => {
                  const rank = idx + 4;
                  const isMe = currentUser?.uid === player.uid;

                  return (
                    <div
                      key={player.uid}
                      className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between border ${
                        isMe
                          ? 'bg-[#FACC15]/10 border-[#FACC15]/50'
                          : 'bg-[#181E2C] border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-xs font-extrabold text-[#8B95A8]">
                          #{rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {player.username}{' '}
                            {isMe && (
                              <span className="text-[10px] text-[#FACC15] font-extrabold">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-[#8B95A8]">
                            Lvl {player.level}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-extrabold text-[#FACC15] shrink-0">
                        {player.coins.toLocaleString()} $
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sticky Footer: Current User's Rank */}
        {currentUser && (
          <div className="px-5 py-3.5 bg-[#181E2C] border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full bg-[#10141F] text-xs font-black text-[#FACC15]">
                {myRankIndex >= 0 ? `#${myRankIndex + 1}` : 'Unranked'}
              </span>
              <span className="text-sm font-bold text-white truncate max-w-[160px]">
                {currentUser.username || 'You'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-[#FACC15]">
              {(currentUser.coins ?? 0).toLocaleString()} $
            </span>
          </div>
        )}
      </div>
    </div>
  );
};