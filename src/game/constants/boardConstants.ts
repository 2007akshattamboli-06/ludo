import { PlayerColor, PlayerColorTheme } from '../../types/game';

export const GRID_SIZE = 15;
export const TRACK_LENGTH = 52;
export const HOME_STRETCH_START = 51;
export const HOME_GOAL_STEPS = 56;

export const COLOR_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const PLAYER_THEMES: Record<PlayerColor, PlayerColorTheme> = {
  red: {
    id: 'red',
    name: 'Crimson',
    primary: '#EF4444',
    dark: '#991B1B',
    light: '#FCA5A5',
    glow: 'rgba(239, 68, 68, 0.55)',
    startIndex: 39, // Bottom-left start [6, 13] (going up)
    baseSlots: [
      [1.8, 10.8],
      [3.2, 10.8],
      [1.8, 12.2],
      [3.2, 12.2],
    ],
  },
  green: {
    id: 'green',
    name: 'Emerald',
    primary: '#10B981',
    dark: '#065F46',
    light: '#6EE7B7',
    glow: 'rgba(16, 185, 129, 0.55)',
    startIndex: 0, // Top-left start [1, 6] (going right)
    baseSlots: [
      [1.8, 1.8],
      [3.2, 1.8],
      [1.8, 3.2],
      [3.2, 3.2],
    ],
  },
  yellow: {
    id: 'yellow',
    name: 'Amber',
    primary: '#F59E0B',
    dark: '#92400E',
    light: '#FDE68A',
    glow: 'rgba(245, 158, 11, 0.55)',
    startIndex: 13, // Top-right start [8, 1] (going down)
    baseSlots: [
      [10.8, 1.8],
      [12.2, 1.8],
      [10.8, 3.2],
      [12.2, 3.2],
    ],
  },
  blue: {
    id: 'blue',
    name: 'Cobalt',
    primary: '#3B82F6',
    dark: '#1E40AF',
    light: '#93C5FD',
    glow: 'rgba(59, 130, 246, 0.55)',
    startIndex: 26, // Bottom-right start [13, 8] (going left)
    baseSlots: [
      [10.8, 10.8],
      [12.2, 10.8],
      [10.8, 12.2],
      [12.2, 12.2],
    ],
  },
};

export const MAIN_TRACK_COORDS: [number, number][] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6],
];

export const HOME_STRETCH_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [
    [7, 13], [7, 12], [7, 11], [7, 10], [7, 9],
  ],
  green: [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7],
  ],
  yellow: [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
  ],
  blue: [
    [13, 7], [12, 7], [11, 7], [10, 7], [9, 7],
  ],
};

export const HOME_POCKET_COORDS: Record<PlayerColor, [number, number]> = {
  red: [7, 7.65],
  green: [6.35, 7],
  yellow: [7, 6.35],
  blue: [7.65, 7],
};

export const SAFE_TRACK_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);