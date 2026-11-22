import React, { useState } from 'react';
import {
  AlertCircle,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gem,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Shield,
  Sparkles,
  Swords,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';
import { isFirebaseConfigured } from '../../config/firebase';
import { authService } from '../../services/authService';
import { AvatarId, UserProfile } from '../../types/auth';

interface LoginScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

export const AVATAR_OPTIONS: {
  id: AvatarId;
  label: string;
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'crown', label: 'Royal', gradient: 'from-amber-400 to-orange-500', Icon: Crown },
  { id: 'flame', label: 'Blaze', gradient: 'from-rose-500 to-red-700', Icon: Flame },
  { id: 'shield', label: 'Knight', gradient: 'from-blue-500 to-indigo-700', Icon: Shield },
  { id: 'zap', label: 'Volt', gradient: 'from-emerald-400 to-teal-600', Icon: Zap },
  { id: 'gem', label: 'Mystic', gradient: 'from-fuchsia-500 to-purple-700', Icon: Gem },
  { id: 'swords', label: 'Striker', gradient: 'from-cyan-400 to-sky-600', Icon: Swords },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>('crown');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchTab = (next: 'login' | 'register') => {
    setTab(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const profile =
        tab === 'login'
          ? await authService.loginWithEmail(email, password)
          : await authService.registerWithEmail(username, email, password, avatar);
      onAuthenticated(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const profile = await authService.loginWithGoogle(avatar);
      onAuthenticated(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setError(null);
    setLoading(true);
    try {
      const guest = await authService.loginAsGuest(avatar);
      onAuthenticated(guest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
          <Crown className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          <span className="text-amber-400">LUDO</span>
        </h1>
      </div>

      {/* Missing .env Warning */}
      {!isFirebaseConfigured && (
        <div className="p-3 mb-4 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs leading-relaxed">
          <p className="font-bold text-amber-300 mb-0.5">Firebase Keys Missing</p>
          Add <code className="text-white">VITE_FIREBASE_*</code> values to{' '}
          <code className="text-white">D:\Ludo\.env</code> and restart{' '}
          <code className="text-white">npm run dev</code>.
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 mb-5">
        <button
          type="button"
          disabled={loading}
          onClick={() => switchTab('login')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            tab === 'login'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" /> Sign In
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => switchTab('register')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            tab === 'register'
              ? 'bg-amber-400 text-slate-950 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Register
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Avatar Picker on Register */}
        {tab === 'register' && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map(({ id, gradient, Icon }) => {
                const selected = avatar === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={loading}
                    onClick={() => setAvatar(id)}
                    className={`aspect-square rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white transition ${
                      selected
                        ? 'ring-2 ring-amber-300 scale-105 shadow-lg'
                        : 'opacity-65 hover:opacity-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Username (Register only) */}
        {tab === 'register' && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Player Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="RoyaleKing"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label="Toggle Password Visibility"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-1 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 font-black text-sm tracking-wide uppercase shadow-lg hover:brightness-105 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 transition"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {tab === 'login' ? 'Enter Arena' : 'Create Account (+1,500 Coins)'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
          <span className="px-2.5 bg-slate-900 text-slate-500 font-bold">Quick Access</span>
        </div>
      </div>

      {/* Google + Guest Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow disabled:opacity-60 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={handleGuestPlay}
          className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> Continue as Guest
        </button>
      </div>
    </div>
  );
};