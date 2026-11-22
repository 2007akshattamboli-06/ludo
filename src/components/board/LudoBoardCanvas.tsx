import React, { useEffect, useRef } from 'react';
import { Particle, PlayerColor, Token } from '../../types/game';
import { GRID_SIZE } from '../../game/constants/boardConstants';
import {
  renderDynamicLayer,
  renderStaticBoard,
  rotateGridCoords,
} from '../../game/board/boardRenderer';
import { getTokenGridCoords } from '../../game/rules/ludoRules';

interface LudoBoardCanvasProps {
  tokens: Token[];
  validTokens: Token[];
  animatedCoords: Map<string, [number, number]>;
  particles: Particle[];
  perspective?: PlayerColor;
  onSelectToken: (token: Token) => void;
}

export const LudoBoardCanvas: React.FC<LudoBoardCanvasProps> = ({
  tokens,
  validTokens,
  animatedCoords,
  particles,
  perspective = 'red',
  onSelectToken,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement>(null);
  const boardSizeRef = useRef<number>(540);

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const bgCanvas = bgCanvasRef.current;
      const fgCanvas = fgCanvasRef.current;
      if (!container || !bgCanvas || !fgCanvas) return;

      const rect = container.getBoundingClientRect();
      const size = Math.floor(Math.min(rect.width, rect.height));
      if (size <= 0) return;

      boardSizeRef.current = size;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      [bgCanvas, fgCanvas].forEach((canvas) => {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      });

      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        bgCtx.save();
        bgCtx.scale(dpr, dpr);
        renderStaticBoard(bgCtx, size, perspective);
        bgCtx.restore();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [perspective]);

  useEffect(() => {
    let rafId: number;
    const validIds = new Set(validTokens.map((t) => t.id));

    const loop = (time: number) => {
      const fgCanvas = fgCanvasRef.current;
      const size = boardSizeRef.current;
      if (fgCanvas && size > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const ctx = fgCanvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          renderDynamicLayer(
            ctx,
            size,
            tokens,
            validIds,
            animatedCoords,
            particles,
            time,
            perspective
          );
          ctx.restore();
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tokens, validTokens, animatedCoords, particles, perspective]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (validTokens.length === 0) return;
    const canvas = fgCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const cell = rect.width / GRID_SIZE;

    let closest: Token | null = null;
    let minDist = cell * 0.85;

    for (const token of validTokens) {
      const [gx, gy] = rotateGridCoords(getTokenGridCoords(token), perspective);
      const tx = (gx + 0.5) * cell;
      const ty = (gy + 0.5) * cell;
      const dist = Math.hypot(clickX - tx, clickY - ty);
      if (dist < minDist) {
        minDist = dist;
        closest = token;
      }
    }

    if (closest) {
      onSelectToken(closest);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full max-w-[560px] mx-auto rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65)] border-4 border-amber-400/40 bg-[#FFFDF9]"
    >
      <canvas ref={bgCanvasRef} className="absolute inset-0 pointer-events-none" />
      <canvas
        ref={fgCanvasRef}
        onClick={handleCanvasClick}
        className={`relative z-10 block ${validTokens.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
      />
    </div>
  );
};