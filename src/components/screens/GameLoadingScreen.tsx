import React, { useEffect, useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';

const LOADING_TIPS = [
  'Rolling a 6 gives a bonus turn — three 6s in a row forfeits!',
  'Star tiles are Safe Zones where opponents cannot capture your pawn.',
  'Customize your board & pawns anytime from the Palette button in the lobby.',
  'Send live messages & reactions to opponents during online matches!',
];

export const GameLoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState<number>(12);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [logoError, setLogoError] = useState<boolean>(false);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return 94;
        const step = prev < 55 ? 9 : prev < 80 ? 5 : 2;
        return Math.min(94, prev + step);
      });
    }, 180);

    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2400);

    return () => {
      clearInterval(progressTimer);
      clearInterval(tipTimer);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-[radial-gradient(ellipse_at_top,_#1E293B_0%,_#0B0E17_78%)] text-white select-none overflow-hidden relative">
      <style>{`
        @keyframes sastraFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes sastraShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* Top Tag */}
      <div className="pt-4 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#FACC15]/80">
        <Crown className="w-4 h-4 fill-[#FACC15]" />
        <span>Royal Arena Edition</span>
      </div>

      {/* Center Logo & Animated Progress Bar */}
      <div className="w-full max-w-xs flex flex-col items-center text-center gap-6">
        <div
          style={{ animation: 'sastraFloat 2.8s ease-in-out infinite' }}
          className="relative flex flex-col items-center"
        >
          <div className="absolute -inset-4 rounded-full bg-[#FACC15]/15 blur-2xl pointer-events-none" />
          {!logoError ? (
            <img
              src="/logo.png"
              alt="Ludo Sastra"
              onError={() => setLogoError(true)}
              className="relative w-36 h-36 rounded-3xl object-contain drop-shadow-[0_14px_30px_rgba(250,204,21,0.3)]"
            />
          ) : (
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-[#161C2A] border border-[#FACC15]/50 flex items-center justify-center mb-3 shadow-2xl">
                <Crown className="w-10 h-10 text-[#FACC15] fill-[#FACC15]" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tight">
                <span className="text-white">Ludo </span>
                <span className="text-[#FACC15]">Sastra</span>
              </h1>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-slate-300 tracking-wide">
              {progress < 45
                ? 'Loading Board Assets...'
                : progress < 80
                ? 'Syncing Player Profile...'
                : 'Entering Arena...'}
            </span>
            <span className="text-[#FACC15]">{progress}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#161C2A] border border-white/10 p-0.5 overflow-hidden shadow-inner">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#FEF08A] transition-all duration-200 overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div
                style={{ animation: 'sastraShimmer 1.4s infinite' }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Pro Tip Card */}
      <div className="w-full max-w-sm rounded-2xl bg-[#161C2A]/90 border border-white/10 px-4 py-3 flex items-start gap-2.5 shadow-lg">
        <Sparkles className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <span className="font-extrabold text-[#FACC15]">PRO TIP: </span>
          {LOADING_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};