import React, { useEffect, useRef, useState } from 'react';
import { PlayerColor } from '../../types/game';
import { PLAYER_THEMES } from '../../game/constants/boardConstants';

interface Dice3DProps {
  value: number;
  rolling: boolean;
  canRoll: boolean;
  activeColor: PlayerColor;
  onRoll: () => void;
}

const FACE_ANGLES: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 180, y: 0 },
};

const PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const readStoredDiceMs = (): number => {
  try {
    const saved = JSON.parse(
      localStorage.getItem('ludo_sastra_settings') || '{}'
    );
    if (saved.gameSpeed === 'turbo') return 300;
    if (saved.gameSpeed === 'fast') return 550;
  } catch {
    // ignore storage errors
  }
  return 900;
};

function DiceFace({ face, transform }: { face: number; transform: string }) {
  const pips = PIP_MAP[face];
  return (
    <div
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1.5 p-2.5 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300 shadow-inner"
      style={{
        transform,
        backfaceVisibility: 'hidden',
      }}
    >
      {Array.from({ length: 9 }).map((_, idx) => {
        const active = pips.includes(idx);
        return (
          <div key={idx} className="flex items-center justify-center">
            {active && (
              <span
                className={`w-3 h-3 rounded-full shadow-inner ${
                  face === 1 || face === 6
                    ? 'bg-gradient-to-br from-rose-500 to-red-700'
                    : 'bg-gradient-to-br from-slate-800 to-slate-950'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  rolling,
  canRoll,
  activeColor,
  onRoll,
}) => {
  const theme = PLAYER_THEMES[activeColor];
  const halfSize = '34px';
  const [spinCount, setSpinCount] = useState(0);
  const [diceMs, setDiceMs] = useState<number>(readStoredDiceMs);
  const prevRollingRef = useRef(false);

  useEffect(() => {
    const syncSpeed = () => setDiceMs(readStoredDiceMs());
    window.addEventListener('sastra-settings-changed', syncSpeed);
    return () =>
      window.removeEventListener('sastra-settings-changed', syncSpeed);
  }, []);

  useEffect(() => {
    if (rolling && !prevRollingRef.current) {
      setSpinCount((prev) => prev + 1);
      setDiceMs(readStoredDiceMs());
    }
    prevRollingRef.current = rolling;
  }, [rolling]);

  const base = FACE_ANGLES[value] || FACE_ANGLES[1];
  const targetX = base.x + spinCount * 720;
  const targetY = base.y + spinCount * 720;
  const targetZ = spinCount * 360;

  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={!canRoll}
      aria-label="Roll 3D Dice"
      className={`relative group flex items-center justify-center w-24 h-24 rounded-3xl transition-all duration-200 ${
        canRoll
          ? 'cursor-pointer hover:scale-105 active:scale-95 ring-2 ring-amber-400/80 shadow-xl'
          : 'cursor-default opacity-95'
      }`}
      style={{
        background: 'radial-gradient(circle at 30% 30%, #1E293B, #0F172A)',
        boxShadow: canRoll ? `0 0 28px ${theme.glow}` : undefined,
      }}
    >
      <div
        className="w-[68px] h-[68px] transition-transform duration-300 ease-out"
        style={{
          perspective: '650px',
          transform: rolling
            ? 'scale(1.14) translateY(-4px)'
            : 'scale(1) translateY(0px)',
        }}
      >
        <div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${targetX}deg) rotateY(${targetY}deg) rotateZ(${targetZ}deg)`,
            transition: rolling
              ? `transform ${diceMs}ms cubic-bezier(0.16, 1, 0.3, 1)`
              : 'transform 220ms ease-out',
            willChange: 'transform',
          }}
        >
          <DiceFace face={1} transform={`rotateY(0deg) translateZ(${halfSize})`} />
          <DiceFace face={6} transform={`rotateY(180deg) translateZ(${halfSize})`} />
          <DiceFace face={3} transform={`rotateY(90deg) translateZ(${halfSize})`} />
          <DiceFace face={4} transform={`rotateY(-90deg) translateZ(${halfSize})`} />
          <DiceFace face={2} transform={`rotateX(90deg) translateZ(${halfSize})`} />
          <DiceFace face={5} transform={`rotateX(-90deg) translateZ(${halfSize})`} />
        </div>
      </div>

      {canRoll && (
        <span className="absolute -bottom-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-400 text-slate-950 shadow">
          Roll
        </span>
      )}
    </button>
  );
};
