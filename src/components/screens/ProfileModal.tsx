import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Check,
  Coins,
  Copy,
  Edit3,
  Loader2,
  LogOut,
  Percent,
  Save,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { AvatarId, UserProfile } from '../../types/auth';
import { authService } from '../../services/authService';
import { AVATAR_OPTIONS } from './LoginScreen';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUserUpdated: (updated: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  onClose,
  onUserUpdated,
  onLogout,
}) => {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState<AvatarId>(user.avatar);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarMeta =
    AVATAR_OPTIONS.find((a) => a.id === (editing ? avatar : user.avatar)) ?? AVATAR_OPTIONS[0];
  const AvatarIcon = avatarMeta.Icon;

  const losses = Math.max(0, user.matchesPlayed - user.wins);
  const winRate =
    user.matchesPlayed > 0 ? Math.round((user.wins / user.matchesPlayed) * 100) : 0;
  const xpInLevel = user.xp % 300;
  const xpPercent = Math.min(100, Math.round((xpInLevel / 300) * 100));
  const history = user.matchHistory ?? [];

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await authService.updateUserProfile(user.uid, {
        username,
        avatar,
      });
      onUserUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl max-h-[92vh] overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-black uppercase tracking-widest text-amber-400">
          Player Profile
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Profile"
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Identity Card */}
      <div className="p-4 rounded-2xl bg-slate-950/85 border border-slate-800 mb-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarMeta.gradient} flex items-center justify-center text-white shadow-lg shrink-0`}
          >
            <AvatarIcon className="w-8 h-8" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white truncate">{user.username}</h2>
              {user.isGuest && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-800 text-slate-400">
                  Guest
                </span>
              )}
            </div>

            {user.email && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
            )}

            <button
              type="button"
              onClick={handleCopyUid}
              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200"
            >
              <span>ID: {user.uid.slice(0, 10)}...</span>
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setUsername(user.username);
                setAvatar(user.avatar);
                setError(null);
                setEditing(true);
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 text-slate-200 hover:text-slate-950 transition shrink-0"
              title="Edit Profile"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Inline Edit Form */}
        {editing && (
          <form onSubmit={handleSave} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Select Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map(({ id, gradient, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAvatar(id)}
                    className={`aspect-square rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white transition ${
                      avatar === id
                        ? 'ring-2 ring-amber-300 scale-105 shadow-md'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Level & XP Progress */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Level {user.level}
            </span>
            <span className="text-slate-400 font-medium">
              {xpInLevel} / 300 XP
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Coin Balance Banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-400/30 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-amber-200/80">Treasury Balance</p>
            <p className="text-base font-black text-amber-300">
              {user.coins.toLocaleString()} Coins
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300">
          +250 / Win
        </span>
      </div>

      {/* 4-Card Career Statistics */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="p-3 rounded-2xl bg-slate-950/75 border border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <Award className="w-3.5 h-3.5 text-sky-400" /> Matches Played
          </div>
          <p className="text-xl font-black text-white">{user.matchesPlayed}</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/75 border border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Victories
          </div>
          <p className="text-xl font-black text-emerald-400">{user.wins}</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/75 border border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" /> Defeats
          </div>
          <p className="text-xl font-black text-rose-400">{losses}</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/75 border border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
            <Percent className="w-3.5 h-3.5 text-amber-400" /> Win Rate
          </div>
          <p className="text-xl font-black text-amber-300">{winRate}%</p>
        </div>
      </div>

      {/* Recent Match History */}
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Recent Matches
        </h3>
        {history.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
            No completed matches yet. Win a game to build your record!
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                      item.won
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {item.won ? 'Win' : 'Loss'}
                  </span>
                  <span className="font-semibold text-slate-200">{item.mode}</span>
                </div>
                <span className="font-bold text-amber-400">
                  +{item.coinsEarned} 🪙 • +{item.xpEarned} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" /> Sign Out of Account
      </button>
    </div>
  );
};