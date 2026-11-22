export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type GameMode = 'vs-ai' | 'local';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type TurnPhase = 'ROLL' | 'ANIMATING_ROLL' | 'SELECT_TOKEN' | 'MOVING' | 'GAME_OVER';

export interface PlayerColorTheme {
  id: PlayerColor;
  name: string;
  primary: string;
  dark: string;
  light: string;
  glow: string;
  startIndex: number;
  baseSlots: [number, number][];
}

export interface Token {
  id: string;
  color: PlayerColor;
  index: number;
  /**
   * -1 = in base yard
   * 0..50 = steps along outer ring relative to player's startIndex
   * 51..55 = 5 colored home stretch cells
   * 56 = finished in center home pocket
   */
  steps: number;
}

export interface PlayerConfig {
  color: PlayerColor;
  name: string;
  isAI: boolean;
  difficulty?: AIDifficulty;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export interface MoveEvaluation {
  tokenId: string;
  fromSteps: number;
  toSteps: number;
  captures: Token[];
  reachesHome: boolean;
  landsOnSafe: boolean;
  isDeploy: boolean;
}