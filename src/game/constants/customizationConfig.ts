export type BoardStyleId = 'classic' | 'midnight' | 'emerald' | 'neon';
export type PawnStyleId = 'classic' | 'crown' | 'gem' | 'neon';

export interface BoardThemePreset {
  id: BoardStyleId;
  name: string;
  subtitle: string;
  bgStart: string;
  bgEnd: string;
  gridStroke: string;
  yardInnerBg: string;
  safeCellFill: string;
  safeStarFill: string;
  centerRingBg: string;
  centerRingStroke: string;
  triangleStroke: string;
  slotBgMode: 'light' | 'tinted';
  borderClass: string;
  previewSwatches: [string, string, string];
}

export interface PawnStylePreset {
  id: PawnStyleId;
  name: string;
  subtitle: string;
}

export const BOARD_STYLES: Record<BoardStyleId, BoardThemePreset> = {
  classic: {
    id: 'classic',
    name: 'Classic Sastra',
    subtitle: 'Ivory & Traditional Houses',
    bgStart: '#FFFDF9',
    bgEnd: '#F1ECE1',
    gridStroke: 'rgba(15, 23, 42, 0.14)',
    yardInnerBg: '#FFFDF9',
    safeCellFill: '#E2E8F0',
    safeStarFill: '#64748B',
    centerRingBg: '#0F172A',
    centerRingStroke: '#FBBF24',
    triangleStroke: '#FFFFFF',
    slotBgMode: 'light',
    borderClass: 'border-amber-400/40 bg-[#FFFDF9]',
    previewSwatches: ['#FFFDF9', '#EF4444', '#FACC15'],
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Gold',
    subtitle: 'Obsidian & 24K Gold Lines',
    bgStart: '#111827',
    bgEnd: '#090D16',
    gridStroke: 'rgba(250, 204, 21, 0.24)',
    yardInnerBg: '#0B101B',
    safeCellFill: '#1E293B',
    safeStarFill: '#FACC15',
    centerRingBg: '#090D16',
    centerRingStroke: '#FACC15',
    triangleStroke: 'rgba(250, 204, 21, 0.75)',
    slotBgMode: 'tinted',
    borderClass: 'border-[#FACC15]/70 bg-[#0B0E17]',
    previewSwatches: ['#0B0E17', '#FACC15', '#1E293B'],
  },
  emerald: {
    id: 'emerald',
    name: 'Royal Emerald',
    subtitle: 'Velvet Green & Gold Trim',
    bgStart: '#064E3B',
    bgEnd: '#022C22',
    gridStroke: 'rgba(253, 224, 71, 0.25)',
    yardInnerBg: '#043927',
    safeCellFill: '#065F46',
    safeStarFill: '#FDE047',
    centerRingBg: '#022C22',
    centerRingStroke: '#FDE047',
    triangleStroke: '#FDE047',
    slotBgMode: 'tinted',
    borderClass: 'border-emerald-400/50 bg-[#022C22]',
    previewSwatches: ['#064E3B', '#10B981', '#FDE047'],
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    subtitle: 'Deep Indigo & Electric Grid',
    bgStart: '#090A1A',
    bgEnd: '#13112B',
    gridStroke: 'rgba(56, 189, 248, 0.28)',
    yardInnerBg: '#0D1026',
    safeCellFill: '#1E1B4B',
    safeStarFill: '#38BDF8',
    centerRingBg: '#090A1A',
    centerRingStroke: '#38BDF8',
    triangleStroke: '#38BDF8',
    slotBgMode: 'tinted',
    borderClass: 'border-sky-400/60 bg-[#090A1A]',
    previewSwatches: ['#090A1A', '#38BDF8', '#A855F7'],
  },
};

export const PAWN_STYLES: Record<PawnStyleId, PawnStylePreset> = {
  classic: {
    id: 'classic',
    name: 'Classic 3D',
    subtitle: 'Glossy Sphere & White Ring',
  },
  crown: {
    id: 'crown',
    name: 'Royal Crown',
    subtitle: 'Gold Bezel & Crown Emblem',
  },
  gem: {
    id: 'gem',
    name: 'Crystal Gem',
    subtitle: 'Faceted Diamond Jewel Cut',
  },
  neon: {
    id: 'neon',
    name: 'Cyber Core',
    subtitle: 'Obsidian Core & Neon Halo',
  },
};

export const getStoredCustomization = (): {
  boardStyle: BoardStyleId;
  pawnStyle: PawnStyleId;
} => {
  try {
    const raw = JSON.parse(
      localStorage.getItem('ludo_sastra_settings') || '{}'
    );
    const boardStyle: BoardStyleId =
      raw.boardStyle && raw.boardStyle in BOARD_STYLES
        ? raw.boardStyle
        : 'classic';
    const pawnStyle: PawnStyleId =
      raw.pawnStyle && raw.pawnStyle in PAWN_STYLES ? raw.pawnStyle : 'classic';
    return { boardStyle, pawnStyle };
  } catch {
    return { boardStyle: 'classic', pawnStyle: 'classic' };
  }
};
